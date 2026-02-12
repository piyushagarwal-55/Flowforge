import { v4 as uuidv4 } from 'uuid';
import SessionModel, { ISession } from '../models/session.model';
import { logger } from '../utils/logger';

/**
 * Session Service
 * Manages user sessions using MongoDB (replaces Redis)
 */
class SessionService {
  private readonly DEFAULT_EXPIRATION_DAYS = 7;

  /**
   * Create a new session
   * @param userId - User ID
   * @param data - Optional session data
   * @returns Session ID
   */
  async create(userId: string, data: any = {}): Promise<string> {
    try {
      const sessionId = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.DEFAULT_EXPIRATION_DAYS);

      const session = new SessionModel({
        sessionId,
        userId,
        data,
        expiresAt,
      });

      await session.save();

      logger.info('Session created', { sessionId, userId });

      return sessionId;
    } catch (error) {
      logger.error('Failed to create session', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get session by ID
   * @param sessionId - Session ID
   * @returns Session or null if not found/expired
   */
  async get(sessionId: string): Promise<ISession | null> {
    try {
      const session = await SessionModel.findOne({ sessionId });

      if (!session) {
        logger.debug('Session not found', { sessionId });
        return null;
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        logger.debug('Session expired', { sessionId });
        await this.delete(sessionId);
        return null;
      }

      return session;
    } catch (error) {
      logger.error('Failed to get session', {
        sessionId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update session data
   * @param sessionId - Session ID
   * @param data - New session data
   */
  async update(sessionId: string, data: any): Promise<void> {
    try {
      const result = await SessionModel.updateOne(
        { sessionId },
        { $set: { data } }
      );

      if (result.matchedCount === 0) {
        throw new Error('Session not found');
      }

      logger.debug('Session updated', { sessionId });
    } catch (error) {
      logger.error('Failed to update session', {
        sessionId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Delete session
   * @param sessionId - Session ID
   */
  async delete(sessionId: string): Promise<void> {
    try {
      await SessionModel.deleteOne({ sessionId });
      logger.info('Session deleted', { sessionId });
    } catch (error) {
      logger.error('Failed to delete session', {
        sessionId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Cleanup expired sessions
   * @returns Number of sessions deleted
   */
  async cleanup(): Promise<number> {
    try {
      const result = await SessionModel.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      const deletedCount = result.deletedCount || 0;

      if (deletedCount > 0) {
        logger.info('Cleaned up expired sessions', { count: deletedCount });
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup sessions', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get all sessions for a user
   * @param userId - User ID
   * @returns Array of sessions
   */
  async getUserSessions(userId: string): Promise<ISession[]> {
    try {
      const sessions = await SessionModel.find({
        userId,
        expiresAt: { $gt: new Date() },
      });

      return sessions;
    } catch (error) {
      logger.error('Failed to get user sessions', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Delete all sessions for a user
   * @param userId - User ID
   * @returns Number of sessions deleted
   */
  async deleteUserSessions(userId: string): Promise<number> {
    try {
      const result = await SessionModel.deleteMany({ userId });
      const deletedCount = result.deletedCount || 0;

      logger.info('Deleted user sessions', { userId, count: deletedCount });

      return deletedCount;
    } catch (error) {
      logger.error('Failed to delete user sessions', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService();
export default sessionService;
