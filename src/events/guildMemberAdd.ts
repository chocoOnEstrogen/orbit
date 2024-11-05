import { Client, Events, GuildMember } from 'discord.js'
import { Bot, Event } from '@/types/bot'
import Logger from '@/classes/logger'
import { discordConfig } from '@/configs/discord'

export default {
	name: Events.GuildMemberAdd,
	once: false,
	async execute(client: Bot<Client>, member: GuildMember) {
		try {
			await member.roles.add(discordConfig.memberRoleId)
			Logger.log(
				'info',
				`Added member role to ${member.user.tag}`,
				'MemberRole',
			)
		} catch (error: any) {
			Logger.log(
				'error',
				`Failed to add member role to ${member.user.tag}: ${error.message}`,
				'MemberRole',
			)
		}
	},
} as Event
