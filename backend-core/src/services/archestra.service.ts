/**
 * Archestra Service
 * - Sends MCP runtime telemetry to Archestra observability platform
 * - Deploys MCP servers as Archestra agents
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

export interface ArchestraDeploymentRequest {
  name: string;
  description: string;
  tools: any[];
  executionOrder: string[];
  inputSchema?: any;
  metadata?: {
    createdBy: string;
    serverId: string;
    createdAt: Date;
    [key: string]: any;
  };
}

export interface ArchestraDeploymentResponse {
  agentId: string;
  publicEndpoint: string;
  dashboardUrl: string;
}

class ArchestraService {
  private endpoint: string;
  private apiKey: string;
  private enabled: boolean;
  private deploymentEndpoint: string;

  constructor() {
    this.endpoint = process.env.ARCHESTRA_ENDPOINT || '';
    this.apiKey = process.env.ARCHESTRA_API_KEY || '';
    this.enabled = !!this.endpoint && !!this.apiKey;
    this.deploymentEndpoint = process.env.ARCHESTRA_DEPLOYMENT_ENDPOINT || 'https://api.archestra.ai/mcp/agents';

    if (this.enabled) {
      logger.info('[archestra] Service enabled', {
        endpoint: this.endpoint,
        deploymentEndpoint: this.deploymentEndpoint,
      });
    } else {
      logger.info('[archestra] Service disabled (no endpoint configured)');
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

  /**
   * Deploy MCP server to Archestra as an agent
   * Transforms local MCP server into production-hosted Archestra agent
   */
  async deployToArchestra(mcpServer: any): Promise<ArchestraDeploymentResponse> {
    if (!this.enabled) {
      throw new Error('Archestra deployment is not configured. Please set ARCHESTRA_API_KEY and ARCHESTRA_ENDPOINT in environment variables.');
    }

    try {
      logger.info('[archestra] Deploying MCP server to Archestra', {
        serverId: mcpServer.serverId,
        name: mcpServer.name,
        toolCount: mcpServer.tools?.length || 0,
      });

      // Step 1: Fetch default team ID to make agent visible in UI
      let teamId: string | null = null;
      try {
        const teamsResponse = await axios.get<any[]>(
          `${this.deploymentEndpoint.replace('/api/agents', '/api/teams')}`,
          {
            headers: {
              'Authorization': this.apiKey,
            },
            timeout: 5000,
          }
        );

        // Find "Default Team" or use first team
        const defaultTeam = teamsResponse.data.find((team: any) => 
          team.name === 'Default Team' || team.name.toLowerCase().includes('default')
        );
        teamId = defaultTeam?.id || teamsResponse.data[0]?.id;

        logger.info('[archestra] Found team for agent', {
          teamId,
          teamName: defaultTeam?.name || teamsResponse.data[0]?.name,
        });
      } catch (error) {
        logger.warn('[archestra] Could not fetch teams, agent may not be visible in UI', {
          error: (error as Error).message,
        });
      }

      // Step 2: Transform MCP server into Archestra agent format
      const deploymentRequest = {
        name: mcpServer.name,
        description: mcpServer.description || 'Deployed from Orchestrix',
        teams: teamId ? [teamId] : ['0547b7a5-9405-46dd-8f47-ea9b9357a6d1'], // Fallback to known Default Team ID
        // MCP server definition
        mcpServers: [
          {
            url: 'stdio', // Embedded MCP server
            name: mcpServer.name,
            description: mcpServer.description || '',
            tools: mcpServer.tools || [],
            resources: mcpServer.resources || [],
            prompts: mcpServer.prompts || [],
          }
        ],
        // Agent configuration
        config: {
          executionOrder: mcpServer.executionOrder || [],
          metadata: {
            source: 'orchestrix',
            orchestrixServerId: mcpServer.serverId,
            createdAt: mcpServer.createdAt || new Date().toISOString(),
            ownerId: mcpServer.ownerId,
          },
        },
      };

      logger.info('[archestra] Deployment request', {
        serverId: mcpServer.serverId,
        teamId,
        request: JSON.stringify(deploymentRequest).slice(0, 500),
      });

      // Step 3: POST to Archestra agent creation endpoint
      const response = await axios.post<any>(
        `${this.deploymentEndpoint}`,
        deploymentRequest,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.apiKey, // Raw API key, no "Bearer" prefix
          },
          timeout: 30000, // 30 second timeout for deployment
        }
      );

      // Extract agent info from Archestra response
      const agentData = response.data;
      const agentId = agentData.id || agentData.agentId;
      
      // Construct public endpoint based on Archestra's structure
      const baseUrl = this.deploymentEndpoint.replace('/api/agents', '');
      const publicEndpoint = `${baseUrl}/api/agents/${agentId}/invoke`;
      
      // Dashboard URL for monitoring
      const dashboardUrl = `${baseUrl}/agents/${agentId}`;

      logger.info('[archestra] Deployment successful', {
        serverId: mcpServer.serverId,
        agentId: agentId,
        publicEndpoint: publicEndpoint,
        teamId,
      });

      return {
        agentId: agentId,
        publicEndpoint: publicEndpoint,
        dashboardUrl: dashboardUrl,
      };
    } catch (error: any) {
      logger.error('[archestra] Deployment failed', {
        serverId: mcpServer.serverId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Provide more helpful error message
      let errorMessage = error.message;
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      throw new Error(
        `Failed to deploy to Archestra: ${errorMessage}`
      );
    }
  }
}

// Singleton instance
export const archestraService = new ArchestraService();
