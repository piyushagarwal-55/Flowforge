# Frontend Migration to MCP Platform - Complete Specification

## Context

We have completed a new MCP (Model Context Protocol) backend platform with:
- ✅ Agent orchestration
- ✅ Runtime management
- ✅ Permission enforcement
- ✅ Observability and telemetry
- ✅ Topology visualization

**Your task**: Update the frontend to fully integrate with this new MCP platform.

---

## Backend API Reference (Source of Truth)

### MCP Server Generation
```http
POST /ai/generate-mcp-server
Content-Type: application/json

{
  "prompt": "Create a user registration API",
  "ownerId": "user_123"
}

Response:
{
  "serverId": "mcp_1234567890_abc123",
  "name": "User Registration API",
  "description": "...",
  "tools": [
    {
      "toolId": "input",
      "name": "Input",
      "description": "input operation",
      "inputSchema": { ... },
      "outputSchema": { ... }
    }
  ],
  "resources": [ ... ],
  "status": "created"
}
```

### MCP Server Management
```http
GET /mcp/servers?ownerId=user_123
Response: { servers: [...] }

GET /mcp/servers/:serverId?ownerId=user_123
Response: { serverId, name, tools, agents, status, runtimeStatus, ... }
```

### Runtime Control
```http
POST /mcp/servers/:serverId/runtime/start
Body: { "ownerId": "user_123" }
Response: { serverId, status: "running", message: "..." }

POST /mcp/servers/:serverId/runtime/stop
Body: { "ownerId": "user_123" }
Response: { serverId, status: "stopped", message: "..." }
```

### Tool Invocation
```http
POST /mcp/servers/:serverId/invoke
Body: {
  "ownerId": "user_123",
  "agentId": "agent_xyz",
  "toolId": "input",
  "input": { "variables": [...] }
}
Response: { serverId, toolId, agentId, result: {...}, invokedAt: "..." }
```

### Agent Management
```http
POST /agents
Body: {
  "name": "Registration Agent",
  "description": "...",
  "allowedTools": ["input", "dbInsert"],
  "ownerId": "user_123"
}
Response: { agentId, name, allowedTools, ... }

GET /agents?ownerId=user_123
Response: { agents: [...] }

POST /agents/:agentId/attach/:serverId
Body: { "ownerId": "user_123" }
Response: { success: true }

PUT /agents/:agentId/permissions
Body: {
  "ownerId": "user_123",
  "allowedTools": ["input", "dbInsert", "response"]
}
Response: { agentId, allowedTools, ... }
```

### Topology
```http
GET /mcp/topology?ownerId=user_123
Response: {
  "nodes": [
    { "id": "mcp_123", "type": "server", "name": "...", "status": "running" },
    { "id": "agent_456", "type": "agent", "name": "..." },
    { "id": "mcp_123:input", "type": "tool", "name": "Input" }
  ],
  "edges": [
    { "id": "...", "source": "agent_456", "target": "mcp_123", "type": "agent_to_server" },
    { "id": "...", "source": "mcp_123", "target": "mcp_123:input", "type": "server_to_tool" }
  ],
  "stats": { "serverCount": 1, "agentCount": 1, "toolCount": 5, "edgeCount": 6 }
}
```

### Observability
```http
GET /mcp/events?limit=100
GET /mcp/events?type=tool_invoked
GET /mcp/events?serverId=mcp_123
GET /mcp/events?agentId=agent_456

Response: {
  "events": [
    {
      "id": "uuid",
      "type": "runtime_started",
      "serverId": "mcp_123",
      "timestamp": "2026-02-12T05:00:00.000Z",
      "metadata": { ... }
    }
  ],
  "count": 10,
  "bufferSize": 1000
}
```

---

## Required Frontend Refactors

### 1. Replace Workflow Generation with MCP Server Generation

**Current Code (REMOVE)**:
```typescript
// OLD - Remove this
const response = await fetch(`${API_URL}/ai/generate-workflow`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, workflowId, ownerId })
});
const { nodes, edges } = await response.json();
```

**New Code (ADD)**:
```typescript
// NEW - Use this instead
const response = await fetch(`${API_URL}/ai/generate-mcp-server`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, ownerId })
});
const { serverId, name, tools, resources, status } = await response.json();

// Store serverId in state
setCurrentServerId(serverId);
```

**Files to Update**:
- `frontend/components/ChatShell.tsx` - Replace workflow generation call
- Any other files calling `/ai/generate-workflow`

---

### 2. Update Frontend State Model

