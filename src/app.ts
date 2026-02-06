import express, { Application } from "express";
import { rollDice, healthCheck } from "./controllers/dice.controller";
import { errorHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(requestLogger);

  // Routes
  app.get("/api/health", healthCheck);
  app.post("/api/dice/roll", rollDice);

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
};
