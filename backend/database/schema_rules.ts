import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

export default {
  columns: {
    // zahashovane heslo sa nemoze poslat frontendu
    password_hash: {
      tsType: 'string',
      imports: [],
      decorators: [{ name: '@column', args: { serializeAs: null } }],
    },
  },
} satisfies SchemaRules
