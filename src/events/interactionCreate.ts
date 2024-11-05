import { Client, Events, Interaction } from 'discord.js'
import { Bot, Event } from '@/types/bot'
import Logger from '@/classes/logger'

export default {
	name: Events.InteractionCreate,
	once: false,
	async execute(client: Bot<Client>, interaction: Interaction) {
		if (!interaction.isChatInputCommand()) return

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
	},
} as Event
