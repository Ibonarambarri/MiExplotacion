import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mi Explotación",
    template: "%s · Mi Explotación",
  },
  description: "Gestión ganadera personal — ovejas y conejas",
  manifest: "/manifest.webmanifest",
  applicationName: "Mi Explotación",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mi Explotación",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1210" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export type ThemePreference = "system" | "light" | "dark";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("theme")?.value;
  const theme: ThemePreference =
    raw === "light" || raw === "dark" ? raw : "system";

  return (
    <html
      lang="es"
      data-theme={theme === "system" ? undefined : theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground">
        {children}
        <ServiceWorkerRegister />
        <Toaster
          position="top-center"
          closeButton
          theme={theme}
          toastOptions={{
            duration: 3500,
            classNames: {
              toast:
                "!rounded-2xl !border-border !bg-popover !text-popover-foreground !shadow-lg",
            },
          }}
          offset={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
          mobileOffset={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
        />
      </body>
    </html>
  );
}
