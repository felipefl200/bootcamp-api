// prisma.config.ts - variáveis de ambiente carregadas via --env-file do Node.js

import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    url: process.env['DATABASE_URL']!
  }
})
