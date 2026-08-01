import { defineConfig } from "vite";

export default defineConfig({
  base: "/tactics/",
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
  },
});
