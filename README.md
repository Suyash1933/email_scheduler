# Email Scheduler - Full-Stack Application

A production-grade email scheduling system built with Express.js, BullMQ, Redis, PostgreSQL, and React. Schedule and manage email campaigns with reliable queue-based processing, rate limiting, and persistence across server restarts.

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│   React UI  │────▶│  Express API │────▶│ PostgreSQL│
│  (Vite+TS)  │     │  (TypeScript)│     │ (Prisma)  │
└─────────────┘     └──────┬───────┘     └───────────┘
                           │
                    ┌──────▼───────┐     ┌───────────┐
                    │   BullMQ     │────▶│   Redis   │
                    │   Queue      │     │ (Persist) │
                    └──────┬───────┘     └───────────┘
                           │
                    ┌──────▼───────┐     ┌───────────┐
                    │   BullMQ     │────▶│ Ethereal  │
                    │   Worker     │     │   SMTP    │
                    └──────────────┘     └───────────┘
```

### How Scheduling Works

1. User submits email schedule request via the frontend
2. Backend creates `EmailJob` records in PostgreSQL and adds delayed jobs to BullMQ
3. BullMQ delayed jobs are stored in Redis with calculated delay based on scheduled time
4. When the delay expires, the BullMQ worker picks up the job and sends via Ethereal SMTP
5. Job status is updated in PostgreSQL (scheduled → queued → sent/failed)

### Persistence on Restart

- **BullMQ + Redis**: All delayed jobs are stored in Redis with `appendonly` persistence enabled. When the server restarts, the worker reconnects and resumes processing jobs at their scheduled times.
- **PostgreSQL**: All email jobs are stored in the database with their status, ensuring no data loss.
- **Idempotency**: Before sending, the worker checks the DB status to prevent duplicate sends. Each job has a unique ID used as the BullMQ job ID.

### Rate Limiting & Concurrency

**Worker Concurrency**: Configurable via `WORKER_CONCURRENCY` env var (default: 5). Multiple jobs process in parallel safely.

**Delay Between Emails**: A minimum delay (`MIN_DELAY_BETWEEN_EMAILS`, default: 2000ms) is enforced in the worker between each send to mimic SMTP provider throttling.

**Hourly Rate Limiting**: Uses Redis-backed atomic counters keyed by hour window (`rate_limit:global:YYYY-MM-DD-HH`). When the limit (`MAX_EMAILS_PER_HOUR`, default: 200) is exceeded:

- Jobs are NOT dropped or permanently failed
- Jobs are automatically rescheduled to the next hour window
- Order is preserved as much as possible
- Counters are safe across multiple workers/instances (Redis INCR is atomic)

## Tech Stack

| Layer    | Technology                            |
| -------- | ------------------------------------- |
| Backend  | TypeScript, Express.js                |
| Queue    | BullMQ + Redis                        |
| Database | PostgreSQL + Prisma ORM               |
| SMTP     | Ethereal Email (fake SMTP)            |
| Frontend | React, TypeScript, Tailwind CSS, Vite |
| Auth     | Google OAuth 2.0 (Passport.js)        |
| Infra    | Docker Compose                        |

## Prerequisites

- Node.js 18+
- Docker & Docker Compose (for Redis + PostgreSQL)
- Google OAuth credentials (from Google Cloud Console)

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd email_scheduler

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Start Infrastructure

```bash
# From project root
docker-compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379) with persistent volumes.

### 3. Configure Environment

