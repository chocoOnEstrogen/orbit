import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Command } from '@/types/bot'

export default {
	data: new SlashCommandBuilder()
		.setName('8ball')
		.setDescription('Ask the magic 8ball a question')
		.addStringOption((option) =>
			option
				.setName('question')
				.setDescription('Your question for the 8ball')
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const responses = [
			'It is certain.',
			'It is decidedly so.',
			'Without a doubt.',
			'Yes, definitely.',
			'You may rely on it.',
			'As I see it, yes.',
			'Most likely.',
			'Outlook good.',
			'Yes.',
			'Signs point to yes.',
			'Reply hazy, try again.',
			'Ask again later.',
			'Better not tell you now.',
			'Cannot predict now.',
			'Concentrate and ask again.',
			"Don't count on it.",
			'My reply is no.',
			'My sources say no.',
			'Outlook not so good.',
			'Very doubtful.',
		]

		const question = interaction.options.getString('question', true)
		const response = responses[Math.floor(Math.random() * responses.length)]

		await interaction.reply(
			`🎱 **Question:** ${question}\n**Answer:** ${response}`,
		)
	},
} as Command
