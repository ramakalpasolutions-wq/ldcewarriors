import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'ldce-fallback-secret'

// Hash password
export async function hashPassword(password) {
  return await bcrypt.hash(password, 12)
}

// Compare password
export async function comparePassword(password, hashed) {
  return await bcrypt.compare(password, hashed)
}

// Generate JWT
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

// Verify JWT
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

// Generate OTP (6 digits)
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Generate device ID
export function generateDeviceId() {
  return crypto.randomUUID()
}

// Check subscription validity
export function isSubscriptionActive(subscription) {
  if (!subscription) return false
  if (subscription.status !== 'active') return false
  return new Date(subscription.endDate) > new Date()
}

// Calculate subscription end date (4 months from now)
export function calculateSubscriptionEndDate() {
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 4)
  return endDate
}

// Validate password strength
export function validatePassword(password) {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' }
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one uppercase letter' }
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number' }
  return { valid: true }
}

// Validate Indian mobile number
export function validateMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile)
}

// Validate email
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// OTP expiry (10 minutes)
export function getOTPExpiry() {
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + 10)
  return expiry
}
