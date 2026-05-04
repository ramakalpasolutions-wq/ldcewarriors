// scripts/reset-admin-password.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function resetPassword() {
  try {
    console.log('🔌 Connecting...')

    const email    = 'ldcewarriors@gmail.com'
    const newPass  = 'Karuna@1'

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      console.log('❌ User not found:', email)
      process.exit(1)
    }

    console.log('✅ Found user:', user.email, '| Role:', user.role)

    const hashed = await bcrypt.hash(newPass, 12)

    await prisma.user.update({
      where: { email },
      data: {
        password: hashed,
        role:     'admin',        // ensure role is correct
        isActive: true,
      }
    })

    console.log('')
    console.log('✅ Password reset successfully!')
    console.log('   Email:    ', email)
    console.log('   Password: ', newPass)
    console.log('')
    console.log('🌐 Login at: http://localhost:3000/admin')

  } catch (err) {
    console.error('❌ Failed:', err.message)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

resetPassword()