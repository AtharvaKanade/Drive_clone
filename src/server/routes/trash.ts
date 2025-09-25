import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middlewares/auth.js';
import { prisma } from '../db/prisma.js';

export const trashRouter = Router();

trashRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
  const [filesTotal, foldersTotal, files, folders] = await Promise.all([
    prisma.file.count({ where: { ownerId: req.user!.id, deletedAt: { not: null } } }),
    prisma.folder.count({ where: { ownerId: req.user!.id, deletedAt: { not: null } } }),
    prisma.file.findMany({ where: { ownerId: req.user!.id, deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, take: limit, skip: (page - 1) * limit }),
    prisma.folder.findMany({ where: { ownerId: req.user!.id, deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, take: limit, skip: (page - 1) * limit }),
  ]);
  res.json({ page, limit, total: filesTotal + foldersTotal, results: { files, folders } });
});

trashRouter.post('/restore/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = req.params.id;
  const file = await prisma.file.findFirst({ where: { id, ownerId: req.user!.id, deletedAt: { not: null } } });
  if (file) {
    const updated = await prisma.file.update({ where: { id }, data: { deletedAt: null } });
    return res.json({ file: updated });
  }
  const folder = await prisma.folder.findFirst({ where: { id, ownerId: req.user!.id, deletedAt: { not: null } } });
  if (folder) {
    const updated = await prisma.folder.update({ where: { id }, data: { deletedAt: null } });
    return res.json({ folder: updated });
  }
  return res.status(404).json({ error: { message: 'Not found' } });
});

trashRouter.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = req.params.id;
  const file = await prisma.file.findFirst({ where: { id, ownerId: req.user!.id, deletedAt: { not: null } } });
  if (file) {
    await prisma.file.delete({ where: { id } });
    return res.status(204).send();
  }
  const folder = await prisma.folder.findFirst({ where: { id, ownerId: req.user!.id, deletedAt: { not: null } } });
  if (folder) {
    await prisma.folder.delete({ where: { id } });
    return res.status(204).send();
  }
  return res.status(404).json({ error: { message: 'Not found' } });
});


