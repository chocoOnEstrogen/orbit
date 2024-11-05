import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Command } from '@/types/bot'

export default {
	data: new SlashCommandBuilder()
		.setName('echo')
		.setDescription('Echoes your message back to you')
		.addStringOption((option) =>
			option
				.setName('message')
				.setDescription('The message to echo')
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const message = interaction.options.getString('message', true)
		await interaction.reply(message)
	},
} as Command