**Create New State Structure**:
```typescript
// frontend/lib/mcpStore.ts or similar
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
}

interface MCPServer {
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

interface MCPAgent {
  agentId: string;
  name: string;
  description: string;
  allowedTools: string[];
  attachedServerCount: number;
  createdAt: string;
}

interface Topology {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  stats: {
    serverCount: number;
    agentCount: number;
    toolCount: number;
    edgeCount: number;
  };
}

interface MCPEvent {
  id: string;
  type: string;
  serverId: string;
  agentId?: string;
  toolId?: string;
  duration?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}
```

**Implementation Options**:
- Use React Context + useState
- Use Zustand store
- Use Redux (if already in project)

---

### 3. Create MCP Dashboard Page

**File**: `frontend/app/mcp/page.tsx` (NEW)

```typescript
'use client';

import { useState, useEffect } from 'react';
import MCPServerList from '@/components/mcp/MCPServerList';
import AgentList from '@/components/mcp/AgentList';
import TopologyGraph from '@/components/mcp/TopologyGraph';
import ActivityFeed from '@/components/mcp/ActivityFeed';
import RuntimeControls from '@/components/mcp/RuntimeControls';

export default function MCPDashboard() {
  const [currentServerId, setCurrentServerId] = useState<string | null>(null);
  const [servers, setServers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [topology, setTopology] = useState(null);
  const [events, setEvents] = useState([]);

  // Fetch servers on mount
  useEffect(() => {
    fetchServers();
    fetchAgents();
  }, []);

  // Fetch topology when server selected
  useEffect(() => {
    if (currentServerId) {
      fetchTopology();
    }
  }, [currentServerId]);

  // Poll events every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents();
    }, 2000);
    return () => clearInterval(interval);
  }, [currentServerId]);

  const fetchServers = async () => {
    const response = await fetch(`${API_URL}/mcp/servers?ownerId=user_default`);
    const data = await response.json();
    setServers(data.servers);
  };

  const fetchAgents = async () => {
    const response = await fetch(`${API_URL}/agents?ownerId=user_default`);
    const data = await response.json();
    setAgents(data.agents);
  };

  const fetchTopology = async () => {
    const response = await fetch(`${API_URL}/mcp/topology?ownerId=user_default`);
    const data = await response.json();
    setTopology(data);
  };

  const fetchEvents = async () => {
    const params = currentServerId ? `?serverId=${currentServerId}&limit=50` : '?limit=50';
    const response = await fetch(`${API_URL}/mcp/events${params}`);
    const data = await response.json();
    setEvents(data.events);
  };

  return (
    <div className="mcp-dashboard">
      <div className="grid grid-cols-12 gap-4">
        {/* Left Panel - Servers & Agents */}
        <div className="col-span-3">
          <MCPServerList 
            servers={servers} 
            selectedServerId={currentServerId}
            onSelectServer={setCurrentServerId}
          />
          <AgentList agents={agents} />
        </div>

        {/* Center Panel - Topology */}
        <div className="col-span-6">
          {currentServerId && (
            <>
              <RuntimeControls 
                serverId={currentServerId}
                onRuntimeChange={fetchServers}
              />
              <TopologyGraph topology={topology} />
            </>
          )}
        </div>

        {/* Right Panel - Activity Feed */}
        <div className="col-span-3">
          <ActivityFeed events={events} />
        </div>
      </div>
    </div>
  );
}
```

---

### 4. Create MCP Components

#### Component 1: MCPServerList
**File**: `frontend/components/mcp/MCPServerList.tsx` (NEW)

