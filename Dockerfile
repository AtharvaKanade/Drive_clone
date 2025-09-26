# Backend Dockerfile for Google Drive Clone
FROM node:20-alpine AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
# Generate Prisma client first, then build
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma
COPY package.json ./
# Create uploads directory for file storage
RUN mkdir -p uploads
EXPOSE 3000
# Run database migrations and start the server
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/index.js"]


