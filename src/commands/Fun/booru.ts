import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js'
import { Command } from '@/types/bot'
import axios from 'axios'
import { getGlobalBlacklist, getUserBlacklist, addToHistory } from '@/utils/db'

const BOORU_APIS = {
	gelbooru: {
		url: 'https://gelbooru.com/index.php',
		params: (tags: string) => ({
			page: 'dapi',
			s: 'post',
			q: 'index',
			json: 1,
			tags: tags,
			limit: 100,
			api_key: process.env.GELBOORU_API_KEY,
			user_id: process.env.GELBOORU_USER_ID,
		}),
	},
	r34: {
		url: 'https://api.rule34.xxx/index.php',
		params: (tags: string) => ({
			page: 'dapi',
			s: 'post',
			q: 'index',
			json: 1,
			tags: tags,
			limit: 100,
		}),
	},
	danbooru: {
		url: 'https://danbooru.donmai.us/posts.json',
		params: (tags: string) => ({
			tags: tags,
			random: true,
			limit: 100,
		}),
	},
	konachan: {
		url: 'https://konachan.com/post.json',
		params: (tags: string) => ({
			tags: tags,
			limit: 100,
		}),
	},
	yandere: {
		url: 'https://yande.re/post.json',
		params: (tags: string) => ({
			tags: tags,
			limit: 100,
		}),
	},
	safebooru: {
		url: 'https://safebooru.org/index.php',
		params: (tags: string) => ({
			page: 'dapi',
			s: 'post',
			q: 'index',
			json: 1,
			tags: tags,
			limit: 100,
		}),
	},
}

async function getValidPost(posts: any[], maxAttempts = 5) {
	let attempts = 0
	while (attempts < maxAttempts) {
		const post = posts[Math.floor(Math.random() * posts.length)]
		const fileUrl = post.file_url || post.large_file_url || post.file_url
		// Check if it's not a video (common video extensions)
		if (fileUrl && !fileUrl.match(/\.(webm|mp4|mov|avi)$/i)) {
			return { ...post, file_url: fileUrl }
		}
		attempts++
	}
	return null
}

async function fetchFromBooru(site: keyof typeof BOORU_APIS, tags: string) {
	const api = BOORU_APIS[site]
	const response = await axios.get(api.url, { params: api.params(tags) })

	switch (site) {
		case 'danbooru':
		case 'konachan':
		case 'yandere':
			return response.data
		case 'r34':
		case 'gelbooru':
		case 'safebooru':
			return Array.isArray(response.data) ?
					response.data
				:	response.data?.post || []
		default:
			return []
	}
}

export default {
	data: new SlashCommandBuilder()
		.setName('booru')
		.setDescription('Get a random image from various booru sites')
		.setNSFW(true)
		.addStringOption((option) =>
			option
				.setName('site')
				.setDescription('The booru site to search')
				.setRequired(true)
				.addChoices(
					{ name: 'Gelbooru', value: 'gelbooru' },
					{ name: 'Rule34', value: 'r34' },
					{ name: 'Danbooru', value: 'danbooru' },
					{ name: 'Konachan', value: 'konachan' },
					{ name: 'Yande.re', value: 'yandere' },
					{ name: 'Safebooru', value: 'safebooru' },
				),
		)
		.addStringOption((option) =>
			option
				.setName('tags')
				.setDescription('Space-separated tags to search for')
				.setRequired(false),
		)
		.addStringOption((option) =>
			option
				.setName('blacklist')
				.setDescription('Space-separated tags to exclude (e.g., "tag1 tag2")')
				.setRequired(false),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.channel?.isTextBased()) {
			await interaction.reply({
				content: '⚠️ This command can only be used in text-based channels!',
				ephemeral: true,
			})
			return
		}

		await interaction.deferReply({ ephemeral: true })

		try {
			const site = interaction.options.getString(
				'site',
				true,
			) as keyof typeof BOORU_APIS
			const userTags = interaction.options.getString('tags')?.trim() || ''
			const commandBlacklist =
				interaction.options.getString('blacklist')?.trim() || ''

			// Get blacklists from database
			const [globalBlacklist, userBlacklist] = await Promise.all([
				getGlobalBlacklist(),
				getUserBlacklist(interaction.user.id),
			])

			// Process command blacklist tags
			const formattedCommandBlacklist = commandBlacklist
				.split(' ')
				.filter((tag) => tag.length > 0)
				.map((tag) => (tag.startsWith('-') ? tag : `-${tag}`))
				.join(' ')

			// Combine all tags: user tags + command blacklist + user blacklist + global blacklist
			const tags = [
				userTags,
				formattedCommandBlacklist,
				...userBlacklist,
				...globalBlacklist,
			]
				.filter(Boolean)
				.join(' ')
				.trim()

			const posts = await fetchFromBooru(site, tags)

			if (!posts || (Array.isArray(posts) && posts.length === 0)) {
				await interaction.editReply('No results found for those tags.')
				return
			}

			const validPost = await getValidPost(posts)

			if (!validPost) {
				await interaction.editReply(
					'No valid image posts found. Try different tags.',
				)
				return
			}

			// Store in history
			await addToHistory(
				interaction.user.id,
				site,
				userTags.split(' ').filter(Boolean),
				validPost.file_url,
			)

			const embed = new EmbedBuilder()
				.setColor('#FF69B4')
				.setImage(validPost.file_url)
				.setFooter({ text: `Tags: ${validPost.tags?.slice(0, 100)}...` })
				.setTimestamp()

			await interaction.editReply({ embeds: [embed] })
		} catch (error) {
			console.error('Booru command error:', error)
			await interaction.editReply(
				'Failed to fetch image. Please try again later.',
			)
		}
	},
} as Command
