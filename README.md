# 📚 LDCE Platform — Setup Guide

## Full-Stack Next.js platform for Lower Departmental Competitive Exams

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local

# 3. Fill in all values in .env.local

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔧 Environment Variables

Edit `.env.local` with your credentials:

### MongoDB
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ldce
```
Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)

### NextAuth
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with: openssl rand -base64 32
JWT_SECRET=another-random-secret
```

### AWS S3 (Video Storage)
```
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=ldce-videos
```
1. Create S3 bucket in AWS Console
2. Enable public read access for video URLs
3. Create IAM user with S3 permissions

### Cloudinary (Image Storage)
```
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```
Free account at [cloudinary.com](https://cloudinary.com)

### Razorpay (Payments)
```
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
```
Create account at [razorpay.com](https://razorpay.com)

### Nodemailer (Email OTP)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@ldce.com
```
Use Gmail App Password (not regular password)

### Twilio (SMS OTP)
```
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```
Free trial at [twilio.com](https://twilio.com)

---

## 👤 Create First Admin User

Run this script once to seed an admin account:

```bash
node scripts/seed-admin.js
```

Or manually insert in MongoDB:
```json
{
  "fullName": "Admin User",
  "email": " ldcewarriors@gmail.com",
  "mobile": "9999999999",
  "password": "<bcrypt-hash>",
  "role": "admin",
  "isEmailVerified": true,
  "isMobileVerified": true
}
```

Admin Panel URL: `http://localhost:3000/admin`

---

## 🗺️ Page Structure

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, videos, articles |
| `/classes` | Free + premium topic-wise videos |
| `/articles` | Public articles (no login needed) |
| `/articles/[id]` | Single article page |
| `/premium` | Subscription page with Razorpay |
| `/contact` | Contact form |
| `/auth/login` | User login (with OTP) |
| `/auth/register` | User registration |
| `/auth/forgot-password` | Password reset flow |
| `/admin` | Admin login |
| `/admin/dashboard` | Admin overview |
| `/admin/videos` | Manage videos (upload/delete) |
| `/admin/articles` | Manage articles |
| `/admin/hero` | Hero carousel management |
| `/admin/topics` | Course topic management |
| `/admin/coupons` | Discount coupon management |
| `/admin/users` | User & subscription management |

---

## 🔑 Key Features

### Authentication
- Email + Mobile OTP verification during registration
- Login requires OTP (sent to mobile)
- **1 device limit**: New login auto-logs out previous device
- JWT tokens stored in httpOnly cookies
- Forgot password via email OTP

### Subscription System
- 4-month subscription via Razorpay
- Premium videos locked behind active subscription
- Each premium video: **max 3 plays** per subscription period
- Subscription expiry auto-checked on every access

### Admin Panel
- Separate admin login (`/admin`)
- Upload videos to AWS S3 with Cloudinary thumbnails
- Write and publish articles
- Manage hero carousel (image/video/article)
- Create discount coupons
- Block/unblock users
- Reset user device sessions

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 14 | Full-stack framework |
| MongoDB + Mongoose | Database |
| Tailwind CSS | Styling |
| JWT + bcryptjs | Authentication |
| AWS S3 | Video storage |
| Cloudinary | Image storage |
| Razorpay | Payment gateway |
| Nodemailer | Email OTPs |
| Twilio | SMS OTPs |

---

## 🚀 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Project → Settings → Environment Variables
```

For MongoDB, use MongoDB Atlas (cloud).
For media storage, AWS S3 + Cloudinary work globally.

---

## 📦 Build for Production

```bash
npm run build
npm start
```

---

## 🐛 Common Issues

**OTP not received via SMS?**
→ Check Twilio credentials and phone number format (+91XXXXXXXXXX)

**Images not uploading?**
→ Verify Cloudinary API keys and cloud name

**Videos not playing?**
→ Check AWS S3 bucket permissions (allow public GetObject)

**Payment failing?**
→ Use Razorpay test mode keys during development

---

## 📄 Database Models

- **User** — Registration, verification, device tracking
- **OTP** — Time-limited OTPs with TTL index
- **Topic** — Course topic categories
- **Video** — Free and premium video metadata
- **VideoPlay** — Per-user play count tracking
- **Article** — Articles with homepage/live scroll flags
- **Hero** — Homepage carousel content
- **Subscription** — Payment and access records
- **Coupon** — Discount codes with usage limits
- **Contact** — Contact form submissions

---

Built with ❤️ for LDCE aspirants.
