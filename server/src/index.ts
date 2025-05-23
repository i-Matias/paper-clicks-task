import dotenv from "dotenv";
import app from "./app";
import { BackgroundService } from "./services/backgroundService";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Initialize background service
const backgroundService = new BackgroundService();

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start background service after server is running
  backgroundService.start();
});

// Handle graceful shutdown
const shutdown = () => {
  console.log("Shutting down server...");

  backgroundService.stop();

  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
};

// Listen for process termination signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
