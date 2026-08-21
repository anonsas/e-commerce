import { StreamChat } from "stream-chat";
import type { UserRole } from "@ecommerce/shared";
import { USER_ROLES } from "@ecommerce/shared";
import { env } from "./env";

export function streamChatDisplayName(
  role: UserRole,
  displayName: string | null,
  email: string,
): string {
  const base = displayName ?? email.split("@")[0];
  if (role === USER_ROLES.admin) return `Admin · ${base}`;
  if (role === USER_ROLES.support) return `Support · ${base}`;
  return base;
}

export function getStreamChatServer() {
  return StreamChat.getInstance(env.STREAM_API_KEY, env.STREAM_API_SECRET);
}

export function getStreamUserId(clerkUserId: string) {
  return `clerk_${clerkUserId}`;
}
