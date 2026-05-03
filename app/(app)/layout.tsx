import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Fab } from "@/components/nav/fab";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <Fab />
      <BottomNav />
    </div>
  );
}
