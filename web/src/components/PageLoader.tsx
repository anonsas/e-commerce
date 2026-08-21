import { LoaderIcon } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <LoaderIcon className="size-10 animate-spin text-primary" />
    </div>
  );
}
