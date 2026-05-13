import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell min-h-screen w-full">
      {/* Desktop background, mobile-frame container */}
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-cream-50 shadow-[0_0_60px_-30px_rgba(50,46,41,0.2)] md:my-6 md:min-h-[calc(100vh-3rem)] md:rounded-[40px] md:border md:border-cream-200">
        <div className="flex-1 pb-24">{children}</div>
        <BottomNav />
      </div>
    </div>
  );
}
