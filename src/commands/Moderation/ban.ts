import {
	ChatInputCommandInteraction,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from 'discord.js'
import { Command } from '@/types/bot'

export default {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a user from the server')
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('The user to ban')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('reason')
				.setDescription('Reason for the ban')
				.setRequired(false),
		)
		.addNumberOption((option) =>
			option
				.setName('days')
				.setDescription('Number of days of messages to delete')
				.setMinValue(0)
				.setMaxValue(7)
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

	async execute(interaction: ChatInputCommandInteraction) {
		const target = interaction.options.getUser('user', true)
		const reason =
			interaction.options.getString('reason') ?? 'No reason provided'
		const days = interaction.options.getNumber('days') ?? 0

		const member = interaction.guild?.members.cache.get(target.id)

		if (!member) {
			await interaction.reply({
				content: 'User not found in this server!',
				ephemeral: true,
			})
			return
		}

		if (!member.bannable) {
			await interaction.reply({
				content: 'I cannot ban this user!',
				ephemeral: true,
			})
			return
		}

		await member.ban({
			deleteMessageDays: days,
			reason: `${reason} - Banned by ${interaction.user.tag}`,
		})
		await interaction.reply(`🔨 **Banned ${target.tag}**\nReason: ${reason}`)
	},
} as Command
