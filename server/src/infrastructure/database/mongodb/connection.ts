import mongoose from 'mongoose';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

export const connectMongoDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(env.MONGO_URI!, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    throw err;
  }
};
