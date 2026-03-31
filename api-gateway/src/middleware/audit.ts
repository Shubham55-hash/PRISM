import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from './auth';

export function auditLog(req: AuthRequest, res: Response, next: NextFunction): void {
  const originalEnd = res.end.bind(res);
  (res as any).end = async function (chunk: any, encoding?: any, cb?: any) {
    // Only log mutating operations for authenticated users
    if (req.user && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      try {
        await prisma.activityLog.create({
          data: {
            userId: req.user.userId,
            eventType: 'api_access',
            title: `${req.method} ${req.path}`,
            description: `API call: ${req.method} ${req.originalUrl}`,
            ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
            metadata: JSON.stringify({ method: req.method, path: req.path, statusCode: res.statusCode }),
          },
        });
      } catch {
        // Non-blocking
      }
    }
    return originalEnd(chunk, encoding, cb);
  };
  next();
}
