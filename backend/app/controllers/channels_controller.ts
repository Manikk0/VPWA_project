import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Channel from '#models/channel'
import ChannelBan from '#models/channel_ban'
import KickVote from '#models/kick_vote'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'

// trvaly ban - pouzivatel prestane byt clenom, takze kanal zmizne z jeho zoznamu
async function banUser(channel: Channel, userId: number) {
  await channel.related('bannedUsers').attach([userId])
  await channel.related('members').detach([userId])

  // hlasy proti tomuto pouzivatelovi uz netreba
  await KickVote.query().where('channelId', channel.id).where('targetUserId', userId).delete()
}

export default class ChannelsController {
  // zoznam kanalov, v ktorych je prihlaseny pouzivatel clenom
  async index({ auth }: HttpContext) {
    // ziskame aktualne prihlaseneho pouzivatela
    const user = auth.getUserOrFail()

    // nacitame kanaly pouzivatela z vazby v channel_members
    // ak pouzivatel kanal opustil alebo dostal ban, v channel_members uz nie je zaznam
    const channels = await user
      .related('channels')
      .query()
      .preload('creator')
      .preload('members')
      .preload('bannedUsers')
      .preload('kickVotes', (query) => query.preload('targetUser').preload('votedByUser'))

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

      // nicky pouzivatelov s trvalym banom
      const bannedList = []
      for (const banned of channel.bannedUsers) {
        bannedList.push(banned.nickname)
      }

      // hlasy za vyhodenie
      const kickVotes: Record<string, string[]> = {}
      for (const vote of channel.kickVotes) {
        const targetNick = vote.targetUser.nickname
        if (!kickVotes[targetNick]) {
          kickVotes[targetNick] = []
        }
        kickVotes[targetNick].push(vote.votedByUser.nickname)
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
        bannedUsers: bannedList,
        kickVotes: kickVotes,
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

  // opustenie kanala - ak odchadza spravca, kanal zanika
  async leave({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const channel = await Channel.find(params.id)
    if (!channel) {
      return response.notFound({ message: 'Kanál už neexistuje' })
    }

    // kanal moze opustit iba jeho clen
    const isMember = await channel.related('members').query().where('users.id', user.id).first()
    if (!isMember) {
      return response.forbidden({ message: `Nie ste členom kanála #${channel.name}` })
    }

    // spravca odchadza - zmazeme kanal (clenstva a spravy zmaze databaza cez CASCADE)
    if (channel.createdBy === user.id) {
      await channel.delete()
      return response.ok({
        message: `Kanál #${channel.name} zanikol`,
        channelDeleted: true,
      })
    }

    // bezny clen - zmazeme iba jeho zaznam v channel_members
    await channel.related('members').detach([user.id])

    return response.ok({
      message: `Opustili ste kanál #${channel.name}`,
      channelDeleted: false,
    })
  }

  // zrusenie kanala - moze iba spravca
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const channel = await Channel.find(params.id)
    if (!channel) {
      return response.notFound({ message: 'Kanál už neexistuje' })
    }

    if (channel.createdBy !== user.id) {
      return response.forbidden({ message: 'Iba správca môže zrušiť kanál' })
    }

    await channel.delete()

    return response.ok({ message: `Kanál #${channel.name} zanikol` })
  }

  // vyhodenie clena cez /kick - spravca hned, bezni clenovia po 3 hlasoch
  async kick({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const nickname = request.input('nickname')?.trim()

    const channel = await Channel.find(params.id)
    if (!channel) {
      return response.notFound({ message: 'Kanál už neexistuje' })
    }

    // vyhadzovat moze iba clen kanala
    const isMember = await channel.related('members').query().where('users.id', user.id).first()
    if (!isMember) {
      return response.forbidden({ message: `Nie ste členom kanála #${channel.name}` })
    }

    // /kick funguje iba vo verejnom kanali
    if (channel.type === 'private') {
      return response.badRequest({
        message: 'Príkaz /kick funguje iba vo verejnom kanáli. V súkromnom použite /revoke',
      })
    }

    // vyhodit sa da iba clen kanala
    const target = await channel
      .related('members')
      .query()
      .where('users.nickname', nickname || '')
      .first()
    if (!target) {
      return response.notFound({
        message: `Používateľ ${nickname} sa v tomto kanáli nenachádza!`,
      })
    }

    if (target.id === user.id) {
      return response.badRequest({
        message: 'Nemôžete vyhodiť sám seba. Na opustenie kanála použite /cancel',
      })
    }

    if (target.id === channel.createdBy) {
      return response.badRequest({ message: 'Nemôžete vyhodiť správcu kanála!' })
    }

    // spravca vyhadzuje natrvalo hned
    if (channel.createdBy === user.id) {
      await banUser(channel, target.id)
      return response.ok({
        message: `Používateľ ${target.nickname} bol správcom natrvalo vyhodený z #${channel.name}`,
        banned: true,
      })
    }

    // jeden clen moze za toho isteho pouzivatela hlasovat iba raz
    const existingVote = await KickVote.query()
      .where('channelId', channel.id)
      .where('targetUserId', target.id)
      .where('votedByUserId', user.id)
      .first()
    if (existingVote) {
      return response.badRequest({ message: `Za vyhodenie ${target.nickname} ste už hlasovali` })
    }

    // ulozime novy hlas a spocitame vsetky hlasy proti tomuto pouzivatelovi
    await KickVote.create({
      channelId: channel.id,
      targetUserId: target.id,
      votedByUserId: user.id,
    })
    const votes = await KickVote.query()
      .where('channelId', channel.id)
      .where('targetUserId', target.id)

    // ak su aspon 3 hlasy, pouzivatel dostane trvaly ban
    if (votes.length >= 3) {
      await banUser(channel, target.id)
      return response.ok({
        message: `Používateľ ${target.nickname} dostal 3 hlasy a má trvalý ban v #${channel.name}`,
        banned: true,
      })
    }

    return response.ok({
      message: `Hlasovali ste za vyhodenie ${target.nickname} (${votes.length}/3)`,
      banned: false,
    })
  }

  // pozvanie pouzivatela do kanala cez /invite
  // pozvany pouzivatel ma kanal zvyrazneny a navrchu zoznamu, kym ho neotvori
  async invite({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const nickname = request.input('nickname')?.trim()

    const channel = await Channel.find(params.id)
    if (!channel) {
      return response.notFound({ message: 'Kanál už neexistuje' })
    }

    // pozyvat moze iba clen kanala
    const isMember = await channel.related('members').query().where('users.id', user.id).first()
    if (!isMember) {
      return response.forbidden({ message: `Nie ste členom kanála #${channel.name}` })
    }

    // najdeme pozvaneho pouzivatela podla nicku
    const target = await User.findBy('nickname', nickname || '')
    if (!target) {
      return response.notFound({ message: `Používateľ ${nickname} neexistuje!` })
    }

    const isAdmin = channel.createdBy === user.id

    // do sukromneho kanala moze pozyvat iba spravca
    if (channel.type === 'private' && !isAdmin) {
      return response.forbidden({
        message: 'Iba správca môže pridávať členov do súkromného kanála!',
      })
    }

    // kontrola ci uz pouzivatel nie je clenom kanala
    const isTargetMember = await channel
      .related('members')
      .query()
      .where('users.id', target.id)
      .first()
    if (isTargetMember) {
      return response.badRequest({ message: `Používateľ ${target.nickname} už je v tomto kanáli!` })
    }

    // ak ma pouzivatel ban, obnovit pristup moze iba spravca
    const isBanned = await ChannelBan.query()
      .where('channelId', channel.id)
      .where('userId', target.id)
      .first()
    if (isBanned) {
      if (!isAdmin) {
        return response.forbidden({
          message: `Používateľ ${target.nickname} má v tomto kanáli ban, obnoviť prístup môže iba správca!`,
        })
      }
      // spravca rusi ban
      await channel.related('bannedUsers').detach([target.id])
    }

    // pridame pouzivatela do kanala - is_highlighted = true znamena, ze kanal je pre neho zvyrazneny
    await channel.related('members').attach({
      [target.id]: {
        is_highlighted: true,
        joined_at: DateTime.now().toSQL(),
      },
    })

    return response.ok({
      message: `Používateľ ${target.nickname} bol úspešne pridaný do kanála #${channel.name}`,
    })
  }

  // pouzivatel otvoril kanal - kanal uz nebude zvyrazneny
  async seen({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    // zmenime iba zaznam prihlaseneho pouzivatela v tabulke channel_members
    await db
      .from('channel_members')
      .where('channel_id', params.id)
      .where('user_id', user.id)
      .update({ is_highlighted: false })

    return response.ok({ message: 'Kanál bol označený ako videný' })
  }
}
