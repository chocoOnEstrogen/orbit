import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Command } from '@/types/bot'
import { supabase } from '@/configs/supabase'
import ms from 'ms'

export default {
	data: new SlashCommandBuilder()
		.setName('remind')
		.setDescription('Set a reminder')
		.addStringOption((option) =>
			option
				.setName('time')
				.setDescription('When to remind you (e.g., 1h, 30m, 1d)')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('message')
				.setDescription('What to remind you about')
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const timeStr = interaction.options.getString('time', true)
		const message = interaction.options.getString('message', true)

		// Convert time string to milliseconds
		const timeMs = ms(timeStr)
		if (!timeMs) {
			return interaction.reply({
				content: 'Invalid time format! Use formats like: 1h, 30m, 1d',
				ephemeral: true,
			})
		}

		const remindAt = new Date(Date.now() + timeMs)

		// Store reminder in database
		const { error } = await supabase.from('reminders').insert({
			user_id: interaction.user.id,
			channel_id: interaction.channelId,
			message: message,
			remind_at: remindAt.toISOString(),
		})

		if (error) {
			return interaction.reply({
				content: 'Failed to set reminder!',
				ephemeral: true,
			})
		}

		await interaction.reply({
			content: `I'll remind you about "${message}" ${timeStr} from now!`,
			ephemeral: true,
		})
	},
} as Command
