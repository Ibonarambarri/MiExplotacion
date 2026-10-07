import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (modo demo sin servidor) carga su WASM desde node_modules.
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    // Integra <ViewTransition> de React con las navegaciones del App Router
    // (fundido suave entre pantallas). Ver components/nav/route-transition.tsx.
    viewTransition: true,
  },
};

export default nextConfig;
