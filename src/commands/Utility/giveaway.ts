import {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	EmbedBuilder,
} from 'discord.js'
import { Command } from '@/types/bot'
import { supabase } from '@/configs/supabase'
import ms from 'ms'

export default {
	data: new SlashCommandBuilder()
		.setName('giveaway')
		.setDescription('Start or manage giveaways')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('start')
				.setDescription('Start a new giveaway')
				.addStringOption((option) =>
					option
						.setName('prize')
						.setDescription('What are you giving away?')
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName('duration')
						.setDescription('How long should the giveaway last? (e.g., 1h, 1d)')
						.setRequired(true),
				)
				.addIntegerOption((option) =>
					option
						.setName('winners')
						.setDescription('Number of winners')
						.setMinValue(1)
						.setMaxValue(10)
						.setRequired(false),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('end')
				.setDescription('End a giveaway early')
				.addStringOption((option) =>
					option
						.setName('message_id')
						.setDescription('ID of the giveaway message')
						.setRequired(true),
				),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand()

		if (subcommand === 'start') {
			const prize = interaction.options.getString('prize', true)
			const duration = interaction.options.getString('duration', true)
			const winners = interaction.options.getInteger('winners') || 1

			const durationMs = ms(duration)
			if (!durationMs) {
				return interaction.reply({
					content: 'Invalid duration format! Use formats like: 1h, 30m, 1d',
					ephemeral: true,
				})
			}

			const endsAt = new Date(Date.now() + durationMs)

			const embed = new EmbedBuilder()
				.setTitle('🎉 GIVEAWAY 🎉')
				.setDescription(
					`
          **Prize:** ${prize}
          **Winners:** ${winners}
          **Ends:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>
          
          React with 🎉 to enter!
        `,
				)
				.setColor('#FF9300')
				.setFooter({ text: `Hosted by ${interaction.user.tag}` })

			const message = await interaction.reply({
				embeds: [embed],
				fetchReply: true,
			})
			await message.react('🎉')

			// Store giveaway in database
			await supabase.from('giveaways').insert({
				message_id: message.id,
				channel_id: interaction.channelId,
				prize,
				winner_count: winners,
				host_id: interaction.user.id,
				ends_at: endsAt.toISOString(),
			})
		} else if (subcommand === 'end') {
			const messageId = interaction.options.getString('message_id', true)
			await endGiveaway(interaction, messageId)
		}
	},
} as Command

async function endGiveaway(
	interaction: ChatInputCommandInteraction,
	messageId: string,
) {
	const { data: giveaway } = await supabase
		.from('giveaways')
		.select('*')
		.eq('message_id', messageId)
		.single()

	if (!giveaway || giveaway.ended) {
		return interaction.reply({
			content: 'Giveaway not found or already ended!',
			ephemeral: true,
		})
	}

	try {
		const message = await interaction.channel?.messages.fetch(messageId)
		if (!message) throw new Error('Message not found')

		const reaction = message.reactions.cache.get('🎉')
		if (!reaction) throw new Error('Reaction not found')

		const users = await reaction.users.fetch()
		const validParticipants = users.filter((user) => !user.bot)

		if (validParticipants.size < 1) {
			await interaction.reply('No valid participants found!')
			return
		}

		const winners = validParticipants.random(
			Math.min(giveaway.winner_count, validParticipants.size),
		)

		const winnerAnnouncement = new EmbedBuilder()
			.setTitle('🎉 Giveaway Ended! 🎉')
			.setDescription(
				`
        **Prize:** ${giveaway.prize}
        **Winners:** ${winners.map((w) => `<@${w.id}>`).join(', ')}
      `,
			)
			.setColor('#00FF00')
			.setFooter({ text: `Giveaway ID: ${messageId}` })

		await interaction.reply({ embeds: [winnerAnnouncement] })

		// Update giveaway as ended
		await supabase
			.from('giveaways')
			.update({ ended: true })
			.eq('message_id', messageId)
	} catch (error) {
		await interaction.reply({
			content: 'Failed to end giveaway!',
			ephemeral: true,
		})
	}
}
