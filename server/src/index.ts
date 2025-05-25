import dotenv from "dotenv";
import app from "./app";
import prisma from "./lib/prisma";
import BackgroundService from "./services/background.service";

dotenv.config({ override: true });

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start background jobs for fetching commit counts
  BackgroundService.startBackgroundJobs();
});

const shutdown = async () => {
  console.log("Shutting down server...");

  await prisma.$disconnect();
  console.log("Database connections closed");

  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
