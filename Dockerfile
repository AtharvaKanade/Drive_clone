# Backend Dockerfile for Google Drive Clone - Railway Optimized
FROM node:20-alpine AS deps
WORKDIR /usr/src/app

# Install OpenSSL and other dependencies for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci --only=production

FROM node:20-alpine AS build
WORKDIR /usr/src/app

# Install OpenSSL and other dependencies for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# Generate Prisma client first, then build
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /usr/src/app

# Install OpenSSL and other dependencies for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

ENV NODE_ENV=production
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma
COPY --from=build /usr/src/app/scripts ./scripts
COPY package.json ./

# Create uploads directory for file storage
RUN mkdir -p uploads

# Make the startup script executable
RUN chmod +x scripts/railway-start.sh

EXPOSE 3000

# Use the robust startup script
CMD ["./scripts/railway-start.sh"]


