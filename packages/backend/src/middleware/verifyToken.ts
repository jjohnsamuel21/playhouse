import type { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase-admin';

export interface AuthRequest extends Request {
  user: { uid: string; email?: string };
}

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }
  const token = header.slice(7);
  try {
    const decoded = await auth.verifyIdToken(token);
    (req as AuthRequest).user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
