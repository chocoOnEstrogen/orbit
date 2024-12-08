import { Client, Events, Interaction } from 'discord.js'
import { Bot, Event } from '@/types/bot'
import Logger from '@/classes/logger'
import { generateQuestionImage } from '@/utils/ask-image'
import fs from 'fs'
import path from 'path'
import { BlueskyService } from '@/services/bluesky'
import { supabase } from '@/configs/supabase'

export default {
	name: Events.InteractionCreate,
	once: false,
	async execute(client: Bot<Client>, interaction: Interaction) {
		if (interaction.isChatInputCommand()) {
			const command = client.commands.get(interaction.commandName)
			if (!command) {
				Logger.log(
					'warn',
					`Command ${interaction.commandName} not found`,
					'Commands',
				)
				return
			}

			try {
				await command.execute(interaction)
			} catch (error: any) {
				Logger.log(
					'error',
					`Error executing command ${interaction.commandName}: ${error.message}`,
					'Commands',
				)
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({
						content: 'There was an error while executing this command!',
						ephemeral: true,
					})
				} else {
					await interaction.reply({
						content: 'There was an error while executing this command!',
						ephemeral: true,
					})
				}
			}
		} else if (interaction.isAutocomplete()) {
			const command = client.commands.get(interaction.commandName)

			if (!command) {
				//console.error(`No command matching ${interaction.commandName} was found.`);
				Logger.log(
					'error',
					`No command matching ${interaction.commandName} was found.`,
					'Commands',
				)

				return
			}

			if (!command.autocomplete) return

			try {
				await command.autocomplete(interaction)
			} catch (error) {
				console.error(error)
			}
		} else if (interaction.isModalSubmit()) {
			const modal = interaction.customId.split(':')[0]

			if (modal === 'ask') {
				await interaction.deferReply()
				const questionId = interaction.customId.split(':')[1]
				const response = interaction.fields.getTextInputValue('responseInput')

				const question = await supabase.from('user_questions').select('question').eq('uuid', questionId).single()
				if (!question.data) {
					await interaction.editReply({
						content: 'Question not found',
					})
					return
				}

				try {
					const imagePath = await generateQuestionImage(question.data.question, response)
					const fileData = fs.readFileSync(imagePath.filePath)
					
					const altText = `Question: "${question.data.question}" - Answer: "${response}". This image shows the question and answer in a decorative format with a gradient background and stylized text.`

					await BlueskyService.createPost({
						text: `Want to ask a question? https://choco.rip/ask\n\n${question.data.question}\n\n${response}`,
						tags: [],
						images: [{
							image: `data:image/png;base64,${fileData.toString('base64')}`,
							alt: altText,
							aspectRatio: {
								width: imagePath.width,
								height: imagePath.height
							}
						}]
					})

					// Clean up the temporary file
					fs.unlinkSync(imagePath.filePath)

					// Delete the question from the database
					await supabase.from('user_questions').delete().eq('uuid', questionId)

					await interaction.editReply({
						content: 'Your answer has been posted to Bluesky! ✨',
					})
				} catch (error: any) {
					Logger.log('error', `Failed to post answer: ${error.message}`, 'Commands')
					await interaction.editReply({
						content: 'Failed to post your answer. Please try again later.',
					})
				}
			}
		}
	},
} as Event
