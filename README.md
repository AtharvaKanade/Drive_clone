# Google Drive Clone - Minimal Backend (Day 1–3)

Production-ready Node.js + TypeScript backend with PostgreSQL (Prisma), JWT auth, and S3-compatible storage (MinIO). Includes Docker, migrations, and tests.

## Quick start (Docker)

```bash
cp .env.example .env
# build and start
docker compose up -d --build
# apply migrations
docker compose exec app npx prisma migrate deploy
```

App: http://localhost:3000, health: `/health`.

## Local development

```bash
npm install
npm run prisma:generate
npm run dev
```

### Migrations

```bash
npx prisma migrate dev --name init
npm run prisma:deploy
```

## Testing

```bash
# ensure DATABASE_URL points at a running postgres
npm test
```

## API (selected)

- POST `/api/auth/signup` { email, password, name }
- POST `/api/auth/login` { email, password }
- POST `/api/auth/refresh` { refreshToken }
- POST `/api/auth/logout` { refreshToken }
- GET `/api/files` (auth)
- POST `/api/files/upload` form-data file=... [folderId]
- GET `/api/files/:id/download` (auth)
- DELETE `/api/files/:id` (auth)
- GET `/api/folders` (auth)
- POST `/api/folders` { name, parentId? } (auth)
- GET `/api/folders/:id/children` (auth)
- DELETE `/api/folders/:id` (auth)

## Configuration

See `.env.example` for required variables.

## Security

- Helmet, CORS, compression, and rate limiting enabled
- Strong password hashing (bcrypt)
- JWT access and refresh tokens
- Request validation via Zod

# 1. Start database and storage services

docker-compose up -d postgres minio

# 2. Start backend API (in one terminal)

npm run dev

# 3. Start frontend (in another terminal)

cd web
npm run dev
