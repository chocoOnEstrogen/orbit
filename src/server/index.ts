import express, { Request, Response } from 'express'
import cors from 'cors'
import { supabase } from '@/configs/supabase'

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

export function startServer() {
	app.listen(port, () => {
		console.log(`HTTP server listening on port ${port}`)
	})
}
