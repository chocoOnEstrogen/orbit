import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js'
import { Command } from '@/types/bot'

export default {
	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('Get information about a user')
		.addUserOption((option) =>
			option
				.setName('target')
				.setDescription('The user to get info about')
				.setRequired(false),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const target = interaction.options.getUser('target') ?? interaction.user
		const member = interaction.guild?.members.cache.get(target.id)

		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('User Information')
			.setThumbnail(target.displayAvatarURL())
			.addFields(
				{ name: 'Username', value: target.username, inline: true },
				{ name: 'ID', value: target.id, inline: true },
				{
					name: 'Account Created',
					value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
					inline: true,
				},
				{
					name: 'Joined Server',
					value:
						member ?
							`<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>`
						:	'N/A',
					inline: true,
				},
				{
					name: 'Roles',
					value:
						member ?
							member.roles.cache.map((role) => role.toString()).join(', ')
						:	'N/A',
				},
			)
			.setTimestamp()

		await interaction.reply({ embeds: [embed] })
	},
} as Command
