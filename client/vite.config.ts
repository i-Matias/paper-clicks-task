import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    base: "/",
    server: {
      host: "0.0.0.0",
      port: 5173,
    },
    define: {
      // By default, Vite doesn't include shims for NodeJS/
      // necessary for segment analytics lib to work
      global: "globalThis",
      // "process.env": process.env,
    },
  };
});
