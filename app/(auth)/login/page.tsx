import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Acceso · Acienda",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  if (await isAuthenticated()) {
    redirect(sp.next && sp.next.startsWith("/") ? sp.next : "/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-8">
        <header className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl">
            🐑
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Acienda</h1>
          <p className="text-sm text-muted-foreground">
            Gestión ganadera personal
          </p>
        </header>
        <LoginForm next={sp.next} />
      </div>
    </main>
  );
}
