import {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	GuildMember,
	ChannelType,
} from 'discord.js'
import { Command } from '@/types/bot'
import {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	AudioPlayerStatus,
	VoiceConnectionStatus,
	entersState,
} from '@discordjs/voice'

export default {
	data: new SlashCommandBuilder()
		.setName('play-sound')
		.setDescription('Play a sound file in your voice channel')
		.addAttachmentOption((option) =>
			option
				.setName('sound')
				.setDescription('The sound file to play (MP3, WAV, OGG, etc.)')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('volume')
				.setDescription('The volume of the sound file (0-100)')
				.setRequired(false),
		)
		.addChannelOption((option) =>
			option
				.setName('channel')
				.setDescription('The channel to play the sound in')
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(false),
		),
	async execute(interaction: ChatInputCommandInteraction) {
		// Get the target voice channel (either specified or user's current channel)
		const targetChannel =
			interaction.options.getChannel('channel') ||
			(interaction.member instanceof GuildMember ?
				interaction.member.voice.channel
			:	null)

		if (!targetChannel) {
			return interaction.reply({
				content:
					'You need to be in a voice channel or specify a voice channel!',
				ephemeral: true,
			})
		}

		const attachment = interaction.options.getAttachment('sound', true)
		const volumeOption = interaction.options.getString('volume')
		const volume =
			volumeOption ? Math.min(Math.max(parseInt(volumeOption) / 100, 0), 1) : 1

		// Validate file type
		if (!attachment.contentType?.includes('audio')) {
			return interaction.reply({
				content: 'Please upload a valid audio file!',
				ephemeral: true,
			})
		}

		try {
			// Join the voice channel
			const connection = joinVoiceChannel({
				channelId: targetChannel.id,
				guildId: interaction.guildId!,
				adapterCreator: interaction.guild!.voiceAdapterCreator as any,
			})

			// Create audio player and resource with volume
			const player = createAudioPlayer()
			const resource = createAudioResource(attachment.url, {
				inlineVolume: true,
			})

			if (resource.volume) {
				resource.volume.setVolume(volume)
			}

			// Handle connection ready
			connection.on(VoiceConnectionStatus.Ready, () => {
				player.play(resource)
				connection.subscribe(player)
			})

			// Handle when audio finishes playing
			player.on(AudioPlayerStatus.Idle, () => {
				connection.destroy()
			})

			// Handle errors
			connection.on('error', (error) => {
				console.error('Voice connection error:', error)
				connection.destroy()
			})

			player.on('error', (error) => {
				console.error('Audio player error:', error)
				connection.destroy()
			})

			// Wait for connection to be ready
			await entersState(connection, VoiceConnectionStatus.Ready, 5000)

			await interaction.reply({
				content: '🎵 Playing your sound!',
				ephemeral: true,
			})
		} catch (error) {
			console.error('Error playing sound:', error)
			await interaction.reply({
				content: 'Failed to play the sound file!',
				ephemeral: true,
			})
		}
	},
} as Command
