import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../auth/jwt.js';

export type AuthenticatedRequest = Request & { user?: { id: string; email: string } };

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }
  try {
    const token = header.slice('Bearer '.length);
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: { message: 'Invalid token' } });
  }
}


