// src/app/api/admin/coupons/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'

function requireAdmin(req) {
  const token = req.cookies.get('adminToken')?.value
  if (!token) return null
  const decoded = verifyToken(token)
  return decoded?.role === 'admin' ? decoded : null
}

export async function GET(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
    const mapped  = coupons.map(c => ({ ...c, _id: c.id }))
    return NextResponse.json({ success: true, coupons: mapped })
  } catch (error) {
    console.error('Coupons GET:', error)
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { code, discountType, discountValue, maxUses, expiryDate } = await req.json()

    if (!code || !discountType || !discountValue) {
      return NextResponse.json(
        { error: 'Code, discount type and value are required' },
        { status: 400 },
      )
    }

    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
    }

    const coupon = await prisma.coupon.create({
      data: {
        code:          code.toUpperCase(),
        discountType,
        discountValue: parseFloat(discountValue),
        maxUses:       parseInt(maxUses) || 100,
        expiryDate:    expiryDate ? new Date(expiryDate) : null,
      },
    })

    return NextResponse.json(
      { success: true, coupon: { ...coupon, _id: coupon.id } },
      { status: 201 },
    )
  } catch (error) {
    console.error('Coupons POST:', error)
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const { code, discountType, discountValue, maxUses, expiryDate } = await req.json()

    if (!code || !discountType || !discountValue) {
      return NextResponse.json(
        { error: 'Code, discount type and value are required' },
        { status: 400 },
      )
    }

    // Check duplicate code — exclude current coupon
    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: 'Coupon code already in use' }, { status: 409 })
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code:          code.toUpperCase(),
        discountType,
        discountValue: parseFloat(discountValue),
        maxUses:       parseInt(maxUses) || 100,
        expiryDate:    expiryDate ? new Date(expiryDate) : null,
      },
    })

    return NextResponse.json({ success: true, coupon: { ...coupon, _id: coupon.id } })
  } catch (error) {
    console.error('Coupons PUT:', error)
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    await prisma.coupon.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Coupons DELETE:', error)
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
  }
}