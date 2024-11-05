import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Command } from '@/types/bot'
import axios from 'axios'

export default {
	data: new SlashCommandBuilder()
		.setName('joke')
		.setDescription('Get a random joke')
		.addStringOption((option) =>
			option
				.setName('category')
				.setDescription('Joke category')
				.addChoices(
					{ name: 'Programming', value: 'programming' },
					{ name: 'General', value: 'general' },
					{ name: 'Pun', value: 'pun' },
				)
				.setRequired(false),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const category = interaction.options.getString('category') ?? 'any'

		try {
			const response = await axios.get(
				`https://v2.jokeapi.dev/joke/${category}?safe-mode`,
			)
			const joke = response.data

			if (joke.type === 'single') {
				await interaction.reply(`😄 ${joke.joke}`)
			} else {
				await interaction.reply(`😄 ${joke.setup}\n\n||${joke.delivery}||`)
			}
		} catch (error) {
			await interaction.reply('Failed to fetch a joke. Please try again later.')
		}
	},
} as Command
