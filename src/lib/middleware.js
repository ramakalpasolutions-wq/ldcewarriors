import { NextResponse } from 'next/server'
import { verifyToken } from './auth'

export function withAuth(handler, options = {}) {
  return async (req, context) => {
    try {
      // Check for token in cookies first, then Authorization header
      const token = req.cookies?.get('token')?.value
        || req.headers.get('authorization')?.replace('Bearer ', '')

      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }

      const decoded = verifyToken(token)
      if (!decoded) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired session' },
          { status: 401 }
        )
      }

      if (options.adminOnly && decoded.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Admin access required' },
          { status: 403 }
        )
      }

      // Attach user to request
      req.user = decoded
      return handler(req, context)
    } catch (error) {
      console.error('Auth middleware error:', error.message)
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

export function withAdminAuth(handler) {
  return withAuth(handler, { adminOnly: true })
}