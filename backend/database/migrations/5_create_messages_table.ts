import { BaseSchema } from '@adonisjs/lucid/schema'

// spravy v kanaloch
export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // kanal, do ktoreho sprava patri - ak sa kanal zmaze, zmazu sa aj spravy
      table
        .integer('channel_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      // odosielatel spravy
      table
        .integer('sender_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // text spravy
      table.text('content').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // index pre rychle nacitanie sprav kanala podla casu (infinite scroll)
      table.index(['channel_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
