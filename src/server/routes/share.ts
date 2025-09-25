import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../db/prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middlewares/auth.js';
import { ResourceType } from '@prisma/client';
import { getSignedDownloadUrl } from '../storage/signing.js';

export const shareRouter = Router();

const createSchema = z.object({
  resourceId: z.string().uuid(),
  resourceType: z.enum(['FILE', 'FOLDER']),
  role: z.enum(['VIEWER', 'EDITOR']).default('VIEWER'),
  expiresInMinutes: z.number().int().min(1).max(60 * 24 * 30).default(60),
});

shareRouter.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Invalid input' } });
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + parsed.data.expiresInMinutes * 60 * 1000);
  const link = await prisma.shareLink.create({
    data: { token, resourceId: parsed.data.resourceId, resourceType: parsed.data.resourceType as ResourceType, role: parsed.data.role as any, expiresAt },
  });
  res.status(201).json({ token: link.token, expiresAt: link.expiresAt });
});

shareRouter.get('/:token', async (req, res) => {
  const token = req.params.token;
  const link = await prisma.shareLink.findUnique({ where: { token } });
  if (!link || link.expiresAt.getTime() < Date.now()) return res.status(404).json({ error: { message: 'Invalid link' } });
  if (link.resourceType === 'FILE') {
    const file = await prisma.file.findUnique({ where: { id: link.resourceId } });
    if (!file || file.deletedAt) return res.status(404).json({ error: { message: 'Not found' } });
    const signedUrl = await getSignedDownloadUrl(file.key, 60 * 5);
    return res.json({ file: { id: file.id, name: file.name, mimeType: file.mimeType, size: file.size.toString() }, url: signedUrl });
  }
  // For folder, return metadata only
  const folder = await prisma.folder.findUnique({ where: { id: link.resourceId } });
  if (!folder) return res.status(404).json({ error: { message: 'Not found' } });
  return res.json({ folder: { id: folder.id, name: folder.name } });
});


