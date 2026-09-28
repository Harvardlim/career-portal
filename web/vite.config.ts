import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Dev counterpart of the /api rewrite in vercel.json: with VITE_SUPABASE_URL=/api,
  // forward /api/* to the real Supabase project. (The proxy target is only
  // needed then, so a full-URL setup is left alone.)
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.SUPABASE_PROXY_TARGET;
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: proxyTarget
      ? {
          proxy: {
            "/api": {
              target: proxyTarget,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ""),
            },
          },
        }
      : undefined,
  };
});
