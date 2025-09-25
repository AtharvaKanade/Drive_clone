import { NextFunction, Request, Response } from 'express';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = (err as any)?.statusCode ?? 500;
  const message = (err as any)?.message ?? 'Internal Server Error';
  const code = (err as any)?.code as string | undefined;
  res.status(status).json({ error: { message, code, status } });
}


