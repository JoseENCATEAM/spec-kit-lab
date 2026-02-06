import dotenv from "dotenv";
import { createApp } from "./app";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`🎲 Dice Rolling API server listening on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Roll endpoint: http://localhost:${PORT}/api/dice/roll`);
});
