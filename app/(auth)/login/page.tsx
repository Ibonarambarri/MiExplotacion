import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Acceso",
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
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background px-6 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      {/* Fondo: campo verde que se funde con el crema */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60dvh] bg-[radial-gradient(120%_80%_at_50%_0%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[35dvh] bg-[radial-gradient(90%_70%_at_50%_100%,color-mix(in_oklab,var(--harvest)_14%,transparent),transparent_70%)]"
      />

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-10">
        <header className="flex flex-col items-center text-center">
          <Image
            src="/icons/icon.svg"
            alt=""
            width={88}
            height={88}
            priority
            className="h-[88px] w-[88px] drop-shadow-xl"
          />
          <h1 className="mt-6 text-[34px] font-bold leading-none tracking-tight">
            Mi Explotación
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Tu explotación, siempre al día
          </p>
        </header>

        <LoginForm next={sp.next} />
      </div>

      <p className="relative mt-8 text-center text-xs text-muted-foreground">
        Ovejas · Conejas · Finanzas
      </p>
    </main>
  );
}
