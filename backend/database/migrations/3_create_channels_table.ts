import { BaseSchema } from '@adonisjs/lucid/schema'

// tabulka kanalov
export default class extends BaseSchema {
  protected tableName = 'channels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // nazov kanala musi byt unikatny
      table.string('name', 100).notNullable().unique()

      // typ kanala - verejny alebo sukromny
      table.enum('type', ['public', 'private']).notNullable().defaultTo('public')

      // popis kanala (nepovinny)
      table.text('description').nullable()

      // spravca kanala = pouzivatel, ktory ho vytvoril
      // ak sa pouzivatel zmaze, zmazu sa aj jeho kanaly
      table
        .integer('created_by_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