```typescript
'use client';

interface MCPServerListProps {
  servers: any[];
  selectedServerId: string | null;
  onSelectServer: (serverId: string) => void;
}

export default function MCPServerList({ servers, selectedServerId, onSelectServer }: MCPServerListProps) {
  return (
    <div className="mcp-server-list">
      <h3 className="text-lg font-semibold mb-4">MCP Servers</h3>
      <div className="space-y-2">
        {servers.map((server) => (
          <div
            key={server.serverId}
            className={`p-3 border rounded cursor-pointer ${
              selectedServerId === server.serverId ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onClick={() => onSelectServer(server.serverId)}
          >
            <div className="font-medium">{server.name}</div>
            <div className="text-sm text-gray-600">
              {server.toolCount} tools • {server.agentCount} agents
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 text-xs rounded ${
                server.runtimeStatus === 'running' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {server.runtimeStatus}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Component 2: RuntimeControls
**File**: `frontend/components/mcp/RuntimeControls.tsx` (NEW)

```typescript
'use client';

import { useState } from 'react';

interface RuntimeControlsProps {
  serverId: string;
  onRuntimeChange: () => void;
}

export default function RuntimeControls({ serverId, onRuntimeChange }: RuntimeControlsProps) {
  const [loading, setLoading] = useState(false);

  const startRuntime = async () => {
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcp/servers/${serverId}/runtime/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: 'user_default' })
      });
      onRuntimeChange();
    } catch (error) {
      console.error('Failed to start runtime:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopRuntime = async () => {
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcp/servers/${serverId}/runtime/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: 'user_default' })
      });
      onRuntimeChange();
    } catch (error) {
      console.error('Failed to stop runtime:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="runtime-controls mb-4">
      <div className="flex gap-2">
        <button
          onClick={startRuntime}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Start Runtime
        </button>
        <button
          onClick={stopRuntime}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Stop Runtime
        </button>
      </div>
    </div>
  );
}
```

#### Component 3: ActivityFeed
**File**: `frontend/components/mcp/ActivityFeed.tsx` (NEW)

```typescript
'use client';

interface ActivityFeedProps {
  events: any[];
}

export default function ActivityFeed({ events }: ActivityFeedProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'runtime_started': return '▶️';
      case 'runtime_stopped': return '⏹️';
      case 'tool_invoked': return '🔧';
      case 'tool_completed': return '✅';
      case 'permission_denied': return '🚫';
      default: return '📝';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="activity-feed">
      <h3 className="text-lg font-semibold mb-4">Activity Feed</h3>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {events.map((event) => (
          <div key={event.id} className="p-3 border border-gray-200 rounded">
            <div className="flex items-start gap-2">
              <span className="text-xl">{getEventIcon(event.type)}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{event.type.replace(/_/g, ' ')}</div>
                {event.toolId && (
                  <div className="text-xs text-gray-600">Tool: {event.toolId}</div>
                )}
                {event.duration && (
                  <div className="text-xs text-gray-600">Duration: {event.duration}ms</div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {formatTimestamp(event.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Component 4: TopologyGraph
**File**: `frontend/components/mcp/TopologyGraph.tsx` (NEW)

```typescript
'use client';

interface TopologyGraphProps {
  topology: any;
}

export default function TopologyGraph({ topology }: TopologyGraphProps) {
  if (!topology) {
    return <div>No topology data</div>;
  }

  // Simple visualization - can be enhanced with React Flow or similar
  const servers = topology.nodes.filter((n: any) => n.type === 'server');
  const agents = topology.nodes.filter((n: any) => n.type === 'agent');
  const tools = topology.nodes.filter((n: any) => n.type === 'tool');

  return (
    <div className="topology-graph border border-gray-300 rounded p-4">
      <h3 className="text-lg font-semibold mb-4">Topology</h3>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Agents */}
        <div>
          <h4 className="font-medium mb-2">Agents ({agents.length})</h4>
          {agents.map((agent: any) => (
            <div key={agent.id} className="p-2 bg-blue-100 rounded mb-2">
              {agent.name}
            </div>
          ))}
        </div>

        {/* Servers */}
        <div>
          <h4 className="font-medium mb-2">Servers ({servers.length})</h4>
          {servers.map((server: any) => (
            <div key={server.id} className="p-2 bg-green-100 rounded mb-2">
              {server.name}
            </div>
          ))}
        </div>

        {/* Tools */}
        <div>
          <h4 className="font-medium mb-2">Tools ({tools.length})</h4>
          {tools.map((tool: any) => (
            <div key={tool.id} className="p-2 bg-purple-100 rounded mb-2 text-sm">
              {tool.name}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        {topology.stats.edgeCount} connections
      </div>
    </div>
  );
}
```

#### Component 5: AgentList
**File**: `frontend/components/mcp/AgentList.tsx` (NEW)

```typescript
'use client';

interface AgentListProps {
  agents: any[];
}

export default function AgentList({ agents }: AgentListProps) {
  return (
    <div className="agent-list mt-6">
      <h3 className="text-lg font-semibold mb-4">Agents</h3>
      <div className="space-y-2">
        {agents.map((agent) => (
          <div key={agent.agentId} className="p-3 border border-gray-300 rounded">
            <div className="font-medium">{agent.name}</div>
            <div className="text-sm text-gray-600">
              {agent.allowedTools.length} tools allowed
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 5. Update Chat Flow to Use MCP

**File**: `frontend/components/ChatShell.tsx` (UPDATE)

**Find and Replace**:
```typescript
// OLD - Remove
const generateWorkflow = async (prompt: string) => {
  const response = await fetch(`${API_URL}/ai/generate-workflow`, {
    method: 'POST',
    body: JSON.stringify({ prompt, workflowId, ownerId })
  });
  const { nodes, edges } = await response.json();
  // ... handle workflow
};

// NEW - Add
const generateMCPServer = async (prompt: string) => {
  const response = await fetch(`${API_URL}/ai/generate-mcp-server`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ownerId: 'user_default' })
  });
  const { serverId, name, tools, resources } = await response.json();
  
  // Store in state
  setCurrentServerId(serverId);
  
  // Auto-create agent
  await createAndAttachAgent(serverId, tools);
  
  // Navigate to MCP dashboard
  router.push(`/mcp?serverId=${serverId}`);
};

const createAndAttachAgent = async (serverId: string, tools: any[]) => {
  // Create agent
  const agentResponse = await fetch(`${API_URL}/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Auto Agent',
      description: 'Automatically created agent',
      allowedTools: tools.map(t => t.toolId),
      ownerId: 'user_default'
    })
  });
  const { agentId } = await agentResponse.json();
  
  // Attach to server
  await fetch(`${API_URL}/agents/${agentId}/attach/${serverId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerId: 'user_default' })
  });
  
  return agentId;
};
```

---

### 6. Update Navigation

**File**: `frontend/components/Navigation.tsx` or similar (UPDATE)

Add MCP Dashboard link:
```typescript
<nav>
  <Link href="/">Home</Link>
  <Link href="/builder">Builder</Link>
  <Link href="/mcp">MCP Dashboard</Link> {/* NEW */}
</nav>
```

---

### 7. Remove Legacy Workflow Components

**Files to Delete or Deprecate**:
- Old workflow graph components (if not needed)
- Workflow state management (if replaced by MCP state)
- Old orchestration logic

**Keep**:
- Execution logs (can be adapted for MCP tool invocations)
- Chat interface (updated to use MCP)
- Landing page

---

## UX Flow (Complete User Journey)

1. **User enters prompt** in chat
   - "Create a user registration API"

2. **MCP server generated**
   - Backend creates MCP server with tools
   - Frontend receives `serverId`

3. **Agent auto-created and attached**
   - Frontend creates agent with all tools
   - Attaches agent to server

4. **Navigate to MCP Dashboard**
   - Show server in list
   - Display tools
   - Show runtime status

5. **User starts runtime**
   - Click "Start Runtime" button
   - Runtime status changes to "running"

6. **Tools available for invocation**
   - Display tool list
   - Show input forms
   - Allow tool execution

7. **Events stream live**
   - Activity feed updates every 2 seconds
   - Shows runtime events, tool invocations

8. **Topology visible**
   - Graph shows Agent → Server → Tools
   - Visual representation of orchestration

---

## Environment Variables

**File**: `frontend/.env.local` (UPDATE)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_OWNER_ID=user_default
```

---

## Testing Checklist

After implementation, verify:

- [ ] Chat generates MCP server (not workflow)
- [ ] MCP Dashboard page loads
- [ ] Server list displays correctly
- [ ] Runtime can be started/stopped
- [ ] Activity feed updates automatically
- [ ] Topology displays nodes and edges
- [ ] Agent list shows agents
- [ ] Navigation includes MCP Dashboard link
- [ ] No console errors
- [ ] API calls use correct endpoints

---

## Implementation Priority

### Phase 1 (Critical)
1. Update chat to call `/ai/generate-mcp-server`
2. Create MCP state management
3. Create MCP Dashboard page
4. Create MCPServerList component
5. Create RuntimeControls component

### Phase 2 (Important)
6. Create ActivityFeed component
7. Create TopologyGraph component
8. Create AgentList component
9. Update navigation
10. Auto-create and attach agent

### Phase 3 (Enhancement)
11. Tool invocation UI
12. Permission editor
13. Enhanced topology visualization (React Flow)
14. Real-time WebSocket events (instead of polling)

---

## Success Criteria

Frontend migration is complete when:
- ✅ No references to `/ai/generate-workflow`
- ✅ MCP Dashboard fully functional
- ✅ Runtime control working
- ✅ Activity feed displaying events
- ✅ Topology visualization working
- ✅ Agent management integrated
- ✅ All tests passing
- ✅ No console errors

---

## Support Resources

- **Backend API Docs**: `MCP-PLATFORM-INTEGRATION.md`
- **Backend Summary**: `MCP-INTEGRATION-SUMMARY.md`
- **Test Examples**: `backend-core/src/mcp/tests/platform.integration.test.ts`

---

## Quick Start Commands

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (should already be running)
cd backend-core
npm run dev

# Test backend
npm run test:platform
```

---

**Status**: Ready for implementation
**Estimated Time**: 4-6 hours for Phase 1-2
**Complexity**: Medium (mostly UI work, APIs are ready)
