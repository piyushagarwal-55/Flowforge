/**
 * MCP State Management
 * Zustand store for MCP platform state
 */

import { create } from 'zustand';

export interface MCPServer {
  serverId: string;
  name: string;
  description: string;
  toolCount: number;
  resourceCount: number;
  agentCount: number;
  status: string;
  runtimeStatus: string;
  createdAt: string;
}

export interface MCPAgent {
  agentId: string;
  name: string;
  description: string;
  allowedTools: string[];
  attachedServerCount: number;
  createdAt: string;
}

export interface TopologyNode {
  id: string;
  type: 'server' | 'agent' | 'tool';
  name: string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  type: 'agent_to_server' | 'server_to_tool';
  metadata?: Record<string, any>;
}

export interface Topology {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  stats: {
    serverCount: number;
    agentCount: number;
    toolCount: number;
    edgeCount: number;
  };
}

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

interface MCPState {
  // Current session
  currentServerId: string | null;
  currentAgentId: string | null;
  
  // Data
  servers: MCPServer[];
  agents: MCPAgent[];
  topology: Topology | null;
  events: MCPEvent[];
  
  // UI state
  runtimeStatus: 'running' | 'stopped' | 'not_loaded';
  selectedTool: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setCurrentServerId: (serverId: string | null) => void;
  setCurrentAgentId: (agentId: string | null) => void;
  setServers: (servers: MCPServer[]) => void;
  setAgents: (agents: MCPAgent[]) => void;
  setTopology: (topology: Topology | null) => void;
  setEvents: (events: MCPEvent[]) => void;
  setRuntimeStatus: (status: 'running' | 'stopped' | 'not_loaded') => void;
  setSelectedTool: (toolId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  currentServerId: null,
  currentAgentId: null,
  servers: [],
  agents: [],
  topology: null,
  events: [],
  runtimeStatus: 'not_loaded' as const,
  selectedTool: null,
  loading: false,
  error: null,
};

export const useMCPStore = create<MCPState>((set) => ({
  ...initialState,
  
  setCurrentServerId: (serverId) => set({ currentServerId: serverId }),
  setCurrentAgentId: (agentId) => set({ currentAgentId: agentId }),
  setServers: (servers) => set({ servers }),
  setAgents: (agents) => set({ agents }),
  setTopology: (topology) => set({ topology }),
  setEvents: (events) => set({ events }),
  setRuntimeStatus: (runtimeStatus) => set({ runtimeStatus }),
  setSelectedTool: (selectedTool) => set({ selectedTool }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
