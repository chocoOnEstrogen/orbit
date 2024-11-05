import { Client, Events } from 'discord.js'
import { Bot, Event } from '@/types/bot'
import Logger from '@/classes/logger'

export default {
	name: Events.ClientReady,
	once: true,
	execute(client: Bot<Client>) {
		Logger.log('info', `Logged in as ${client.user?.tag}`, 'Client')
	},
} as Event
