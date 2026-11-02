import { BaseSchema } from '@adonisjs/lucid/schema'

// tabulka pre hlasy clenov verejneho kanala za vyhodenie pouzivatela
export default class extends BaseSchema {
  protected tableName = 'kick_votes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // id kanala, v ktorom sa hlasuje o vyhodeni
      table
        .integer('channel_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      // pouzivatel, ktoreho chcu vyhodit
      table
        .integer('target_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // pouzivatel, ktory za vyhodenie zahlasoval
      table
        .integer('voted_by_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // zlozeny primarny kluc - clen moze hlasovat za vyhodenie konkretneho pouzivatela v kanali iba raz
      table.primary(['channel_id', 'target_user_id', 'voted_by_user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
