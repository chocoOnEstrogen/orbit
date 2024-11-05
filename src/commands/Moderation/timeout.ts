import {
	ChatInputCommandInteraction,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from 'discord.js'
import { Command } from '@/types/bot'

export default {
	data: new SlashCommandBuilder()
		.setName('timeout')
		.setDescription('Timeout a user')
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('The user to timeout')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('duration')
				.setDescription('Timeout duration (e.g., 1h, 30m, 1d)')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('reason')
				.setDescription('Reason for the timeout')
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

	async execute(interaction: ChatInputCommandInteraction) {
		const target = interaction.options.getUser('user', true)
		const durationStr = interaction.options.getString('duration', true)
		const reason =
			interaction.options.getString('reason') ?? 'No reason provided'

		const durationMatch = durationStr.match(/^(\d+)([hmd])$/)
		if (!durationMatch) {
			await interaction.reply({
				content: 'Invalid duration format! Use format like: 1h, 30m, or 1d',
				ephemeral: true,
			})
			return
		}

		const [, amount, unit] = durationMatch
		const multiplier =
			unit === 'h' ? 3600000
			: unit === 'm' ? 60000
			: 86400000
		const duration = parseInt(amount) * multiplier

		if (duration > 2419200000) {
			// 28 days in milliseconds
			await interaction.reply({
				content: 'Timeout duration cannot be longer than 28 days!',
				ephemeral: true,
			})
			return
		}

		const member = interaction.guild?.members.cache.get(target.id)

		if (!member) {
			await interaction.reply({
				content: 'User not found in this server!',
				ephemeral: true,
			})
			return
		}

		if (!member.moderatable) {
			await interaction.reply({
				content: 'I cannot timeout this user!',
				ephemeral: true,
			})
			return
		}

		await member.timeout(
			duration,
			`${reason} - Muted by ${interaction.user.tag}`,
		)
		await interaction.reply(`🔇 **Timed out ${target.tag}**\nReason: ${reason}`)
	},
} as Command
