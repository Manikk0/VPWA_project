import { BaseSchema } from '@adonisjs/lucid/schema'

// tabulka pre trvale bany pouzivatelov v kanaloch
export default class extends BaseSchema {
  protected tableName = 'channel_bans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // id kanala, v ktorom ma pouzivatel ban - ak sa zmaze kanal, zmaze sa aj ban
      table
        .integer('channel_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      // id zabanovaneho pouzivatela - ak sa zmaze pouzivatel, zmaze sa aj zaznam o bane
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // zlozeny primarny kluc - pouzivatel moze mat v jednom kanali iba jeden ban
      table.primary(['channel_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
