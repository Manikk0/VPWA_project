import { BaseSchema } from '@adonisjs/lucid/schema'

// tabulka pre oznacenia pouzivatelov v spravach pomocou @nickname
export default class extends BaseSchema {
  protected tableName = 'message_mentions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // id spravy, v ktorej sa nachadza oznacenie
      table
        .integer('message_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('messages')
        .onDelete('CASCADE')

      // id pouzivatela, ktory bol v sprave oznaceny
      table
        .integer('mentioned_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // zlozeny primarny kluc - v jednej sprave je pouzivatel evidovany ako oznaceny maximalne raz
      table.primary(['message_id', 'mentioned_user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
