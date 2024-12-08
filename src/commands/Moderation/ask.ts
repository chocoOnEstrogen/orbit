import {
	ChatInputCommandInteraction,
	PermissionFlagsBits,
	SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
} from 'discord.js'
import { Command } from '@/types/bot'
import { supabase } from '@/configs/supabase'
import Logger from '@/classes/logger'
import { BlueskyService } from '@/services/bluesky'


export default {
	data: new SlashCommandBuilder()
		.setName('ask')
		.setDescription('Answer a question from users')
        .addStringOption((option) =>
            option
                .setName('question')
                .setDescription('The question to answer')
                .setRequired(true)
                .setAutocomplete(true),
        )
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        async autocomplete(interaction: any) {
            const focusedValue = interaction.options.getFocused()
            const { data, error } = await supabase
                .from('user_questions')
				.select('question, uuid')
				.limit(40)

		if (error) {
                Logger.log(
                    'error',
                    `Error fetching questions: ${error.message}`,
                    'Commands',
                )
                return
            }

			const choices = data.map((question) => ({
				name: question.question,
				value: question.uuid,
			}))

            const filteredChoices = choices.filter((choice) =>
                choice.name.toLowerCase().includes(focusedValue.toLowerCase()),
            )
    
            await interaction.respond(
				filteredChoices.map((choice) => ({
					name: choice.name,
					value: choice.value,
				})),
			)
        },
	async execute(interaction: ChatInputCommandInteraction) {
		const question = interaction.options.getString('question')

		if (!question) {
			return interaction.reply({
				content: 'No question provided',
			})
		}

        // Check if the question exists
        const { data, error } = await supabase
            .from('user_questions')
            .select('question, uuid')
            .eq('uuid', question)

		if (error) {
			Logger.log(
				'error',
				`Error fetching question: ${error.message}`,
				'Commands',
			)
			return
		}

		const modal = new ModalBuilder()
			.setCustomId(`ask:${question}`)
			.setTitle('Answer a question')

		const responseInput = new TextInputBuilder()
			.setCustomId('responseInput')
			.setLabel('Your response to the question')
			.setStyle(TextInputStyle.Paragraph)

		const modalActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
			responseInput,
		)

		modal.addComponents(modalActionRow)

		await interaction.showModal(modal)

        return;
	},
} as Command
