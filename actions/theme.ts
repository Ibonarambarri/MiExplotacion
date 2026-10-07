"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export type ThemeChoice = "system" | "light" | "dark";

/** Guarda la preferencia de tema en la cookie `theme` (1 año). */
export async function setThemeAction(theme: ThemeChoice): Promise<void> {
  const value: ThemeChoice =
    theme === "light" || theme === "dark" ? theme : "system";
  const store = await cookies();
  store.set("theme", value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
}
