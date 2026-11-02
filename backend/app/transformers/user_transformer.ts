import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    // udaje o pouzivatelovi, ktore server posiela frontendu (okrem hesla)
    return this.pick(this.resource, [
      'id',
      'firstName',
      'lastName',
      'nickname',
      'email',
      'status',
      'notificationPref',
      'notifyOnlyMentions',
      'createdAt',
      'updatedAt',
      'initials',
    ])
  }
}
