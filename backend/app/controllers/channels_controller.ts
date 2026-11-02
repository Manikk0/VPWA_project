import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Channel from '#models/channel'
import ChannelBan from '#models/channel_ban'

export default class ChannelsController {
  // zoznam kanalov, v ktorych je prihlaseny pouzivatel clenom
  async index({ auth }: HttpContext) {
    // ziskame aktualne prihlaseneho pouzivatela
    const user = auth.getUserOrFail()

    // nacitame kanaly pouzivatela z vazby v channel_members
    // ak pouzivatel kanal opustil alebo dostal ban, v channel_members uz nie je zaznam
    const channels = await user.related('channels').query().preload('creator').preload('members')

    // upravime data kanalov do jednoducheho formatu pre frontend
    const result = []
    for (const channel of channels) {
      // zoznam clenov kanala
      const membersList = []
      for (const member of channel.members) {
        membersList.push({
          id: member.id,
          nickname: member.nickname,
          // kvoli spatnej kompatibilite s frontendom kde sa v mock datach pouzivalo name ako nick
          name: member.nickname,
          fullName: `${member.firstName} ${member.lastName}`,
          role: member.id === channel.createdBy ? 'admin' : 'member',
        })
      }

      result.push({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        isPrivate: channel.type === 'private',
        description: channel.description,
        createdBy: channel.creator.nickname,
        isHighlighted: channel.$extras.pivot_is_highlighted,
        joinedAt: channel.$extras.pivot_joined_at,
        members: membersList,
        bannedUsers: [],
        kickVotes: {},
      })
    }

    return result
  }

  // vytvorenie kanala alebo pridanie sa do existujuceho kanala cez /join
  async join({ auth, request, response }: HttpContext) {
    // prihlaseny pouzivatel
    const user = auth.getUserOrFail()

    // ziskame nazov a typ kanala
    const name = request.input('name')?.trim()
    const type = request.input('type') === 'private' ? 'private' : 'public'

    if (!name) {
      return response.badRequest({ message: 'Zadajte platný názov kanála' })
    }

    // zistime ci uz kanal s tymto nazvom v databaze existuje
    let channel = await Channel.findBy('name', name)

    if (channel) {
      // kontrola ci v nom pouzivatel nema trvaly ban
      const isBanned = await ChannelBan.query()
        .where('channelId', channel.id)
        .where('userId', user.id)
        .first()

      if (isBanned) {
        return response.forbidden({ message: `V kanáli #${channel.name} máte trvalý ban` })
      }

      // kontrola ci uz je pouzivatel clenom kanala
      const isMember = await channel.related('members').query().where('users.id', user.id).first()

      if (isMember) {
        return response.ok({
          message: `Už ste členom kanála #${channel.name}`,
          channel: channel,
          alreadyMember: true,
        })
      }

      // do sukromneho kanala sa neda pridat cez /join (iba spravca moze pozvat cez /invite)
      if (channel.type === 'private') {
        return response.forbidden({
          message: `Kanál #${channel.name} je súkromný, pridať vás môže iba správca`,
        })
      }

      // verejny kanal - pridame pouzivatela do clenov kanala
      await channel.related('members').attach({
        [user.id]: {
          is_highlighted: false,
          joined_at: DateTime.now().toSQL(),
        },
      })

      return response.ok({
        message: `Pridali ste sa do verejného kanála #${channel.name}`,
        channel: channel,
        alreadyMember: false,
      })
    }

    // kanal este neexistuje - vytvorime novy (verejny alebo sukromny)
    channel = await Channel.create({
      name: name,
      type: type,
      description: request.input('description') || null,
      createdBy: user.id,
      lastActivityAt: DateTime.now(),
    })

    // pouzivatel ktory kanal vytvoril sa stava jeho spravcom
    await channel.related('members').attach({
      [user.id]: {
        is_highlighted: false,
        joined_at: DateTime.now().toSQL(),
      },
    })

    const typText = channel.type === 'private' ? 'súkromný' : 'verejný'
    return response.created({
      message: `Vytvorený nový ${typText} kanál #${channel.name}`,
      channel: channel,
      alreadyMember: false,
    })
  }
}
