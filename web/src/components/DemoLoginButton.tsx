import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useSignIn } from "@clerk/react";
import { PlayIcon } from "lucide-react";
import { apiFetch } from "@lib";

type Props = {
  className?: string;
};

/** One-click sign-in as the shared demo user. Hidden unless the backend enables demo login. */
export function DemoLoginButton({ className = "btn btn-secondary gap-2" }: Props) {
  const { signIn } = useSignIn();
  const [isLoading, setIsLoading] = useState(false);

  const { data } = useQuery({
    queryKey: ["demo-status"],
    queryFn: () => apiFetch<{ enabled: boolean }>("/api/demo/status"),
    staleTime: Infinity,
  });

  if (!data?.enabled) return null;

  async function handleDemoLogin() {
    setIsLoading(true);
    try {
      const { token } = await apiFetch<{ token: string }>("/api/demo/sign-in-token", {
        method: "POST",
      });

      const ticketResult = await signIn.ticket({ ticket: token });
      if (ticketResult.error) throw ticketResult.error;

      const finalizeResult = await signIn.finalize();
      if (finalizeResult.error) throw finalizeResult.error;

      toast.success("Signed in as the demo user. Explore the store!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Demo login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDemoLogin}
      disabled={isLoading}
      aria-busy={isLoading}
      data-analytics="demo-login"
      className={className}
    >
      {isLoading ? (
        <span className="loading loading-spinner loading-sm" aria-hidden />
      ) : (
        <PlayIcon className="size-4" aria-hidden />
      )}
      Try demo
    </button>
  );
}
