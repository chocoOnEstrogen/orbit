import { Client, TextChannel, EmbedBuilder } from 'discord.js'
import { supabase } from '@/configs/supabase'
import Logger from '@/classes/logger'

export class GiveawayService {
	private client: Client
	private interval: NodeJS.Timeout | null = null

	constructor(client: Client) {
		this.client = client
	}

	start() {
		// Check for ended giveaways every minute
		this.interval = setInterval(() => this.checkGiveaways(), 60000)
		Logger.log('info', 'Giveaway service started', 'GiveawayService')
	}

	async checkGiveaways() {
		const { data: giveaways, error } = await supabase
			.from('giveaways')
			.select('*')
			.eq('ended', false)
			.lte('ends_at', new Date().toISOString())

		if (error) {
			Logger.log(
				'error',
				`Failed to fetch giveaways: ${error.message}`,
				'GiveawayService',
			)
			return
		}

		for (const giveaway of giveaways) {
			try {
				const channel = (await this.client.channels.fetch(
					giveaway.channel_id,
				)) as TextChannel
				const message = await channel.messages.fetch(giveaway.message_id)

				const reaction = message.reactions.cache.get('🎉')
				if (!reaction) throw new Error('Reaction not found')

				const users = await reaction.users.fetch()
				const validParticipants = users.filter((user) => !user.bot)

				if (validParticipants.size < 1) {
					await channel.send(
						`No valid participants for giveaway: ${giveaway.prize}`,
					)
					continue
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
					.setFooter({ text: `Giveaway ID: ${giveaway.message_id}` })

				await channel.send({ embeds: [winnerAnnouncement] })

				// Update giveaway as ended
				await supabase
					.from('giveaways')
					.update({ ended: true })
					.eq('message_id', giveaway.message_id)
			} catch (error: any) {
				Logger.log(
					'error',
					`Failed to end giveaway: ${error.message}`,
					'GiveawayService',
				)
			}
		}
	}

	stop() {
		if (this.interval) {
			clearInterval(this.interval)
			this.interval = null
			Logger.log('info', 'Giveaway service stopped', 'GiveawayService')
		}
	}
}
