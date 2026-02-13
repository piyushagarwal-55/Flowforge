/**
 * MCP API Client
 * Functions for interacting with MCP backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID || 'user_default';

export interface GenerateMCPServerResponse {
  serverId: string;
  name: string;
  description: string;
  tools: Array<{
    toolId: string;
    name: string;
    description: string;
    inputSchema: any;
    outputSchema: any;
  }>;
  resources: any[];
  status: string;
  apiEndpoint: string;
  exampleCurl: string;
  exampleFetch: string;
  metadata: {
    generatedAt: string;
    prompt: string;
    correlationId: string;
  };
}

/**
 * Generate MCP server from prompt
 */
export async function generateMCPServer(prompt: string): Promise<GenerateMCPServerResponse> {
  const response = await fetch(`${API_URL}/ai/generate-mcp-server`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ownerId: OWNER_ID }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate MCP server: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * List all MCP servers
 */
export async function listMCPServers() {
  const response = await fetch(`${API_URL}/mcp/servers?ownerId=${OWNER_ID}`);

  if (!response.ok) {
    throw new Error(`Failed to list servers: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get MCP server details
 */
export async function getMCPServer(serverId: string) {
  const response = await fetch(`${API_URL}/mcp/servers/${serverId}?ownerId=${OWNER_ID}`);

  if (!response.ok) {
    throw new Error(`Failed to get server: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Start MCP runtime
 */
export async function startRuntime(serverId: string) {
  const response = await fetch(`${API_URL}/mcp/servers/${serverId}/runtime/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerId: OWNER_ID }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start runtime: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Stop MCP runtime
 */
export async function stopRuntime(serverId: string) {
  const response = await fetch(`${API_URL}/mcp/servers/${serverId}/runtime/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerId: OWNER_ID }),
  });

  if (!response.ok) {
    throw new Error(`Failed to stop runtime: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Invoke MCP tool
 */
export async function invokeTool(serverId: string, toolId: string, input: any, agentId?: string) {
  const response = await fetch(`${API_URL}/mcp/servers/${serverId}/invoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerId: OWNER_ID,
      agentId,
      toolId,
      input,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to invoke tool: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Create agent
 */
export async function createAgent(name: string, description: string, allowedTools: string[]) {
  const response = await fetch(`${API_URL}/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      description,
      allowedTools,
      ownerId: OWNER_ID,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create agent: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * List agents
 */
export async function listAgents() {
  const response = await fetch(`${API_URL}/agents?ownerId=${OWNER_ID}`);

  if (!response.ok) {
    throw new Error(`Failed to list agents: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Attach agent to server
 */
export async function attachAgentToServer(agentId: string, serverId: string) {
  const response = await fetch(`${API_URL}/agents/${agentId}/attach/${serverId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerId: OWNER_ID }),
  });

  if (!response.ok) {
    throw new Error(`Failed to attach agent: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Update agent permissions
 */
export async function updateAgentPermissions(agentId: string, allowedTools: string[]) {
  const response = await fetch(`${API_URL}/agents/${agentId}/permissions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerId: OWNER_ID,
      allowedTools,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update permissions: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get topology
 */
export async function getTopology() {
  const response = await fetch(`${API_URL}/mcp/topology?ownerId=${OWNER_ID}`);

  if (!response.ok) {
    throw new Error(`Failed to get topology: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get events
 */
export async function getEvents(params?: {
  limit?: number;
  type?: string;
  serverId?: string;
  agentId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.type) queryParams.append('type', params.type);
  if (params?.serverId) queryParams.append('serverId', params.serverId);
  if (params?.agentId) queryParams.append('agentId', params.agentId);

  const response = await fetch(`${API_URL}/mcp/events?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to get events: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Create and attach agent (convenience function)
 */
export async function createAndAttachAgent(serverId: string, tools: any[]) {
  // Create agent
  const agent = await createAgent(
    'Auto Agent',
    'Automatically created agent',
    tools.map((t) => t.toolId)
  );

  // Attach to server
  await attachAgentToServer(agent.agentId, serverId);

  return agent.agentId;
}

/**
 * Get tool schemas for dynamic form generation
 */
export async function getToolSchemas(serverId: string) {
  const response = await fetch(`${API_URL}/mcp/servers/${serverId}/tools?ownerId=${OWNER_ID}`);

  if (!response.ok) {
    throw new Error(`Failed to get tool schemas: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Run full agent chain (one-click execution)
 */
export async function runAgent(serverId: string, input: any, agentId?: string) {
  const response = await fetch(`${API_URL}/mcp/servers/${serverId}/run-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerId: OWNER_ID,
      agentId,
      input,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to run agent: ${response.statusText}`);
  }

  return await response.json();
}
