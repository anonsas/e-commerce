import { useAuth } from "@clerk/react";
import { StreamChat } from "stream-chat";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@lib";
import type { MeResponse, StreamTokenResponse } from "@ecommerce/shared";
import { USER_ROLES } from "@ecommerce/shared";

export function useOrderChat(id: string | undefined, isPaid: boolean) {
  const { getToken, isSignedIn } = useAuth();

  // streamClient holds the connected Stream Chat instance once setup completes.
  const [streamClient, setStreamClient] = useState<StreamChat | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  const { data: meData } = useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/api/me", { getToken }),
    enabled: isSignedIn,
  });

  const userRole = meData?.user?.role;

  // Staff-only: posts a video-invite message into the order's support channel.
  const sendVideoInvite = useMutation({
    mutationFn: () => apiFetch(`/api/orders/${id}/video-invite`, { getToken, method: "POST" }),
  });

  useEffect(() => {
    if (!isPaid || !id) return undefined;

    let client: StreamChat | undefined;

    async function connect() {
      // 1. Create the Stream channel on the backend if it doesn't exist yet (safe to call twice).
      await apiFetch(`/api/orders/${id}/stream-channel`, { method: "POST", getToken });

      // 2. Get a short-lived Stream token scoped to the current user.
      const streamToken = await apiFetch<StreamTokenResponse>("/api/stream/token", {
        getToken,
        method: "POST",
      });

      // 3. Connect to Stream Chat with the token.
      client = StreamChat.getInstance(streamToken.apiKey);
      await client.connectUser(
        { id: streamToken.userId, name: streamToken.name },
        streamToken.token,
      );

      // 4. Start watching the order's channel so messages stream in real-time.
      const channel = client.channel("messaging", `order-${id}`);
      await channel.watch();

      setStreamClient(client);
    }

    connect().catch((e) => {
      setConnectError(e instanceof Error ? e.message : "Chat failed to load");
    });

    // Disconnect cleanly when the component unmounts or the order ID changes.
    return () => {
      setStreamClient(null);
      if (client) client.disconnectUser();
    };
  }, [isPaid, id, getToken]);

  // Derive the active channel from the connected client so consumers don't build it themselves.
  const channel = streamClient && id ? streamClient.channel("messaging", `order-${id}`) : null;
  const canSendVideoInvite = userRole === USER_ROLES.support || userRole === USER_ROLES.admin;

  return { streamClient, channel, connectError, canSendVideoInvite, sendVideoInvite };
}
