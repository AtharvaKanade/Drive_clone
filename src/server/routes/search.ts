import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middlewares/auth.js';

export const searchRouter = Router();

searchRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const q = String(req.query.q ?? '').trim();
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
  if (!q) return res.json({ page, limit, total: 0, results: { files: [], folders: [] } });
  const files = await prisma.file.findMany({
    where: { 
      ownerId: req.user!.id, 
      deletedAt: null, 
      OR: [
        { name: { contains: q, mode: 'insensitive' } }, 
        { mimeType: { contains: q, mode: 'insensitive' } }
      ] 
    },
    take: limit,
    skip: (page - 1) * limit,
    orderBy: { updatedAt: 'desc' },
  });
  const folders = await prisma.folder.findMany({
    where: { 
      ownerId: req.user!.id, 
      name: { contains: q, mode: 'insensitive' } 
    },
    take: limit,
    skip: (page - 1) * limit,
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ page, limit, total: files.length + folders.length, results: { files, folders } });
});


