import express, { Request, Response } from 'express'
import cors from 'cors'
import { supabase } from '@/configs/supabase'
import { v4 as uuidv4 } from 'uuid'
import client from '@/index'
import { discordConfig } from '@/configs/discord'
import { TextChannel, EmbedBuilder } from 'discord.js'

const app = express()
const port = process.env.HTTP_PORT || 3000

app.use(cors())
app.use(express.json())

// Route to suggest blacklist tags
app.post(
	'/booru/suggest-blacklist',
	async (req: Request, res: Response): Promise<any> => {
		try {
			const { tags, reason, suggestedBy } = req.body

			if (!tags || !Array.isArray(tags) || tags.length === 0) {
				return res.status(400).json({
					error: 'Invalid tags. Must provide an array of tags.',
				})
			}

			const { error } = await supabase.from('blacklist_suggestions').insert(
				tags.map((tag) => ({
					tag,
					reason: reason || null,
					suggested_by: suggestedBy || null,
					status: 'pending',
				})),
			)

			if (error) {
				console.error('Error storing blacklist suggestion:', error)
				return res.status(500).json({
					error: 'Failed to store suggestion',
				})
			}

			return res.status(201).json({
				message: 'Suggestion received',
				tags,
			})
		} catch (error) {
			console.error('Suggestion endpoint error:', error)
			return res.status(500).json({
				error: 'Internal server error',
			})
		}
	},
)

app.get(
	'/booru/suggestions',
	async (req: Request, res: Response): Promise<any> => {
		try {
			const { status } = req.query

			const { data, error } = await supabase
				.from('blacklist_suggestions')
				.select('*')
				.eq('status', status || 'pending')

			if (error) {
				return res.status(500).json({
					error: 'Internal server error',
				})
			}

			return res.status(200).json(data)
		} catch (error) {
			console.error('Suggestions endpoint error:', error)
			return res.status(500).json({
				error: 'Internal server error',
			})
		}
	},
)

// Health check endpoint
app.get('/health', (_, res: Response): any => {
	res.status(200).json({ status: 'ok' })
})

// This endpoint is used to ask me a question
// app.post('/ask', async (req: Request, res: Response): Promise<any> => {
// 	const { text, tags, response } = req.body
// 	const keyHeader = req.headers['x-api-key']

// 	if (!text || !tags || !response) {
// 		return res.status(400).json({ error: 'Missing required fields', fields: { text, tags, response } })
// 	}

// 	if (keyHeader !== process.env.API_KEY) {
// 		return res.status(401).json({ error: 'Unauthorized' })
// 	}

// 	const textData = `"${text}"\n\n${response}`

// 	await BlueskyService.createPost({ text: textData, tags })

// 	return res.status(200).json({ message: 'Post created' })
// })

app.post('/ask', async (req: Request, res: Response): Promise<any> => {
	const { text } = req.body
	const keyHeader = req.headers['x-api-key']

	if (!text) {
		return res.status(400).json({ error: 'Missing required fields' })
	}
 
	if (keyHeader !== process.env.API_KEY) {
		return res.status(401).json({ error: 'Unauthorized' })
	}

	const uuid = uuidv4()
	await supabase.from('user_questions').insert({ question: text, uuid })

	const embed = new EmbedBuilder()
		.setColor('Blue')
		.setTitle('A new question has been asked!')
		.setDescription(`**${text}**\n\n\n**Ask your question here:** https://www.choco.rip/ask`)
		.setFooter({ text: `UUID: ${uuid}` })
		.setTimestamp(new Date())

	await (client.channels.cache.get(discordConfig.feedChannelId) as TextChannel)?.send({
		embeds: [embed],
	})

	return res.status(200).json({ message: 'Question received' })
})

export function startServer() {
	app.listen(port, () => {
		console.log(`HTTP server listening on port ${port}`)
	})
}
