import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Command } from '@/types/bot'

export default {
	data: new SlashCommandBuilder()
		.setName('random')
		.setDescription('Generate a random number')
		.addIntegerOption((option) =>
			option
				.setName('min')
				.setDescription('Minimum number (default: 1)')
				.setRequired(false),
		)
		.addIntegerOption((option) =>
			option
				.setName('max')
				.setDescription('Maximum number (default: 100)')
				.setRequired(false),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const min = interaction.options.getInteger('min') ?? 1
		const max = interaction.options.getInteger('max') ?? 100

		if (min >= max) {
			await interaction.reply({
				content: 'The minimum number must be less than the maximum number!',
				ephemeral: true,
			})
			return
		}

		const result = Math.floor(Math.random() * (max - min + 1)) + min
		await interaction.reply(
			`🎲 Random number between ${min} and ${max}: **${result}**`,
		)
	},
} as Command
