import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envDir = fileURLToPath(new URL("../..", import.meta.url));
  const env = loadEnv(mode, envDir, "");

  return {
    envDir,
    define: {
      "import.meta.env.VITE_SERVER_URL": JSON.stringify(env.VITE_SERVER_URL),
    },
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "./src/pages",
        routeToken: "_layout",
      }),
      viteReact(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
      dedupe: ["react", "react-dom"],
    },
    server: {
      // Allow HTTPS tunnel hosts such as ngrok during local OAuth/MCP testing.
      allowedHosts: true,
      port: 3001,
      proxy: {
        // Keep browser requests same-origin during local MCP/OAuth testing.
        // The frontend ngrok host serves /api and forwards it to the local backend.
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
