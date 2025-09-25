import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middlewares/auth.js';

export const foldersRouter = Router();

foldersRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
  const where = { ownerId: req.user!.id, parentId: null as string | null };
  const [total, items] = await Promise.all([
    prisma.folder.count({ where }),
    prisma.folder.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: (page - 1) * limit }),
  ]);
  res.json({ page, limit, total, results: items });
});

foldersRouter.get('/:id/children', requireAuth, async (req: AuthenticatedRequest, res) => {
  const folders = await prisma.folder.findMany({ where: { ownerId: req.user!.id, parentId: req.params.id } });
  const files = await prisma.file.findMany({ where: { ownerId: req.user!.id, folderId: req.params.id } });
  res.json({ 
    folders, 
    files: files.map(file => ({
      ...file,
      size: file.size.toString()
    }))
  });
});

const createSchema = z.object({ name: z.string().min(1), parentId: z.string().uuid().nullable().optional() });
foldersRouter.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Invalid input' } });
  const created = await prisma.folder.create({ data: { name: parsed.data.name, ownerId: req.user!.id, parentId: parsed.data.parentId ?? null } });
  res.status(201).json({ folder: created });
});

const renameSchema = z.object({ name: z.string().min(1) });
foldersRouter.post('/:id/rename', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = renameSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Invalid input' } });
  const folder = await prisma.folder.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
  if (!folder) return res.status(404).json({ error: { message: 'Not found' } });
  const updated = await prisma.folder.update({ where: { id: folder.id }, data: { name: parsed.data.name } });
  res.json({ folder: updated });
});

foldersRouter.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  await prisma.folder.delete({ where: { id: req.params.id } });
  res.status(204).send();
});


