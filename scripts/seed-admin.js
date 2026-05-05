// scripts/seed-admin.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB via Prisma...')
    console.log('   URI:', process.env.MONGODB_URI?.substring(0, 40) + '...')

    // ✅ Fixed: removed leading space from email
    const existing = await prisma.user.findUnique({
      where: { email: 'ldcewarriors@gmail.com' }
    })

    if (existing) {
      console.log('ℹ️  Admin already exists:', existing.email)
      console.log('   Role:', existing.role)
      console.log('')
      console.log('💡 Want to UPDATE the password instead? Use option below.')
      
      // ── Optional: update password if needed ──
      // const hashedPassword = await bcrypt.hash('ADMIN@1', 12)
      // await prisma.user.update({
      //   where: { email: 'ldcewarriors@gmail.com' },
      //   data: { password: hashedPassword, role: 'admin' }
      // })
      // console.log('✅ Password updated!')
      
      process.exit(0)
    }

    const hashedPassword = await bcrypt.hash('Karuna@1', 12)

    await prisma.user.create({
      data: {
        fullName:        'D Karunakar Rao Admin',
        email:           'ldcewarriors@gmail.com',
        mobile:          '9666887998',
        password:        hashedPassword,
        role:            'admin',
        isEmailVerified: true,
        isMobileVerified:true,
        isActive:        true,
        addressLine:     'Srujana Apartment,Flat no 401,Guntupalli',
        addressCity:     'NTR District',
        addressState:    'AP',
        addressPincode:  '521241',
      }
    })

    console.log('')
    console.log('✅ Admin user created successfully!')
    console.log('   Email:    ldcewarriors@gmail.com')
    console.log('   Password: Karuna@1')
    console.log('   ⚠️  Change password after first login!')
    console.log('')
    console.log('🌐 Admin Panel: http://localhost:3000/admin')

  } catch (error) {
    console.error('❌ Seed failed:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

seed()