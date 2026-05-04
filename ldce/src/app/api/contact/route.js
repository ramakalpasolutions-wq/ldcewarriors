// src/app/api/contact/route.js
import { NextResponse } from 'next/server'
import { sendContactFormEmail } from '@/lib/email'

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, email, mobile, subject, message } = body

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    console.log('📩 Contact form submission:')
    console.log(`   From: ${name} <${email}>`)
    console.log(`   Subject: ${subject || 'No subject'}`)

    const result = await sendContactFormEmail({
      name,
      email,
      mobile: mobile || null,
      subject: subject || 'No Subject',
      message,
    })

    if (result.success) {
      console.log('✅ Contact email sent successfully')
      return NextResponse.json({
        success: true,
        message: 'Message sent successfully!',
      })
    } else {
      console.error('❌ Contact email failed:', result.error)
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Contact API error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}