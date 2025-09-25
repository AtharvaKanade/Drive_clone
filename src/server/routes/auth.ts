import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../db/prisma.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../auth/jwt.js';

export const authRouter = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

authRouter.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Invalid input' } });
  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: { message: 'Email in use' } });
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash, name } });
  const access = signAccessToken({ sub: user.id, email: user.email });
  const refresh = signRefreshToken({ sub: user.id, email: user.email });
  const tokenHash = crypto.createHash('sha256').update(refresh).digest('hex');
  await prisma.refreshToken.create({ data: { tokenHash, userId: user.id } });
  return res.status(201).json({ accessToken: access, refreshToken: refresh, user: { id: user.id, email: user.email, name: user.name } });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Invalid input' } });
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: { message: 'Invalid credentials' } });
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: { message: 'Invalid credentials' } });
  const access = signAccessToken({ sub: user.id, email: user.email });
  const refresh = signRefreshToken({ sub: user.id, email: user.email });
  const tokenHash = crypto.createHash('sha256').update(refresh).digest('hex');
  await prisma.refreshToken.create({ data: { tokenHash, userId: user.id } });
  return res.json({ accessToken: access, refreshToken: refresh, user: { id: user.id, email: user.email, name: user.name } });
});

const refreshSchema = z.object({ refreshToken: z.string().min(10) });
authRouter.post('/refresh', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Invalid input' } });
  const { refreshToken } = parsed.data;
  try {
    const payload = verifyToken(refreshToken);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revoked) return res.status(401).json({ error: { message: 'Token revoked' } });
    const access = signAccessToken({ sub: payload.sub, email: payload.email });
    return res.json({ accessToken: access });
  } catch {
    return res.status(401).json({ error: { message: 'Invalid token' } });
  }
});

authRouter.post('/logout', async (req, res) => {
  const token = (req.body?.refreshToken as string | undefined) ?? '';
  if (!token) return res.status(400).json({ error: { message: 'Missing refreshToken' } });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
  return res.status(204).send();
});


