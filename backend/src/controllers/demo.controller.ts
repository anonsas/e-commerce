import { clerkClient } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { env } from "@/lib/env";

// Demo login lets visitors try the store without signing up. It is enabled only when
// DEMO_USER_ID points to a non-admin Clerk user.
export class DemoController {
  getStatus(_request: Request, response: Response) {
    response.json({ enabled: Boolean(env.DEMO_USER_ID) });
  }

  async createSignInToken(_request: Request, response: Response, next: NextFunction) {
    try {
      if (!env.DEMO_USER_ID) {
        response.status(404).json({ error: "Demo login is not enabled" });
        return;
      }

      const { token } = await clerkClient.signInTokens.createSignInToken({
        userId: env.DEMO_USER_ID,
        expiresInSeconds: 60,
      });

      response.json({ token });
    } catch (e) {
      next(e);
    }
  }
}
