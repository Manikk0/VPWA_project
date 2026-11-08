import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Channel from '#models/channel'
import Message from '#models/message'

// model pouzivatela - stlpce su v UserSchema
// pri prihlaseni sa pouzivatel hlada podla emailu alebo podla nicknamu
export default class User extends compose(
  UserSchema,
  withAuthFinder(hash, { uids: ['email', 'nickname'], passwordColumnName: 'passwordHash' })
) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  // kanaly, ktorych spravcom je pouzivatel
  @hasMany(() => Channel, { foreignKey: 'createdByUserId' })
  declare createdChannels: HasMany<typeof Channel>

  // kanaly, v ktorych je pouzivatel clenom
  @manyToMany(() => Channel, {
    pivotTable: 'channel_members',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'channel_id',
    pivotColumns: ['is_highlighted', 'joined_at'],
  })
  declare channels: ManyToMany<typeof Channel>

  // kanaly, v ktorych ma pouzivatel trvaly ban
  @manyToMany(() => Channel, {
    pivotTable: 'channel_bans',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'channel_id',
  })
  declare bannedChannels: ManyToMany<typeof Channel>

  // spravy, ktore pouzivatel poslal
  @hasMany(() => Message, { foreignKey: 'senderId' })
  declare messages: HasMany<typeof Message>

  // pomocny getter pre spatnu kompatibilitu s frontendom
  get notifyOnlyMentions() {
    return this.notificationPref === 'mentions_only'
  }

  // inicialy z mena a priezviska
  get initials() {
    return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase()
  }
}
