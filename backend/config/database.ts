import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'
import env from '#start/env'

// nastavenie pripojenia k databaze
const dbConfig = defineConfig({
  // predvolene pripojenie, ktore sa pouziva pre vsetky dotazy
  connection: 'pg',

  connections: {
    // PostgreSQL - udaje o pripojeni sa citaju zo suboru .env
    pg: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
      migrations: {
        // migracie sa spustaju v poradi podla nazvu suboru
        naturalSort: true,
        // priecinok s migraciami
        paths: ['database/migrations'],
      },
      schemaGeneration: {
        enabled: true,
        rulesPaths: ['./database/schema_rules.js'],
      },
      // pri vyvoji vypisuje SQL dotazy do konzoly
      debug: app.inDev,
    },
  },
})

export default dbConfig
