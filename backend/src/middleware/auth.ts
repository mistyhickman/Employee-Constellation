import type { Request, Response, NextFunction } from "express";
import { verifySession, SESSION_COOKIE, type SessionPayload } from "../services/authService.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      session?: SessionPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  const session = token ? verifySession(token) : null;
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  req.session = session;
  next();
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.roles.includes(role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
