import { verifyToken } from './auth'

export function requireAdmin(req) {
  try {
    const token = req.cookies.get('adminToken')?.value

    if (!token) {
      return null
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return null
    }

    if (decoded.role !== 'admin') {
      return null
    }

    return decoded
  } catch (err) {
    console.error('Admin auth error:', err.message)
    return null
  }
}