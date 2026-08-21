import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { Footer } from "./Footer";

type Props = {
  children: ReactNode;
};

export function Layout({ children }: Props) {
  return (
    <div className="flex min-h-svh flex-col bg-base-200 text-base-content">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 pb-24 sm:pb-8 md:px-6 md:py-10">
        {children}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
