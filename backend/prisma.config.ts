import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrate: {
    async adapter() {
      // Use DIRECT_URL for migrations to bypass the pooler
      const pool = new Pool({ connectionString: process.env.DIRECT_URL })
      return new PrismaPg(pool)
    },
  },
})
