import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Command } from '@/types/bot'

export default {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription("Check the bot's latency"),

	async execute(interaction: ChatInputCommandInteraction) {
		const sent = await interaction.reply({
			content: 'Pinging...',
			fetchReply: true,
		})
		const latency = sent.createdTimestamp - interaction.createdTimestamp
		await interaction.editReply(
			`Pong! 🏓\nBot Latency: ${latency}ms\nAPI Latency: ${interaction.client.ws.ping}ms`,
		)
	},
} as Command
