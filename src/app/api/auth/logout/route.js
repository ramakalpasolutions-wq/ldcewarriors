// src/app/api/auth/logout/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value
    if (token) {
      const decoded = verifyToken(token)
      if (decoded?.userId) {
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { deviceId: null }
        }).catch(() => {})
      }
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
    response.cookies.delete('token')
    return response
  } catch (error) {
    const response = NextResponse.json({ success: true })
    response.cookies.delete('token')
    return response
  }
}