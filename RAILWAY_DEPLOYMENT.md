# Railway Deployment Guide

This guide will help you deploy your Google Drive Clone backend to Railway with proper Prisma configuration.

## Prerequisites

1. Railway account
2. PostgreSQL database (Railway provides this)
3. Supabase account for file storage

## Deployment Steps

### 1. Environment Variables

Set these environment variables in your Railway project:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database?schema=public

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-minimum-16-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_BUCKET=gdrive-files

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Node Environment
NODE_ENV=production
PORT=3000

# Prisma Configuration for Railway
PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
```

### 2. Railway Configuration

The project includes:

- `railway.json` - Railway deployment configuration
- `Dockerfile` - Optimized for Railway with OpenSSL fixes
- `scripts/railway-start.sh` - Robust startup script with retry logic

### 3. Key Fixes Applied

#### OpenSSL Issues

- Added OpenSSL packages to Dockerfile
- Set `PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x`
- Updated Prisma schema with proper binary targets

#### Schema Engine Errors

- Added retry logic for Prisma operations
- Improved error handling in startup script
- Added database connection verification

#### Railway Optimizations

- Multi-stage Docker build for smaller image size
- Health check endpoint at `/health`
- Proper environment variable handling
- Railway-specific configuration file

### 4. Deployment Commands

Railway will automatically:

1. Build the Docker image
2. Run `npx prisma generate`
3. Run `npx prisma migrate deploy`
4. Start the application

### 5. Troubleshooting

If you still encounter issues:

1. **Check Railway logs** for specific error messages
2. **Verify DATABASE_URL** is correctly formatted
3. **Ensure all environment variables** are set
4. **Check Supabase configuration** if using file storage

### 6. Health Check

The application exposes a health check endpoint at `/health` that returns:

```json
{
  "status": "ok"
}
```

This helps Railway monitor your deployment health.

## Common Issues Fixed

- ✅ OpenSSL/libssl detection problems
- ✅ Schema engine response parsing errors
- ✅ Database connection timeouts
- ✅ Prisma binary target mismatches
- ✅ Railway-specific deployment optimizations
