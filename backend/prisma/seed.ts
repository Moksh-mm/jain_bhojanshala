import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create Super Admin only if none exists
  const existing = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })

  if (!existing) {
    const passwordHash = await bcrypt.hash('Admin123', 12)
    const superAdmin = await prisma.user.create({
      data: {
        name:         'Super Admin',
        email:        'admin',
        phone:        '',
        passwordHash,
        role:         'SUPER_ADMIN',
        isActive:     true,
      },
    })
    console.log('✅ Super Admin created')
    console.log('   Email:    admin')
    console.log('   Password: Admin123')
    console.log('   ID:      ', superAdmin.id)
  } else {
    console.log('ℹ️  Super Admin already exists — skipping')
  }

  console.log('✅ Seed complete. No demo data was created.')
  console.log('   Log in as Super Admin to create Bhojanshalas and Admin accounts.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
