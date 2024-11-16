import { Collection, Client, GatewayIntentBits } from 'discord.js'
import { Bot } from '@/types/bot'
import { config as dotenv } from 'dotenv'
import { loadCommands, loadEvents, commands, events } from '@/utils/collection'
import { join } from 'node:path'
import Logger from './classes/logger'
import { BlueskyService } from '@/services/bluesky'
import { startServer } from './server'
import { ReminderService } from './services/reminderService'
import { GiveawayService } from '@/services/giveawayService'

dotenv() // Load environment variables first
const token = process.env.DISCORD_BOT_TOKEN

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildVoiceStates,
	],
	allowedMentions: {
		parse: ['everyone', 'roles', 'users'],
		repliedUser: true,
	},
}) as Bot<Client>

// Initialize the commands Collection
client.commands = new Collection()

// Load commands first
loadCommands(join(__dirname, 'commands'))
// Set the commands to the client
client.commands = commands

// Then load events
loadEvents(join(__dirname, 'events'), client)

const blueskyService = new BlueskyService(client)

const reminderService = new ReminderService(client)

const giveawayService = new GiveawayService(client)
giveawayService.start()

// Add error handling for login
client
	.login(token)
	.then(() => {
		// Initialize Bluesky service after successful login
		blueskyService.init().catch(error => {
		     Logger.log('error', `Failed to initialize Bluesky service: ${error.message}`, 'Client');
		 });

		// Start reminder service after successful login
		reminderService.start()
	})
	.catch((error) => {
		Logger.log('error', `Failed to login: ${error.message}`, 'Client')
		process.exit(1)
	})

// Add some basic error handlers
client.on('error', (error) => {
	Logger.log('error', `Client error: ${error.message}`, 'Client')
})

process.on('unhandledRejection', (error) => {
	Logger.log('error', `Unhandled rejection: ${error}`, 'Process')
})

// Add cleanup for Bluesky service
process.on('SIGINT', () => {
	Logger.log('info', 'Shutting down...', 'Process')
	blueskyService.stop();
	process.exit(0)
})

// Add cleanup for reminder service
process.on('SIGINT', () => {
	Logger.log('info', 'Shutting down...', 'Process')
	reminderService.stop()
	process.exit(0)
})

// Start the HTTP server
startServer()
