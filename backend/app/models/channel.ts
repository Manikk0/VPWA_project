import { ChannelSchema } from '#database/schema'
import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Message from '#models/message'
import KickVote from '#models/kick_vote'

// model kanala - stlpce su v ChannelSchema
export default class Channel extends ChannelSchema {
  // spravca kanala (pouzivatel, ktory kanal vytvoril)
  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare creator: BelongsTo<typeof User>

  // clenovia kanala cez spojovaciu tabulku channel_members
  @manyToMany(() => User, {
    pivotTable: 'channel_members',
    pivotForeignKey: 'channel_id',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['is_highlighted', 'joined_at'],
  })
  declare members: ManyToMany<typeof User>

  // pouzivatelia s trvalym banom v tomto kanali
  @manyToMany(() => User, {
    pivotTable: 'channel_bans',
    pivotForeignKey: 'channel_id',
    pivotRelatedForeignKey: 'user_id',
  })
  declare bannedUsers: ManyToMany<typeof User>

  // hlasy clenov za vyhodenie pouzivatela z tohto kanala
  @hasMany(() => KickVote)
  declare kickVotes: HasMany<typeof KickVote>

  // spravy v kanali
  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>
}
