import { KickVoteSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Channel from '#models/channel'
import User from '#models/user'

// model pre hlasovanie clenov kanala o vyhodeni pouzivatela
export default class KickVote extends KickVoteSchema {
  // kanal, v ktorom sa hlasuje
  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  // pouzivatel, ktoreho chcu vyhodit
  @belongsTo(() => User, { foreignKey: 'targetUserId' })
  declare targetUser: BelongsTo<typeof User>

  // pouzivatel, ktory dal hlas za vyhodenie
  @belongsTo(() => User, { foreignKey: 'votedByUserId' })
  declare votedByUser: BelongsTo<typeof User>
}
