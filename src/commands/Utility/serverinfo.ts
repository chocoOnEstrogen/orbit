import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js'
import { Command } from '@/types/bot'

export default {
	data: new SlashCommandBuilder()
		.setName('serverinfo')
		.setDescription('Get information about the server'),

	async execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) {
			await interaction.reply({
				content: 'This command can only be used in a server!',
				ephemeral: true,
			})
			return
		}

		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle(interaction.guild.name)
			.setThumbnail(interaction.guild.iconURL() ?? '')
			.addFields(
				{
					name: 'Owner',
					value: `<@${interaction.guild.ownerId}>`,
					inline: true,
				},
				{
					name: 'Members',
					value: interaction.guild.memberCount.toString(),
					inline: true,
				},
				{
					name: 'Created',
					value: `<t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:R>`,
					inline: true,
				},
				{
					name: 'Channels',
					value: interaction.guild.channels.cache.size.toString(),
					inline: true,
				},
				{
					name: 'Roles',
					value: interaction.guild.roles.cache.size.toString(),
					inline: true,
				},
				{
					name: 'Boost Level',
					value: interaction.guild.premiumTier.toString(),
					inline: true,
				},
			)
			.setTimestamp()

		await interaction.reply({ embeds: [embed] })
	},
} as Command
