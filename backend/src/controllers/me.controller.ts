import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { getLocalUser } from "@/lib/users";
import type { MeResponse } from "@ecommerce/shared";

export class MeController {
  async getMe(request: Request, response: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(request);

      const user = await getLocalUser(userId!);

      // Map DB row to wire format: exclude internal fields and convert Date → ISO string.
      response.json({
        user: {
          id: user!.id,
          email: user!.email,
          displayName: user!.displayName,
          role: user!.role,
          createdAt: user!.createdAt.toISOString(),
          updatedAt: user!.updatedAt.toISOString(),
        },
      } satisfies MeResponse);
    } catch (e) {
      next(e);
    }
  }
}
