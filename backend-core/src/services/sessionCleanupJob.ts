import { sessionService } from './sessionService';
import { logger } from '../utils/logger';

/**
 * Session Cleanup Job
 * Runs periodically to remove expired sessions from MongoDB
 */
class SessionCleanupJob {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Start the cleanup job
   */
  start(): void {
    if (this.intervalId) {
      logger.warn('Session cleanup job already running');
      return;
    }

    logger.info('Starting session cleanup job', {
      intervalMinutes: this.CLEANUP_INTERVAL_MS / 60000,
    });

    // Run cleanup immediately on start
    this.runCleanup();

    // Schedule periodic cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Stop the cleanup job
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Session cleanup job stopped');
    }
  }

  /**
   * Run cleanup once
   */
  private async runCleanup(): Promise<void> {
    try {
      logger.debug('Running session cleanup');
      const deletedCount = await sessionService.cleanup();

      if (deletedCount > 0) {
        logger.info('Session cleanup completed', { deletedCount });
      } else {
        logger.debug('Session cleanup completed - no expired sessions');
      }
    } catch (error) {
      logger.error('Session cleanup failed', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get cleanup interval in milliseconds
   */
  getInterval(): number {
    return this.CLEANUP_INTERVAL_MS;
  }

  /**
   * Check if cleanup job is running
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

// Export singleton instance
export const sessionCleanupJob = new SessionCleanupJob();
export default sessionCleanupJob;
