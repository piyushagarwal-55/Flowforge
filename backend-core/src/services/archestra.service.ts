/**
 * Archestra Telemetry Service
 * Sends MCP runtime telemetry to Archestra observability platform
 */

import axios from 'axios';
import { logger } from '../utils/logger';

export interface ArchestraTelemetryEvent {
  event: string;
  serverId: string;
  agentId?: string;
  toolId?: string;
  duration?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

class ArchestraService {
  private endpoint: string;
  private apiKey: string;
  private enabled: boolean;

  constructor() {
    this.endpoint = process.env.ARCHESTRA_ENDPOINT || '';
    this.apiKey = process.env.ARCHESTRA_API_KEY || '';
    this.enabled = !!this.endpoint && !!this.apiKey;

    if (this.enabled) {
      logger.info('[archestra] Telemetry enabled', {
        endpoint: this.endpoint,
      });
    } else {
      logger.info('[archestra] Telemetry disabled (no endpoint configured)');
    }
  }

  /**
   * Send telemetry event to Archestra
   * Fire-and-forget - does not block runtime
   */
  async sendEvent(event: ArchestraTelemetryEvent): Promise<void> {
    if (!this.enabled) {
      return;
    }

    // Fire-and-forget - don't await
    this.sendEventAsync(event).catch((error) => {
      logger.warn('[archestra] Failed to send telemetry', {
        event: event.event,
        error: error.message,
      });
    });
  }

  private async sendEventAsync(event: ArchestraTelemetryEvent): Promise<void> {
    try {
      await axios.post(
        this.endpoint,
        {
          ...event,
          source: 'flowforge-mcp',
          environment: process.env.NODE_ENV || 'development',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 5000, // 5 second timeout
        }
      );

      logger.debug('[archestra] Telemetry sent', {
        event: event.event,
        serverId: event.serverId,
      });
    } catch (error: any) {
      // Log but don't throw - telemetry failures should not break runtime
      logger.warn('[archestra] Telemetry send failed', {
        event: event.event,
        error: error.message,
      });
    }
  }

  /**
   * Send runtime started event
   */
  async runtimeStarted(serverId: string, metadata?: Record<string, any>): Promise<void> {
    await this.sendEvent({
      event: 'runtime_started',
      serverId,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  /**
   * Send runtime stopped event
   */
  async runtimeStopped(serverId: string, metadata?: Record<string, any>): Promise<void> {
    await this.sendEvent({
      event: 'runtime_stopped',
      serverId,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  /**
   * Send tool invoked event
   */
  async toolInvoked(
    serverId: string,
    toolId: string,
    agentId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.sendEvent({
      event: 'tool_invoked',
      serverId,
      toolId,
      agentId,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  /**
   * Send tool completed event
   */
  async toolCompleted(
    serverId: string,
    toolId: string,
    duration: number,
    agentId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.sendEvent({
      event: 'tool_completed',
      serverId,
      toolId,
      agentId,
      duration,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  /**
   * Send permission denied event
   */
  async permissionDenied(
    serverId: string,
    toolId: string,
    agentId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.sendEvent({
      event: 'permission_denied',
      serverId,
      toolId,
      agentId,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  /**
   * Send agent attached event
   */
  async agentAttached(
    serverId: string,
    agentId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.sendEvent({
      event: 'agent_attached',
      serverId,
      agentId,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  /**
   * Send agent detached event
   */
  async agentDetached(
    serverId: string,
    agentId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.sendEvent({
      event: 'agent_detached',
      serverId,
      agentId,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }
}

// Singleton instance
export const archestraService = new ArchestraService();
