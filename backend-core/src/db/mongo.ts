// MongoDB connection utility for backend-core
// Migrated from backend/src/lib/mongo.ts - removed Motia dependencies

import mongoose from "mongoose";
import { logger } from "../utils/logger";

let isConnected = false;

export async function connectMongo(): Promise<void> {
  // Fast path - already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    logger.debug("MongoDB already connected");
    return;
  }

  try {
    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI;
      
      if (!mongoUri) {
        throw new Error("MONGODB_URI environment variable is not defined");
      }

      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
        minPoolSize: 2,
      });

      logger.info("MongoDB connection established");
    }

    // Ensure DB object exists
    if (!mongoose.connection.db) {
      throw new Error("MongoDB connection established but db not ready");
    }

    isConnected = true;
    logger.info("✅ MongoDB Connected");
  } catch (error) {
    logger.error("MongoDB connection failed", { error: (error as Error).message });
    throw error;
  }
}

export async function disconnectMongo(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info("MongoDB disconnected");
  }
}

// Handle connection events
mongoose.connection.on("error", (error) => {
  logger.error("MongoDB connection error", { error: error.message });
  isConnected = false;
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
  isConnected = false;
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected");
  isConnected = true;
});

export default { connectMongo, disconnectMongo };
