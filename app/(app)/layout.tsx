import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Fab } from "@/components/nav/fab";
import { RouteTransition } from "@/components/nav/route-transition";
import { getUrgentCount } from "@/lib/queries/events";

/*
 * Transiciones entre pantallas: la nueva entra con un fundido + leve subida, la
 * vieja sale rápido. La barra inferior y el "+" quedan fijos (sin fundido).
 */
const viewTransitionCss = `
@keyframes vt-fade-in { from { opacity: 0; transform: translateY(8px); } }
@keyframes vt-fade-out { to { opacity: 0; } }
::view-transition-old(.vt-page-exit) { animation: 120ms ease-in both vt-fade-out; }
::view-transition-new(.vt-page-enter) { animation: 220ms cubic-bezier(0.23, 1, 0.32, 1) 60ms both vt-fade-in; }
::view-transition-group(bottom-nav), ::view-transition-group(quick-fab) { animation: none; z-index: 100; }
::view-transition-old(bottom-nav), ::view-transition-old(quick-fab) { display: none; }
::view-transition-new(bottom-nav), ::view-transition-new(quick-fab) { animation: none; }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) {
    animation-duration: 0s !important; animation-delay: 0s !important;
  }
}
`;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const urgentCount = await getUrgentCount();

  return (
    <div className="flex min-h-dvh flex-col">
      <style href="mi-explotacion-view-transitions" precedence="default">
        {viewTransitionCss}
      </style>
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <Fab />
      <BottomNav urgentCount={urgentCount} />
    </div>
  );
}
