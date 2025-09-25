import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { prisma } from '../db/prisma.js';
import { ResourceType } from '@prisma/client';

async function getUserPermission(
  userId: string,
  resourceId: string,
  resourceType: ResourceType
): Promise<{ canRead: boolean; canWrite: boolean } | null> {
  if (!userId) return null;
  const p = await prisma.permission.findUnique({
    where: { userId_resourceId_resourceType: { userId, resourceId, resourceType } },
    select: { canRead: true, canWrite: true },
  });
  return p ?? null;
}

export function requireRead(resourceType: ResourceType, resourceIdParam: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const resourceId = req.params[resourceIdParam];
    const permission = await getUserPermission(req.user!.id, resourceId, resourceType);
    if (!permission || !permission.canRead) return res.status(403).json({ error: { message: 'Forbidden' } });
    next();
  };
}

export function requireWrite(resourceType: ResourceType, resourceIdParam: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const resourceId = req.params[resourceIdParam];
    const permission = await getUserPermission(req.user!.id, resourceId, resourceType);
    if (!permission || !permission.canWrite) return res.status(403).json({ error: { message: 'Forbidden' } });
    next();
  };
}


