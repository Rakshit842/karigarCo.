# KarigarCo. by Viraasat

> **"Crafted by hands. Rooted in heritage."**

A complete, production-oriented full-stack e-commerce marketplace connecting India's traditional artisans with customers looking for authentic, handmade products.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#database-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Seed Credentials](#seed-credentials)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Feature Checklist](#feature-checklist)
- [Integration Configuration](#integration-configuration)
- [Deployment](#deployment)
- [Security Notes](#security-notes)

---

## Overview

KarigarCo. is an open marketplace with controlled seller onboarding. It supports:

- **Customers**: Browse, search, wishlist, cart, checkout, track orders
- **Artisan Sellers**: Complete dashboard — products, orders, inventory, earnings
- **Administrators**: Platform management — sellers, products, orders, commissions

---

## Architecture

```
karigarco/
├── backend/          # Node.js + Express + TypeScript + Prisma
│   ├── src/
│   │   ├── config/       # DB, Cloudinary, app config
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth, error handling, rate limiting
│   │   ├── routes/       # Express routers
│   │   └── utils/        # Email, logging, helpers, shipping
│   └── prisma/
│       ├── schema.prisma  # PostgreSQL schema (26 models)
│       └── seed.ts        # Seed data
│
├── frontend/         # React + Vite + TypeScript + Tailwind
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── context/      # Zustand auth/cart stores
│       ├── layouts/      # Public, Seller, Admin, Auth layouts
│       ├── pages/        # All page components
│       ├── services/     # API service layer
│       └── types/        # TypeScript interfaces
│
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| State | TanStack Query, Zustand |
| Forms | React Hook Form + Zod |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |
| Payments | Razorpay (test mode) |
| Images | Cloudinary |
| Email | Nodemailer (SMTP) |
| Shipping | Abstraction layer (Shiprocket-ready) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Database Setup

```bash
# Create database
createdb karigarco_db

# Or using psql
psql -c "CREATE DATABASE karigarco_db;"
```

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy env file
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start development server
npm run dev
```

The backend will start at `http://localhost:5000`

Swagger API docs: `http://localhost:5000/api-docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy env file
cp .env.example .env
# Edit VITE_API_URL if backend is not on localhost:5000

# Start development server
npm run dev
```

The frontend will start at `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT signing | ✅ |
| `JWT_EXPIRES_IN` | Token expiry (default: `7d`) | ✅ |
| `FRONTEND_URL` | Frontend URL for CORS | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | For images |
| `CLOUDINARY_API_KEY` | Cloudinary API key | For images |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | For images |
| `RAZORPAY_KEY_ID` | Razorpay test key ID | For payments |
| `RAZORPAY_KEY_SECRET` | Razorpay test key secret | For payments |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret | For webhooks |
| `SMTP_HOST` | SMTP server host | For email |
| `SMTP_PORT` | SMTP port (587 for TLS) | For email |
| `SMTP_USER` | SMTP username | For email |
| `SMTP_PASS` | SMTP password/app password | For email |
| `DEFAULT_COMMISSION_RATE` | Platform commission % (default: 10) | Optional |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL |

---

## Seed Credentials

> ⚠️ **Development use only. Never use these in production.**

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@karigarco.in` | `Admin@123456` |
| **Seller 1** | `meera.pottery@karigarco.in` | `Seller@123456` |
| **Seller 2** | `raju.woodcraft@karigarco.in` | `Seller@123456` |
| **Customer** | `priya@example.com` | `Customer@123` |

**Test coupon:** `WELCOME10` — 10% off, minimum order ₹500

---

## API Documentation

After starting the backend, visit:
```
http://localhost:5000/api-docs
```

### Core Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register customer |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | Bearer | Get current user |
| GET | `/api/products` | Optional | List products (filterable) |
| GET | `/api/products/:slug` | Optional | Product detail |
| POST | `/api/products` | SELLER | Create product |
| GET | `/api/categories` | — | All categories |
| GET | `/api/cart` | CUSTOMER | Get cart |
| POST | `/api/cart/items` | CUSTOMER | Add to cart |
| POST | `/api/orders` | CUSTOMER | Create order |
| POST | `/api/payments/create-order` | CUSTOMER | Create Razorpay order |
| POST | `/api/payments/verify` | CUSTOMER | Verify payment |
| POST | `/api/sellers/apply` | CUSTOMER | Apply as seller |
| GET | `/api/sellers/dashboard` | SELLER | Seller dashboard |
| GET | `/api/sellers/orders` | SELLER | Seller orders |
| PATCH | `/api/sellers/orders/items/:id/status` | SELLER | Update order status |
| GET | `/api/admin/dashboard` | ADMIN | Admin overview |
| GET | `/api/admin/sellers` | ADMIN | All sellers |
| PATCH | `/api/admin/sellers/:id/status` | ADMIN | Approve/reject seller |
| PATCH | `/api/admin/products/:id/approval` | ADMIN | Approve/reject product |

---

## Feature Checklist

### ✅ Implemented

**Authentication**
- [x] Customer registration (email + password)
- [x] Login / logout
- [x] Email verification flow
- [x] Forgot password / reset password
- [x] JWT auth with secure cookie
- [x] Role-based access control (CUSTOMER, SELLER, ADMIN)

**Customer Features**
- [x] Browse all products with filters (category, price, search, sort)
- [x] Product detail page with gallery, reviews, related products
- [x] Shopping cart (persist per user)
- [x] Wishlist
- [x] Checkout with address management
- [x] Razorpay payment integration (test mode)
- [x] Order confirmation email
- [x] Order tracking
- [x] Order cancellation
- [x] Account dashboard
- [x] Delivery address management
- [x] Product reviews and ratings

**Seller Features**
- [x] "Become a Seller" application flow
- [x] Seller onboarding with status (PENDING → APPROVED)
- [x] Complete seller dashboard
- [x] Product management (create, edit, archive)
- [x] Product image management
- [x] Product approval workflow
- [x] Order management with status updates
- [x] Tracking number entry
- [x] Inventory management with low-stock alerts
- [x] Earnings and commission records
- [x] Store profile management (logo, story, bio, social links)

**Admin Features**
- [x] Admin dashboard (GMV, revenue, stats)
- [x] Seller application review (approve/reject)
- [x] Product approval/rejection
- [x] Featured products management
- [x] Customer management
- [x] Commission rate configuration per seller
- [x] Order monitoring
- [x] Audit logs

**Public Website**
- [x] Homepage with hero, categories, featured products, artisans
- [x] Shop page with full filtering
- [x] Individual product pages
- [x] Artisan/seller profile pages
- [x] Newsletter subscription
- [x] About page

**Backend**
- [x] PostgreSQL + Prisma with 26 models
- [x] Complete REST API
- [x] JWT authentication middleware
- [x] Rate limiting (auth endpoints)
- [x] Server-side Zod validation
- [x] Centralized error handling
- [x] Pagination on all list endpoints
- [x] File upload via Cloudinary
- [x] Email via Nodemailer
- [x] Razorpay integration with webhook verification
- [x] Database transactions for order creation
- [x] Commission calculation on order
- [x] Stock management with reservation
- [x] IDOR protection (seller data isolation)
- [x] Swagger/OpenAPI documentation
- [x] Audit logging for sensitive admin actions

### ⚙️ Requires External Configuration

| Feature | Status | Configuration Needed |
|---|---|---|
| Cloudinary image upload | Configured, needs credentials | Set `CLOUDINARY_*` vars |
| Razorpay payments | Configured, needs test credentials | Set `RAZORPAY_*` vars |
| Email notifications | Configured, needs SMTP | Set `SMTP_*` vars |
| Shiprocket shipping | Abstraction layer ready | Implement `shippingService` in `backend/src/utils/shipping.ts` |

---

## Integration Configuration

### Razorpay (Payments)

1. Create account at [razorpay.com](https://razorpay.com)
2. Go to Settings → API Keys → Generate Test Mode Keys
3. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `backend/.env`
4. Set up webhook at `https://yourdomain.com/api/payments/webhook`
5. Add `RAZORPAY_WEBHOOK_SECRET` from the webhook settings

### Cloudinary (Images)

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → Account details
3. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Email (Gmail SMTP)

1. Enable 2FA on your Gmail account
2. Go to Google Account → Security → App Passwords
3. Generate password for "Mail"
4. Set `SMTP_USER=your@gmail.com`, `SMTP_PASS=the_app_password`

### Shiprocket (Shipping)

The abstraction is in `backend/src/utils/shipping.ts`. To activate:
1. Create account at [shiprocket.in](https://www.shiprocket.in)
2. Install the Shiprocket Node SDK
3. Replace the mock in `createShipment()` with actual API calls

---

## Deployment

### Backend (Railway / Render / EC2)

```bash
cd backend
npm run build
npm start
```

Required environment: Set all `DATABASE_URL`, `JWT_SECRET`, etc. Run `npm run db:migrate:deploy` against the production database before starting the backend; this applies the checked-in Prisma migrations and creates the required tables.

### Frontend (Vercel / Netlify)

```bash
cd frontend
npm run build
# Deploy the dist/ directory
```

Set `VITE_API_URL` to your production backend URL.
Set the backend's `FRONTEND_URL` environment variable to `https://karigar-co.vercel.app` so CORS and email links use the deployed frontend.

### Database

Use managed PostgreSQL: Railway, Supabase, Neon, or AWS RDS.

```bash
# Run migrations in production
npm run db:migrate:deploy
```

---

## Security Notes

- Never commit `.env` files
- Change all seed credentials before production deployment  
- Use `JWT_SECRET` with at least 32 random characters
- Configure CORS to your specific frontend domain in production
- Enable HTTPS in production
- Payment webhook signature is verified server-side before updating order status
- Seller data is strictly isolated — sellers can only access their own records
- Admin routes require `ADMIN` role — no escalation paths
- Passwords are hashed with bcrypt (12 rounds)
- Rate limiting on auth endpoints (10 requests per 15 minutes)
- Input validation with Zod on all endpoints

---

## Development Commands

```bash
# Backend
cd backend
npm run dev          # Start with hot reload
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:seed      # Re-seed database
npm run db:reset     # Reset & re-seed database

# Frontend
cd frontend
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
```

---

*Built with care for India's artisan community. KarigarCo. by Viraasat.*
