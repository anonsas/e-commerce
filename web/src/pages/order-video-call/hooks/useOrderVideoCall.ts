import { useAuth } from "@clerk/react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { StreamVideoClient, Call } from "@stream-io/video-react-sdk";
import { apiFetch } from "@lib";
import type { GetOrderResponse, StreamTokenResponse } from "@ecommerce/shared";

export function useOrderVideoCall(id: string | undefined) {
  const { getToken, isSignedIn } = useAuth();

  // videoClient and activeCall are set once the Stream Video connection is established.
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Fetch the order to confirm it exists and is paid before connecting to video.
  const {
    data: orderData,
    error: orderError,
    isLoading: isOrderLoading,
  } = useQuery({
    queryKey: ["order", id],
    queryFn: () => apiFetch<GetOrderResponse>(`/api/orders/${id}`, { getToken }),
    enabled: !!id && !!isSignedIn,
  });

  const order = orderData?.order;
  const isPaid = order?.status === "paid";

  useEffect(() => {
    if (!isPaid || !id || !isSignedIn) return undefined;

    let client: StreamVideoClient | undefined;
    let call: Call | undefined;

    async function connect() {
      // 1. Get a short-lived Stream token scoped to the current user.
      const streamToken = await apiFetch<StreamTokenResponse>("/api/stream/token", {
        getToken,
        method: "POST",
      });

      // 2. Create the Stream Video client with the user's identity.
      client = new StreamVideoClient({
        apiKey: streamToken.apiKey,
        user: { id: streamToken.userId, name: streamToken.name },
        token: streamToken.token,
      });

      // 3. Join (or create) the call for this order — call ID matches the chat channel ID.
      call = client.call("default", `order-${id}`);
      await call.join({ create: true });

      setVideoClient(client);
      setActiveCall(call);
    }

    connect().catch((e) => {
      setConnectError(e instanceof Error ? e.message : "Video failed to start");
    });

    // Leave the call and disconnect cleanly when the component unmounts.
    return () => {
      call?.leave().catch(() => {});
      client?.disconnectUser().catch(() => {});
    };
  }, [isPaid, id, getToken, isSignedIn]);

  return {
    order,
    isPaid,
    isOrderLoading,
    orderError,
    videoClient,
    activeCall,
    connectError,
  };
}
