/**
 * Event Ring Buffer
 * In-memory circular buffer for recent MCP events
 */

export interface MCPEvent {
  id: string;
  type: string;
  serverId: string;
  agentId?: string;
  toolId?: string;
  duration?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

class EventRingBuffer {
  private buffer: MCPEvent[] = [];
  private maxSize: number;
  private index: number = 0;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * Add event to buffer
   */
  add(event: MCPEvent): void {
    if (this.buffer.length < this.maxSize) {
      this.buffer.push(event);
    } else {
      this.buffer[this.index] = event;
      this.index = (this.index + 1) % this.maxSize;
    }
  }

  /**
   * Get recent events
   */
  getRecent(limit: number = 100): MCPEvent[] {
    const events = [...this.buffer];
    
    // Sort by timestamp descending (most recent first)
    events.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return events.slice(0, limit);
  }

  /**
   * Get events by type
   */
  getByType(type: string, limit: number = 100): MCPEvent[] {
    return this.getRecent(this.maxSize)
      .filter((e) => e.type === type)
      .slice(0, limit);
  }

  /**
   * Get events by server
   */
  getByServer(serverId: string, limit: number = 100): MCPEvent[] {
    return this.getRecent(this.maxSize)
      .filter((e) => e.serverId === serverId)
      .slice(0, limit);
  }

  /**
   * Get events by agent
   */
  getByAgent(agentId: string, limit: number = 100): MCPEvent[] {
    return this.getRecent(this.maxSize)
      .filter((e) => e.agentId === agentId)
      .slice(0, limit);
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.buffer = [];
    this.index = 0;
  }

  /**
   * Get buffer size
   */
  size(): number {
    return this.buffer.length;
  }
}

// Singleton instance
export const eventRingBuffer = new EventRingBuffer(1000);
