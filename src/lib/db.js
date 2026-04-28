// src/lib/db.js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

const prisma = globalForPrisma.prisma

export default prisma