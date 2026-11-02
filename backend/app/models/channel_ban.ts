import { ChannelBanSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Channel from '#models/channel'
import User from '#models/user'

// model pre zabanovaneho pouzivatela v kanali
export default class ChannelBan extends ChannelBanSchema {
  // kanal, v ktorom ma pouzivatel ban
  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  // pouzivatel, ktory ma ban
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
