#!/bin/sh

# Railway deployment script with error handling
set -e

echo "🚀 Starting Railway deployment..."

# Function to retry commands with exponential backoff
retry_with_backoff() {
    local max_attempts=5
    local delay=2
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt of $max_attempts..."
        if "$@"; then
            echo "✅ Command succeeded on attempt $attempt"
            return 0
        else
            echo "❌ Command failed on attempt $attempt"
            if [ $attempt -eq $max_attempts ]; then
                echo "💥 All attempts failed"
                return 1
            fi
            echo "⏳ Waiting $delay seconds before retry..."
            sleep $delay
            delay=$((delay * 2))
            attempt=$((attempt + 1))
        fi
    done
}

# Generate Prisma client with retry
echo "📦 Generating Prisma client..."
retry_with_backoff npx prisma generate

# Run database migrations with retry
echo "🗄️ Running database migrations..."
retry_with_backoff npx prisma migrate deploy

# Verify database connection
echo "🔍 Verifying database connection..."
retry_with_backoff npx prisma db push --accept-data-loss

# Start the application
echo "🎯 Starting application..."
exec node dist/index.js
