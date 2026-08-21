import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { env } from "@/lib/env";
import { getLocalUser } from "@/lib/users";
import { getStreamChatServer, streamChatDisplayName, getStreamUserId } from "@/lib/stream";

export class StreamController {
  async createStreamToken(request: Request, response: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(request);

      const localUser = await getLocalUser(userId!);
      if (!localUser) {
        response.status(503).json({ error: "Account not synced yet" });
        return;
      }

      const server = getStreamChatServer();

      const clerkUser = await clerkClient.users.getUser(userId!);

      const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

      const displayName = streamChatDisplayName(
        localUser.role,
        localUser.displayName ?? fullName ?? clerkUser.username,
        localUser.email,
      );

      const image = clerkUser.imageUrl || undefined;
      const streamUserId = getStreamUserId(userId!);

      await server.upsertUser({ id: streamUserId, name: displayName, image });

      const token = server.createToken(streamUserId);

      response.json({ token, apiKey: env.STREAM_API_KEY, userId: streamUserId, name: displayName });
    } catch (e) {
      next(e);
    }
  }
}
