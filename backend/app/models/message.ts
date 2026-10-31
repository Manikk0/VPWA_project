import { MessageSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Channel from '#models/channel'
import User from '#models/user'

// model spravy - stlpce su v MessageSchema (generuje sa z migracii)
export default class Message extends MessageSchema {
  // kanal, do ktoreho sprava patri
  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  // odosielatel spravy
  @belongsTo(() => User, { foreignKey: 'senderId' })
  declare sender: BelongsTo<typeof User>
}
