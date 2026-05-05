// src/app/api/auth/register/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import {
  hashPassword, generateOTP, getOTPExpiry,
  validateEmail, validateMobile, validatePassword,
} from '@/lib/auth'

export async function POST(req) {
  try {
    const { fullName, email, mobile, password, confirmPassword, address } = await req.json()

    if (!fullName || !email || !mobile || !password || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    if (!validateMobile(mobile)) {
      return NextResponse.json(
        { error: 'Invalid mobile number (must be 10 digits starting with 6-9)' },
        { status: 400 },
      )
    }
    const pwValidation = validatePassword(password)
    if (!pwValidation.valid) {
      return NextResponse.json({ error: pwValidation.message }, { status: 400 })
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }
    const existingMobile = await prisma.user.findUnique({ where: { mobile } })
    if (existingMobile) {
      return NextResponse.json({ error: 'Mobile number already registered' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        fullName,
        email:        email.toLowerCase(),
        mobile,
        password:     hashedPassword,
        addressLine:  address?.line    || null,
        addressCity:  address?.city    || null,
        addressState: address?.state   || null,
        addressPincode: address?.pincode || null,
        isEmailVerified:  false,
        isMobileVerified: false,
      },
    })

    console.log('✅ User created:', user.id, user.email)

    // Generate ONE email OTP (no more mobile OTP)
    const emailOTP = generateOTP()
    const expiry   = getOTPExpiry()

    await prisma.oTP.deleteMany({ where: { userId: user.id } })
    await prisma.oTP.create({
      data: {
        userId:     user.id,
        identifier: email.toLowerCase(),
        otp:        emailOTP,
        type:       'email',
        expiresAt:  expiry,
      },
    })

    // Send email OTP
    let emailSent = false
    try {
      const { sendOTPEmail } = await import('@/lib/email')
      await sendOTPEmail({ to: email, otp: emailOTP, type: 'verification', name: fullName })
      emailSent = true
      console.log('✅ Email OTP sent to', email)
    } catch (emailErr) {
      console.error('❌ Email send failed:', emailErr.message)
    }

    if (!emailSent) {
      // If email fails we cannot proceed — delete user and return error
      await prisma.user.delete({ where: { id: user.id } })
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email for the OTP.',
      userId:  user.id,
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Register error:', error)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}