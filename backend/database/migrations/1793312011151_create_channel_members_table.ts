import { BaseSchema } from '@adonisjs/lucid/schema'

// clenstvo pouzivatelov v kanaloch
export default class extends BaseSchema {
  protected tableName = 'channel_members'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // kanal - ak sa kanal zmaze, zmazu sa aj jeho clenstva
      table
        .integer('channel_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      // pouzivatel - ak sa pouzivatel zmaze, zmazu sa aj jeho clenstva
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // kanal je zvyrazneny po pozvanke, kym ho pouzivatel neotvori
      table.boolean('is_highlighted').notNullable().defaultTo(false)

      // kedy sa pouzivatel stal clenom
      table.timestamp('joined_at').notNullable()

      // zlozeny primarny kluc - pouzivatel moze byt v kanali iba raz
      table.primary(['channel_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
