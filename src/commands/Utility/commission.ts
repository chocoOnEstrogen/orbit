import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js'
import { Command } from '@/types/bot'
import { supabase } from '@/configs/supabase'
import Logger from '@/classes/logger'

export default {
	data: new SlashCommandBuilder()
		.setName('commission')
		.setDescription('Commission me for work!')
		.addStringOption((option) =>
			option
				.setName('name')
				.setDescription('The name of the commission')
        .setRequired(true)
				.setAutocomplete(true),
		)
    .addStringOption((option) =>
      option
        .setName('description')
        .setDescription('The description of the commission')
        .setRequired(true),
  ),
	async autocomplete(interaction: any) {
		const focusedValue = interaction.options.getFocused()
		const { data, error } = await supabase
			.from('freelance')
			.select('name, description, price')
			.limit(10)

		if (error) {
			Logger.log(
				'error',
				`Error fetching commissions: ${error.message}`,
				'Commands',
			)
			return
		}

    const choices = data.map((commission) => ({
      name: commission.name,
      value: commission.name,
      description: commission.description,
      price: commission.price,
    }))

    const filteredChoices = choices.filter((choice) => 
      choice.name.toLowerCase().includes(focusedValue.toLowerCase())
    )

    await interaction.respond(
      filteredChoices.map(choice => ({ name: `${choice.name} - $${choice.price}`, value: choice.name }))
    );
	},
	async execute(interaction: ChatInputCommandInteraction) {
		const name = interaction.options.getString('name')
    const userDescription = interaction.options.getString('description')

		const { data, error } = await supabase
			.from('freelance')
			.select('*')
			.eq('name', name)
			.single()

		if (error) {
			Logger.log(
				'error',
				`Error fetching commission: ${error.message}`,
				'Commands',
			)
			const embed = new EmbedBuilder()
				.setTitle('Error')
				.setDescription('There was an error fetching the commission')
				.setColor('Red')
				.setTimestamp()

			return await interaction.reply({ embeds: [embed] })
		}

    const owner = interaction.guild?.ownerId
    const ownerUser = await interaction.guild?.members.fetch(owner!)

    const embed = new EmbedBuilder()
      .setTitle('You have a new commission!')
      .setDescription(`You have a new commission from <@!${interaction.user.id}> for ${data?.name} ($${data?.price})!`)
      .setColor('Green')

    const commissionDescription = `**Description:** ${userDescription}`

    if (ownerUser) {
      await ownerUser.send({ embeds: [embed], content: commissionDescription })
    } else {
      await interaction.reply({ content: 'I could not find the owner of this server. Please make sure they have DMs enabled.' })
    }

    const embed2 = new EmbedBuilder()
      .setTitle('Commission sent!')
      .setDescription(`Your commission for ${data?.name} has been sent to the server owner!\n\nPlease make sure to have your DMs enabled so they can contact you!`)
      .setColor('Green')

    await interaction.reply({ embeds: [embed2], ephemeral: true })

	},
} as Command
