// src/app/api/admin/login/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { comparePassword, generateToken } from '@/lib/auth'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), role: 'admin' }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 })
    }

    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 })
    }

    const token = generateToken(
      { userId: user.id, email: user.email, role: 'admin' },
      '24h'
    )

    console.log('✅ Admin login successful:', user.email)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    })

    // Set cookie with proper settings for both dev and prod
    response.cookies.set('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Admin login failed' }, { status: 500 })
  }
}