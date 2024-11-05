import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
	Collection,
} from 'discord.js'
import { Command } from '@/types/bot'

export default {
	data: new SlashCommandBuilder()
		.setName('roleinfo')
		.setDescription('Get information about a role')
		.addRoleOption((option) =>
			option
				.setName('role')
				.setDescription('The role to get info about')
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const role = interaction.options.getRole('role', true)

		let members = interaction.guild?.members.cache.filter((member) =>
			member.roles.cache.has(role.id),
		)

		if (!members) {
			members = new Collection()
		}

		const createdTimestamp = interaction.guild?.roles.cache.get(
			role.id,
		)?.createdTimestamp

		const embed = new EmbedBuilder()
			.setColor(role.color)
			.setTitle(`Role Information: ${role.name}`)
			.addFields(
				{ name: 'ID', value: role.id, inline: true },
				{
					name: 'Color',
					value: `#${role.color.toString(16).padStart(6, '0')}`,
					inline: true,
				},
				{ name: 'Position', value: role.position.toString(), inline: true },
				{
					name: 'Mentionable',
					value: role.mentionable ? 'Yes' : 'No',
					inline: true,
				},
				{ name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
				{ name: 'Members', value: members.size.toString(), inline: true },
				{
					name: 'Created',
					value: `<t:${Math.floor(createdTimestamp! / 1000)}:R>`,
					inline: true,
				},
			)
			.setTimestamp()

		await interaction.reply({ embeds: [embed] })
	},
} as Command
