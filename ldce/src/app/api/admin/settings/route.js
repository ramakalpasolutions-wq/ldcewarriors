// src/app/api/admin/settings/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'

function requireAdmin(req) {
  const token = req.cookies.get('adminToken')?.value
  if (!token) return null
  const decoded = verifyToken(token)
  return decoded?.role === 'admin' ? decoded : null
}

// We'll store settings as key-value pairs in a Settings model
// Since you don't have it in schema, we'll use a simple JSON approach
// stored in a dedicated collection via raw prisma

// ── Fallback defaults ──
const DEFAULTS = {
  subscriptionPrice:  999,
  subscriptionMonths: 4,
}

// ── We'll store in a dedicated Prisma model "Setting" ──
// Since schema doesn't have it yet, we use the upsert pattern below.
// ADD THIS TO YOUR SCHEMA:
//
// model Setting {
//   id        String   @id @default(auto()) @map("_id") @db.ObjectId
//   key       String   @unique
//   value     String
//   updatedAt DateTime @updatedAt
// }

export async function GET(req) {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ['subscriptionPrice', 'subscriptionMonths'] } },
    })

    const map = {}
    settings.forEach(s => { map[s.key] = s.value })

    return NextResponse.json({
      success: true,
      settings: {
        subscriptionPrice:  parseInt(map.subscriptionPrice  ?? DEFAULTS.subscriptionPrice),
        subscriptionMonths: parseInt(map.subscriptionMonths ?? DEFAULTS.subscriptionMonths),
      },
    })
  } catch (error) {
    console.error('Settings GET:', error)
    // Return defaults if table doesn't exist yet
    return NextResponse.json({ success: true, settings: DEFAULTS })
  }
}

export async function PUT(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { subscriptionPrice, subscriptionMonths } = await req.json()

    // Validate
    const price  = parseInt(subscriptionPrice)
    const months = parseInt(subscriptionMonths)

    if (!price || price < 1 || price > 100000) {
      return NextResponse.json({ error: 'Price must be between ₹1 and ₹1,00,000' }, { status: 400 })
    }
    if (!months || months < 1 || months > 24) {
      return NextResponse.json({ error: 'Duration must be between 1 and 24 months' }, { status: 400 })
    }

    // Upsert both settings
    await Promise.all([
      prisma.setting.upsert({
        where:  { key: 'subscriptionPrice' },
        update: { value: price.toString() },
        create: { key: 'subscriptionPrice', value: price.toString() },
      }),
      prisma.setting.upsert({
        where:  { key: 'subscriptionMonths' },
        update: { value: months.toString() },
        create: { key: 'subscriptionMonths', value: months.toString() },
      }),
    ])

    console.log(`✅ Subscription settings updated: ₹${price} / ${months} months`)

    return NextResponse.json({
      success: true,
      settings: { subscriptionPrice: price, subscriptionMonths: months },
    })
  } catch (error) {
    console.error('Settings PUT:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}