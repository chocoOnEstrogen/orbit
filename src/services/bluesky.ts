import { BskyAgent } from '@atproto/api'
import { EmbedBuilder, TextChannel, Message } from 'discord.js'
import { discordConfig } from '@/configs/discord'
import { Bot } from '@/types/bot'
import { Client } from 'discord.js'
import Logger from '@/classes/logger'

interface Post {
	text: string
	tags: string[]
	images?: {
		alt: string
		image: string
		aspectRatio: {
			width: number
			height: number
		}
	}[]
}

function convertDataURIToUint8Array(dataURI: string): Uint8Array {
	const base64 = dataURI.split(',')[1];
	const binary = atob(base64);
	const array = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		array[i] = binary.charCodeAt(i);
	}
	return array;
}

export class BlueskyService {
	private agent: BskyAgent
	private client: Bot<Client>
	private interval: NodeJS.Timeout | null = null
	private lastPostId: string | null = null

	constructor(client: Bot<Client>) {
		this.client = client
		this.agent = new BskyAgent({
			service: 'https://bsky.social',
		})
	}

	async init() {
		try {
			await this.agent.login({
				identifier: process.env.BLUESKY_IDENTIFIER!,
				password: process.env.BLUESKY_PASSWORD!,
			})
			Logger.log('info', 'Successfully logged into Bluesky', 'BlueskyService')
			this.startPolling()
		} catch (error: any) {
			Logger.log(
				'error',
				`Failed to login to Bluesky: ${error.message}`,
				'BlueskyService',
			)
		}
	}

	static async createPost(postData: Post) {
		if (postData.images && postData.images.length > 4) {
			throw new Error('Bluesky does not support more than 4 images per post')
		}

		try {
			const agent = new BskyAgent({
				service: 'https://bsky.social',
			})
	
			await agent.login({
				identifier: process.env.BLUESKY_IDENTIFIER!,
				password: process.env.BLUESKY_PASSWORD!,
			})

			const data: any = {
				text: postData.text,
				tags: postData.tags,
				createdAt: new Date().toISOString(),
			}

			if (postData.images && postData.images.length > 0) {
				const uploadedImages = await Promise.all(
					postData.images.map(async (img) => {
						const { data: uploadData } = await agent.uploadBlob(
							convertDataURIToUint8Array(img.image),
							{ encoding: 'image/png' }
						)
						return {
							alt: img.alt,
							image: uploadData.blob,
							aspectRatio: img.aspectRatio
						}
					})
				)

				data.embed = {
					$type: 'app.bsky.embed.images',
					images: uploadedImages
				}
			}
	
			await agent.post(data)

			await agent.logout()
		} catch (error: any) {
			Logger.log(
				'error',
				`Failed to create post on Bluesky: ${error.message}`,
				'BlueskyService',
			)
		}
	}

	private async startPolling() {
		const interval = Number(process.env.BLUESKY_FEED_INTERVAL) || 60000 // Default to 1 minute

		this.interval = setInterval(async () => {
			try {
				await this.checkForNewPosts()
			} catch (error: any) {
				Logger.log(
					'error',
					`Error checking Bluesky posts: ${error.message}`,
					'BlueskyService',
				)
			}
		}, interval)

		Logger.log(
			'info',
			`Started polling Bluesky feed every ${interval}ms`,
			'BlueskyService',
		)
	}

	private async checkForNewPosts() {
		try {
			const profile = await this.agent.getProfile({
				actor: process.env.BLUESKY_IDENTIFIER!,
			})

			const feed = await this.agent.getAuthorFeed({
				actor: profile.data.did,
				limit: 1,
			})

			const latestPost = feed.data.feed[0]
			if (
				!latestPost ||
				(this.lastPostId && latestPost.post.cid === this.lastPostId)
			) {
				return
			}

			this.lastPostId = latestPost.post.cid

			// Only process if this isn't our first run
			if (this.lastPostId) {
				await this.sendDiscordEmbed(latestPost)
			}
		} catch (error: any) {
			Logger.log(
				'error',
				`Error fetching Bluesky feed: ${error.message}`,
				'BlueskyService',
			)
		}
	}

	private async isDuplicatePost(
		channel: TextChannel,
		postUrl: string,
	): Promise<boolean> {
		try {
			// Fetch last 100 messages from the channel
			const messages = await channel.messages.fetch({ limit: 100 })

			// Check if any message contains this post URL
			return messages.some((message) =>
				message.embeds.some((embed) => embed.url === postUrl),
			)
		} catch (error: any) {
			Logger.log(
				'error',
				`Error checking for duplicate posts: ${error.message}`,
				'BlueskyService',
			)
			return false
		}
	}

	private async sendDiscordEmbed(post: any) {
		const channel = (await this.client.channels.fetch(
			discordConfig.feedChannelId,
		)) as TextChannel
		if (!channel?.isTextBased()) {
			Logger.log(
				'error',
				'Feed channel not found or is not a text channel',
				'BlueskyService',
			)
			return
		}

		const postUrl = `https://bsky.app/profile/${post.post.author.handle}/post/${post.post.uri.split('/').pop()}`

		// Check if this post has already been sent
		if (await this.isDuplicatePost(channel, postUrl)) {
			Logger.log(
				'debug',
				`Skipping duplicate post: ${postUrl}`,
				'BlueskyService',
			)
			return
		}

		const embed = new EmbedBuilder()
			.setColor('#0085ff')
			.setAuthor({
				name: post.post.author.displayName || post.post.author.handle,
				iconURL: post.post.author.avatar || undefined,
				url: `https://bsky.app/profile/${post.post.author.handle}`,
			})
			.setURL(postUrl)
			.setTitle('New Bluesky Post! 🔵☁️')
			.setDescription(post.post.record.text)
			.setTimestamp(new Date(post.post.indexedAt))
			.setFooter({
				text: 'Posted on Bluesky',
				iconURL: 'https://bsky.app/static/favicon-32x32.png',
			})

		// Add images if present
		if (post.post.embed?.images?.length > 0) {
			embed.setImage(post.post.embed.images[0].fullsize)
		}

		await channel.send({ embeds: [embed] })
		Logger.log('debug', `Sent new Bluesky post: ${postUrl}`, 'BlueskyService')
	}

	stop() {
		if (this.interval) {
			clearInterval(this.interval)
			this.interval = null
			Logger.log('info', 'Stopped Bluesky feed polling', 'BlueskyService')
		}
	}
}
