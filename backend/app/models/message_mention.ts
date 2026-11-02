import { MessageMentionSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Message from '#models/message'
import User from '#models/user'

// model pre oznacenie pouzivatela v sprave
export default class MessageMention extends MessageMentionSchema {
  // sprava, v ktorej sa oznacenie nachadza
  @belongsTo(() => Message)
  declare message: BelongsTo<typeof Message>

  // pouzivatel, ktory bol oznaceny
  @belongsTo(() => User, { foreignKey: 'mentionedUserId' })
  declare mentionedUser: BelongsTo<typeof User>
}
