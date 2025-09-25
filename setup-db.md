# Database Setup Instructions

## Option 1: Docker (Recommended)

1. Start Docker Desktop manually from Start Menu
2. Wait for it to fully start (green icon in system tray)
3. Run: `docker compose up -d postgres`
4. Run: `npx prisma migrate deploy`

## Option 2: Local PostgreSQL Installation

1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Create database: `createdb gdrive`
4. Update .env: `DATABASE_URL=postgresql://postgres:password@localhost:5432/gdrive?schema=public`
5. Run: `npx prisma migrate deploy`

## Option 3: Cloud Database (Supabase/Neon)

1. Create free account at https://supabase.com or https://neon.tech
2. Create new database
3. Copy connection string to .env
4. Run: `npx prisma migrate deploy`

## Current .env should contain:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gdrive?schema=public
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=gdrive
CORS_ORIGIN=*
```
