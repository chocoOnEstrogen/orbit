import { Client, TextChannel } from 'discord.js'
import { supabase } from '@/configs/supabase'
import Logger from '@/classes/logger'

export class ReminderService {
	private client: Client
	private interval: NodeJS.Timeout | null = null

	constructor(client: Client) {
		this.client = client
	}

	start() {
		// Check for reminders every minute
		this.interval = setInterval(() => this.checkReminders(), 60000)
		Logger.log('info', 'Reminder service started', 'ReminderService')
	}

	async checkReminders() {
		const { data: reminders, error } = await supabase
			.from('reminders')
			.select('*')
			.lte('remind_at', new Date().toISOString())

		if (error) {
			Logger.log(
				'error',
				`Failed to fetch reminders: ${error.message}`,
				'ReminderService',
			)
			return
		}

		for (const reminder of reminders) {
			try {
				const channel = (await this.client.channels.fetch(
					reminder.channel_id,
				)) as TextChannel
				await channel.send({
					content: `<@${reminder.user_id}>, here's your reminder: ${reminder.message}`,
				})

				// Delete the reminder after sending
				await supabase.from('reminders').delete().eq('id', reminder.id)
			} catch (error: any) {
				Logger.log(
					'error',
					`Failed to send reminder: ${error.message}`,
					'ReminderService',
				)
			}
		}
	}

	stop() {
		if (this.interval) {
			clearInterval(this.interval)
			this.interval = null
			Logger.log('info', 'Reminder service stopped', 'ReminderService')
		}
	}
}
