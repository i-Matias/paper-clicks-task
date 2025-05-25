import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    base: "/",
    // server: {
    //   proxy: {
    //     // Proxy all /api requests to the backend server
    //     "/api": {
    //       target: "http://localhost:5001",
    //       changeOrigin: true,
    //       secure: false,
    //     },
    //   },
    // },
    define: {
      // By default, Vite doesn't include shims for NodeJS/
      // necessary for segment analytics lib to work
      global: "globalThis",
      // "process.env": process.env,
    },
  };
});
