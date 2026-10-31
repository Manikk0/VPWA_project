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

      // prezyvka (nickname) a email musia byt unikatne
      table.string('nickname', 50).notNullable().unique()
      table.string('email', 254).notNullable().unique()

      // heslo - uklada sa iba zahashovane
      table.string('password').notNullable()

      // stav pouzivatela - na zaciatku je online
      table.enum('status', ['online', 'dnd', 'offline']).notNullable().defaultTo('online')

      // ci chce pouzivatel notifikacie iba pre spravy, kde je spomenuty (@nickname)
      table.boolean('notify_only_mentions').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