```bash
# Copy and edit backend env
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  - Set authorized redirect URI to: `http://localhost:5000/auth/callback`
- `ETHEREAL_USER` and `ETHEREAL_PASS`: Get from [Ethereal Email](https://ethereal.email/) (or leave blank for auto-generated credentials)

---

check in : https://ethereal.email/messages

---

### 4. Setup Database

```bash
cd backend
npx prisma db push    # Create tables
npx prisma generate   # Generate client
```

### 5. Run the Application

```bash
# Terminal 1: Backend (starts Express server + BullMQ worker)
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Ethereal Email**: https://ethereal.email/ (to view sent emails)

## API Endpoints

### Authentication

| Method | Endpoint         | Description           |
| ------ | ---------------- | --------------------- |
| GET    | `/auth/google`   | Initiate Google OAuth |
| GET    | `/auth/callback` | OAuth callback        |
| POST   | `/auth/logout`   | Logout                |
| GET    | `/auth/me`       | Get current user      |

### Email Management

| Method | Endpoint            | Description           |
| ------ | ------------------- | --------------------- |
| POST   | `/emails/schedule`  | Schedule emails       |
| GET    | `/emails/scheduled` | List scheduled emails |
| GET    | `/emails/sent`      | List sent emails      |
| GET    | `/emails/:id`       | Get email by ID       |

### Schedule Email Request Body

```json
{
  "subject": "Hello",
  "body": "<p>Email content</p>",
  "recipients": ["user1@example.com", "user2@example.com"],
  "scheduledTime": "2025-01-01T10:00:00.000Z",
  "delayBetweenEmails": 2000,
  "hourlyLimit": 200
}
```

## Environment Variables

| Variable                   | Default               | Description                      |
| -------------------------- | --------------------- | -------------------------------- |
| `PORT`                     | 5000                  | Backend server port              |
| `DATABASE_URL`             | -                     | PostgreSQL connection string     |
| `REDIS_HOST`               | localhost             | Redis host                       |
| `REDIS_PORT`               | 6379                  | Redis port                       |
| `GOOGLE_CLIENT_ID`         | -                     | Google OAuth client ID           |
| `GOOGLE_CLIENT_SECRET`     | -                     | Google OAuth client secret       |
| `SESSION_SECRET`           | -                     | Express session secret           |
| `FRONTEND_URL`             | http://localhost:5173 | Frontend URL for CORS            |
| `ETHEREAL_USER`            | -                     | Ethereal SMTP username           |
| `ETHEREAL_PASS`            | -                     | Ethereal SMTP password           |
| `WORKER_CONCURRENCY`       | 5                     | BullMQ worker concurrency        |
| `MAX_EMAILS_PER_HOUR`      | 200                   | Max emails per hour (rate limit) |
| `MIN_DELAY_BETWEEN_EMAILS` | 2000                  | Min delay between sends (ms)     |

## Features Implemented

### Backend

- [x] Express.js + TypeScript server
- [x] Google OAuth authentication (Passport.js)
- [x] PostgreSQL database with Prisma ORM
- [x] BullMQ delayed job scheduling (no cron)
- [x] BullMQ worker with configurable concurrency
- [x] Ethereal Email SMTP integration
- [x] Redis-backed hourly rate limiting
- [x] Configurable delay between email sends
- [x] Job persistence across server restarts
- [x] Idempotent email sending (no duplicates)
- [x] Automatic rescheduling when rate limit exceeded
- [x] Exponential backoff retries on failure

### Frontend

- [x] Google OAuth login
- [x] Dashboard with scheduled/sent email tabs
- [x] Compose email modal with CSV/TXT file upload
- [x] Email address parsing and validation
- [x] Scheduling options (start time, delay, hourly limit)
- [x] Real-time auto-refresh (10s interval)
- [x] Loading states, empty states, error handling
- [x] Responsive design with Tailwind CSS
- [x] Toast notifications

## Project Structure

```
email_scheduler/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.ts         # Environment config
│   │   │   ├── passport.ts      # Google OAuth strategy
│   │   │   ├── prisma.ts        # Prisma client
│   │   │   └── redis.ts         # Redis connection
│   │   ├── controllers/
│   │   │   └── emailController.ts
│   │   ├── middlewares/
│   │   │   └── auth.ts          # Auth middleware
│   │   ├── queues/
│   │   │   └── emailQueue.ts    # BullMQ queue
│   │   ├── routes/
│   │   │   ├── auth.ts          # Auth routes
│   │   │   └── emails.ts        # Email routes
│   │   ├── services/
│   │   │   ├── emailService.ts  # SMTP service
│   │   │   └── rateLimiter.ts   # Rate limiting
│   │   ├── workers/
│   │   │   └── emailWorker.ts   # BullMQ worker
│   │   └── server.ts            # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ComposeModal.tsx
│   │   │   ├── EmailTable.tsx
│   │   │   └── Header.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   └── LoginPage.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── package.json
├── docker-compose.yml
└── README.md
```
"# email_scheduler" 
