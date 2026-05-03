"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  if (!password) {
    return { ok: false as const, error: "Introduce la contraseña." };
  }

  const ok = await login(password);
  if (!ok) {
    return { ok: false as const, error: "Contraseña incorrecta." };
  }

  redirect(next.startsWith("/") ? next : "/");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
