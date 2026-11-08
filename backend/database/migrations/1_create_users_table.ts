import { BaseSchema } from '@adonisjs/lucid/schema'

// tabulka pouzivatelov
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      // meno a priezvisko
      table.string('first_name', 100).notNullable()
      table.string('last_name', 100).notNullable()

      // nickname a email musia byt unikatne
      table.string('nickname', 50).notNullable().unique()
      table.string('email', 254).notNullable().unique()

      // heslo - uklada sa iba zahashovane
      table.string('password_hash').notNullable()

      // stav pouzivatela - defaultne je online
      table.enum('status', ['online', 'dnd', 'offline']).notNullable().defaultTo('online')

      // preferencie notifikacii
      table
        .enum('notification_pref', ['all', 'mentions_only', 'none'])
        .notNullable()
        .defaultTo('all')

      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
