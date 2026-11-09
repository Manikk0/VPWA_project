import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import Message from '#models/message'
import { createMessageValidator } from '#validators/message'
import { emitToChannel } from '#services/socket'

// kolko sprav posleme naraz
const PAGE_SIZE = 20

// prevod spravy z databazy do jednoducheho formatu pre frontend
function messageToJson(message: Message) {
  // nicky pouzivatelov, ktori su v sprave oznaceni cez @nickname
  const mentions: string[] = []
  for (const user of message.mentions) {
    mentions.push(user.nickname)
  }

  return {
    id: message.id,
    user: message.sender.nickname,
    text: message.content,
    createdAt: message.createdAt,
    mentions: mentions,
  }
}

// zisti ci je pouzivatel clenom kanala
async function isChannelMember(channel: Channel, userId: number) {
  const member = await channel.related('members').query().where('users.id', userId).first()
  return member !== null
}

export default class MessagesController {
  // nacitanie sprav kanala po davkach
  // ?before=<id spravy> vrati spravy starsie ako tato sprava (pri scrollovani nahor)
  async index({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const channel = await Channel.find(params.id)
    if (!channel) {
      return response.notFound({ message: 'Kanál už neexistuje' })
    }

    // spravy moze citat iba clen kanala
    if (!(await isChannelMember(channel, user.id))) {
      return response.forbidden({ message: `Nie ste členom kanála #${channel.name}` })
    }

    // najnovsie spravy kanala - zoradene od najnovsej
    const query = Message.query()
      .where('channelId', channel.id)
      .preload('sender')
      .preload('mentions')
      .orderBy('id', 'desc')
      .limit(PAGE_SIZE + 1)

    // pri scrollovani nahor chceme iba spravy starsie ako najstarsia zobrazena
    const before = request.input('before')
    if (before) {
      query.where('id', '<', Number(before))
    }

    const messages = await query

    // ak sme dostali viac ako PAGE_SIZE, existuju este dalsie starsie spravy
    let hasMore = false
    if (messages.length > PAGE_SIZE) {
      hasMore = true
      messages.pop()
    }

    // frontend chce spravy od najstarsej po najnovsiu, preto poradie otocime
    messages.reverse()

    const result = []
    for (const message of messages) {
      result.push(messageToJson(message))
    }

    return { messages: result, hasMore: hasMore }
  }

  // odoslanie novej spravy do kanala
  async store({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const channel = await Channel.find(params.id)
    if (!channel) {
      return response.notFound({ message: 'Kanál už neexistuje' })
    }

    // spravu moze poslat iba clen kanala
    if (!(await isChannelMember(channel, user.id))) {
      return response.forbidden({ message: `Nie ste členom kanála #${channel.name}` })
    }

    // kontrola textu spravy
    const { content } = await request.validateUsing(createMessageValidator)

    // ulozenie spravy
    const message = await Message.create({
      channelId: channel.id,
      senderId: user.id,
      content: content,
    })

    // najdeme v texte vsetky @nickname
    const mentionedNicks: string[] = []
    for (const word of content.split(' ')) {
      if (word.startsWith('@')) {
        // odstranime @ a znaky ako ciarka ci vykricnik na konci
        const nick = word.slice(1).replace(/[^a-zA-Z0-9_]/g, '')
        if (nick && !mentionedNicks.includes(nick)) {
          mentionedNicks.push(nick)
        }
      }
    }

    // oznacit sa daju iba clenovia kanala - ulozime ich do tabulky message_mentions
    if (mentionedNicks.length > 0) {
      const mentionedMembers = await channel
        .related('members')
        .query()
        .whereIn('users.nickname', mentionedNicks)

      const mentionedIds: number[] = []
      for (const member of mentionedMembers) {
        mentionedIds.push(member.id)
      }
      await message.related('mentions').attach(mentionedIds)
    }

    // nacitame odosielatela a oznacenych, aby sme spravu vratili v rovnakom tvare ako pri nacitani
    await message.load('sender')
    await message.load('mentions')

    // novu spravu hned posleme vsetkym pripojenym clenom kanala
    emitToChannel(channel.id, 'message:new', {
      channelId: channel.id,
      channelName: channel.name,
      message: messageToJson(message),
    })

    return response.created(messageToJson(message))
  }
}
