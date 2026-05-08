// src/lib/email.js
import { createTransport } from 'nodemailer'

function createMailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    console.error('❌ SMTP_USER or SMTP_PASS not set in .env')
    return null
  }

  return createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    ...(host === 'smtp.gmail.com' && { service: 'gmail' }),
    connectionTimeout: 15000,
    greetingTimeout:   15000,
    socketTimeout:     20000,
  })
}

const FROM = process.env.SMTP_FROM || `"LDCE Warriors" <${process.env.SMTP_USER}>`

const emailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #F5F3EF; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E5E7EB; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #1B2A4A, #243656); padding: 28px 30px; text-align: center; }
    .header h1 { color: #E8A838; margin: 0; font-size: 22px; font-weight: 800; }
    .header p { color: rgba(255,255,255,0.5); font-size: 11px; margin: 6px 0 0; letter-spacing: 2px; text-transform: uppercase; }
    .body { padding: 30px; color: #1A1D23; line-height: 1.6; }
    .otp-box { background: #F5F3EF; border: 2px solid rgba(232,168,56,0.2); border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 38px; font-weight: 800; color: #1B2A4A; letter-spacing: 8px; font-family: 'Courier New', monospace; }
    .footer { padding: 20px 30px; text-align: center; color: #9CA3AF; font-size: 12px; border-top: 1px solid #E5E7EB; background: #F5F3EF; }
    .btn { display: inline-block; background: linear-gradient(135deg, #E8A838, #D4922A); color: #1B2A4A !important; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; }
    h2 { color: #1A1D23; margin-bottom: 10px; }
    p { color: #6B7280; }
    strong { color: #1A1D23; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 LDCE Warriors</h1>
      <p>Learn • Practice • Succeed</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">© ${new Date().getFullYear()} LDCE Warriors. All rights reserved.</p>
      <p style="margin: 0;">This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`

async function sendMail({ to, subject, html }) {
  const transporter = createMailTransporter()

  if (!transporter) {
    console.error('❌ Mail transporter not available')
    return { success: false, error: 'Email not configured' }
  }

  try {
    await transporter.verify()
    console.log('✅ SMTP connection verified')

    const info = await transporter.sendMail({ from: FROM, to, subject, html })

    console.log(`✅ Email sent to ${to} — ID: ${info.messageId}`)

    if (info.rejected && info.rejected.length > 0) {
      console.warn(`⚠️ Rejected: ${info.rejected.join(', ')}`)
      return { success: false, error: `Rejected: ${info.rejected.join(', ')}` }
    }

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`, error.message)

    if (error.code === 'EAUTH') {
      console.error('💡 Gmail needs App Password: https://myaccount.google.com/apppasswords')
    }
    if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
      console.error('💡 Check if firewall blocks SMTP port 587')
    }

    return { success: false, error: error.message }
  } finally {
    transporter.close()
  }
}

/* ── OTP Email ── */
export async function sendOTPEmail({ to, otp, type = 'verification', name = '' }) {
  const subjects = {
    verification:     'Email Verification OTP — LDCE Warriors',
    'password-reset': 'Password Reset OTP — LDCE Warriors',
    login:            'Login OTP — LDCE Warriors',
  }

  const content = `
    <h2>Hello ${name || 'there'},</h2>
    <p>
      ${type === 'password-reset'
        ? 'You requested a password reset. Use the OTP below to proceed.'
        : type === 'login'
        ? 'Use this OTP to complete your login.'
        : 'Please verify your email address using the OTP below.'}
    </p>
    <div class="otp-box">
      <p style="color:#6B7280;margin:0 0 12px;font-size:14px;">Your One-Time Password</p>
      <div class="otp-code">${otp}</div>
      <p style="color:#9CA3AF;font-size:12px;margin:12px 0 0;">Valid for 10 minutes only</p>
    </div>
    <p style="font-size:13px;color:#9CA3AF;">
      If you did not request this, please ignore this email.
    </p>
  `

  return sendMail({
    to,
    subject: subjects[type] || subjects.verification,
    html:    emailTemplate(content),
  })
}

/* ── Subscription Confirmation ── */
export async function sendSubscriptionConfirmationEmail({ to, name, endDate, amount }) {
  const content = `
    <h2>🎉 Subscription Activated!</h2>
    <p>Hi ${name}, your premium subscription has been activated successfully.</p>
    <div class="otp-box">
      <p style="color:#1B2A4A;font-size:18px;font-weight:700;margin:0;">Premium Access Granted</p>
      <p style="color:#6B7280;margin:12px 0 0;">
        Valid until:
        <strong style="color:#E8A838;">
          ${new Date(endDate).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </strong>
      </p>
      <p style="color:#6B7280;">
        Amount paid: <strong style="color:#2A9D8F;">₹${amount}</strong>
      </p>
    </div>
    <p style="font-size:13px;">
      You now have access to all premium content including topic-wise videos.
    </p>
  `

  return sendMail({
    to,
    subject: 'Premium Subscription Confirmed — LDCE Warriors',
    html:    emailTemplate(content),
  })
}

/* ── Password Reset Success ── */
export async function sendPasswordResetSuccessEmail({ to, name }) {
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const content = `
    <h2>Password Reset Successful</h2>
    <p>Hi ${name}, your password has been updated successfully.</p>
    <p>You can now log in with your new password.</p>
    <br/>
    <div style="text-align:center;">
      <a href="${siteUrl}/auth/login" class="btn">Login Now →</a>
    </div>
    <br/>
    <p style="font-size:13px;color:#9CA3AF;">
      If you did not request this change, contact support immediately.
    </p>
  `

  return sendMail({
    to,
    subject: 'Password Reset Successful — LDCE Warriors',
    html:    emailTemplate(content),
  })
}

/* ── Contact Form Email ── */
export async function sendContactFormEmail({ name, email, mobile, subject, message }) {
  const adminEmail = process.env.SMTP_USER

  if (!adminEmail) {
    console.error('❌ SMTP_USER not set — cannot send contact email')
    return { success: false, error: 'Recipient email not configured' }
  }

  const adminContent = `
    <h2>📩 New Contact Form Message</h2>
    <p style="color:#6B7280;">You received a new message from the LDCE Warriors contact form.</p>

    <div style="background:#F5F3EF;border:1px solid #E5E7EB;border-radius:14px;padding:24px;margin:24px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 14px;font-size:12px;color:#9CA3AF;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #E5E7EB;width:120px;">Name</td>
          <td style="padding:10px 14px;font-size:15px;color:#1A1D23;font-weight:600;border-bottom:1px solid #E5E7EB;">${name}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:12px;color:#9CA3AF;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #E5E7EB;">Email</td>
          <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;">
            <a href="mailto:${email}" style="color:#E8A838;font-size:15px;font-weight:600;text-decoration:none;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:12px;color:#9CA3AF;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #E5E7EB;">Mobile</td>
          <td style="padding:10px 14px;font-size:15px;color:#1A1D23;border-bottom:1px solid #E5E7EB;">
            ${mobile
              ? `<a href="tel:${mobile}" style="color:#1B2A4A;text-decoration:none;">${mobile}</a>`
              : '<span style="color:#9CA3AF;">Not provided</span>'}
          </td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:12px;color:#9CA3AF;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #E5E7EB;">Subject</td>
          <td style="padding:10px 14px;font-size:15px;color:#1A1D23;font-weight:600;border-bottom:1px solid #E5E7EB;">${subject || 'No subject'}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:12px;color:#9CA3AF;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;vertical-align:top;">Message</td>
          <td style="padding:10px 14px;font-size:14px;color:#1A1D23;line-height:1.7;">${message.replace(/\n/g, '<br/>')}</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin-top:20px;">
      <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject || 'Your message on LDCE Warriors')}" class="btn">
        Reply to ${name} →
      </a>
    </div>

    <p style="font-size:12px;color:#9CA3AF;margin-top:20px;text-align:center;">
      Sent from LDCE Warriors Contact Form •
      ${new Date().toLocaleString('en-IN', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
      })} IST
    </p>
  `

  const adminResult = await sendMail({
    to:      adminEmail,
    subject: `📩 Contact: ${subject || 'New Message'} — from ${name}`,
    html:    emailTemplate(adminContent),
  })

  if (!adminResult.success) return adminResult

  // Auto-reply to the sender
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const autoReplyContent = `
    <h2>Thank you for contacting us, ${name}!</h2>
    <p>We've received your message and our team will get back to you within <strong>24 hours</strong>.</p>

    <div style="background:#F5F3EF;border:1px solid #E5E7EB;border-radius:14px;padding:20px;margin:24px 0;">
      <p style="color:#9CA3AF;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 8px;">Your Message</p>
      <p style="color:#1A1D23;font-size:14px;line-height:1.7;margin:0;">
        ${
          message.length > 200
            ? message.substring(0, 200).replace(/\n/g, '<br/>') + '…'
            : message.replace(/\n/g, '<br/>')
        }
      </p>
    </div>

    <p style="font-size:14px;color:#6B7280;">In the meantime, you can:</p>
    <ul style="color:#6B7280;font-size:14px;line-height:2;">
      <li>Browse our <a href="${siteUrl}/classes" style="color:#E8A838;text-decoration:none;font-weight:600;">free video lectures</a></li>
      <li>Read our <a href="${siteUrl}/articles" style="color:#E8A838;text-decoration:none;font-weight:600;">latest articles</a></li>
      <li>Check out <a href="${siteUrl}/premium" style="color:#E8A838;text-decoration:none;font-weight:600;">premium plans</a></li>
    </ul>

    <p style="font-size:13px;color:#9CA3AF;margin-top:20px;">
      If urgent, reach us at
      <a href="tel:+919912986746" style="color:#E8A838;text-decoration:none;font-weight:600;">+91 91542 42141</a>
      or <a href="https://wa.me/919912986746" style="color:#E8A838;text-decoration:none;font-weight:600;">WhatsApp</a>
    </p>
  `

  try {
    await sendMail({
      to:      email,
      subject: 'We received your message — LDCE Warriors',
      html:    emailTemplate(autoReplyContent),
    })
    console.log(`✅ Auto-reply sent to ${email}`)
  } catch (err) {
    console.warn('⚠️ Auto-reply failed (non-blocking):', err.message)
  }

  return { success: true }
}