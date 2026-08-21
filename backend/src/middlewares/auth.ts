import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { isAdmin } from "@/lib/roles";
import { getLocalUser } from "@/lib/users";

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const { userId, isAuthenticated } = getAuth(request);
  if (!isAuthenticated || !userId) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = await getLocalUser(userId);
    if (!user || !isAdmin(user.role)) {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    next();
  } catch (e) {
    next(e);
  }
}
