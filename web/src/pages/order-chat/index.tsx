import {
  Chat,
  Channel,
  Thread,
  Window,
  MessageList,
  ChannelHeader,
  MessageComposer,
} from "stream-chat-react";
import { HeadphonesIcon, VideoIcon } from "lucide-react";
import { useParams, useOutletContext } from "react-router";
import { useOrderChat } from "./hooks/useOrderChat";
import type { OrderDetailsOutletContext } from "@pages";
import { OrderChatPanelSkeleton, PageError } from "@components";
import "stream-chat-react/dist/css/index.css";

export function OrderChatPage() {
  const { id } = useParams<{ id: string }>();
  const { isPaid } = useOutletContext<OrderDetailsOutletContext>();
  const { streamClient, channel, connectError, canSendVideoInvite, sendVideoInvite } = useOrderChat(
    id,
    isPaid,
  );

  if (!isPaid) {
    return <p className="text-base-content/60">Complete payment to open support chat.</p>;
  }
  if (connectError) return <PageError message={connectError} />;
  if (!streamClient || !channel) return <OrderChatPanelSkeleton />;

  return (
    <div className="space-y-4 text-left">
      <div className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body flex-row flex-wrap items-start gap-4">
          <div className="avatar placeholder">
            <div className="w-12 rounded-box bg-primary/20 text-primary flex items-center justify-center">
              <HeadphonesIcon className="size-6" aria-hidden />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="card-title text-base">Message support</h3>
            <p className="text-sm text-base-content/70">
              Ask about this order, shipping, or returns. Support can send a video call link here
              when needed; both sides use the same Join button.
            </p>

            {canSendVideoInvite ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm gap-2"
                  disabled={sendVideoInvite.isPending}
                  onClick={() => sendVideoInvite.mutate()}
                >
                  {sendVideoInvite.isPending ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <VideoIcon className="size-4" aria-hidden />
                  )}
                  Send video call invite
                </button>

                {sendVideoInvite.isError ? (
                  <span className="text-sm text-error">Could not send invite.</span>
                ) : null}

                {sendVideoInvite.isSuccess ? (
                  <span className="text-sm text-success">Invite sent.</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="stream-panel h-140 overflow-hidden rounded-box border border-neutral-700 bg-neutral-950 [&_.str-chat\_\_main-panel]:min-h-0">
        <Chat client={streamClient} theme="messaging str-chat__theme-dark">
          <Channel channel={channel}>
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageComposer focus />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </div>
  );
}
