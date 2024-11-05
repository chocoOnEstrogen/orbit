import {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	EmbedBuilder,
} from 'discord.js'
import { Command } from '@/types/bot'

export default {
	data: new SlashCommandBuilder()
		.setName('poll')
		.setDescription('Create a poll')
		.addStringOption((option) =>
			option
				.setName('question')
				.setDescription('The poll question')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('options')
				.setDescription('Poll options (comma-separated)')
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const question = interaction.options.getString('question', true)
		const options = interaction.options
			.getString('options', true)
			.split(',')
			.map((opt) => opt.trim())

		if (options.length < 2 || options.length > 10) {
			return interaction.reply({
				content: 'Please provide between 2 and 10 options!',
				ephemeral: true,
			})
		}

		const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

		const embed = new EmbedBuilder()
			.setTitle('📊 ' + question)
			.setDescription(
				options.map((opt, i) => `${emojis[i]} ${opt}`).join('\n\n'),
			)
			.setColor('#FF9300')
			.setFooter({ text: `Poll created by ${interaction.user.tag}` })

		const message = await interaction.reply({
			embeds: [embed],
			fetchReply: true,
		})

		for (let i = 0; i < options.length; i++) {
			await message.react(emojis[i])
		}
	},
} as Command
