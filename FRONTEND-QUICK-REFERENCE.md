# Frontend MCP Migration - Quick Reference

## 🎯 Core Changes

### 1. API Endpoint Changes
```typescript
// ❌ OLD - Remove
POST /ai/generate-workflow

// ✅ NEW - Use
POST /ai/generate-mcp-server
GET /mcp/servers
GET /mcp/servers/:serverId
POST /mcp/servers/:serverId/runtime/start
POST /mcp/servers/:serverId/runtime/stop
POST /mcp/servers/:serverId/invoke
GET /mcp/topology
GET /mcp/events
```

### 2. State Model
```typescript
// ✅ NEW State Structure
interface MCPState {
  currentServerId: string | null;
  currentAgentId: string | null;
  servers: MCPServer[];
  agents: MCPAgent[];
  topology: Topology | null;
  events: MCPEvent[];
  runtimeStatus: 'running' | 'stopped' | 'not_loaded';
}
```

### 3. Chat Integration
```typescript
// ❌ OLD
const { nodes, edges } = await generateWorkflow(prompt);

// ✅ NEW
const { serverId, tools } = await generateMCPServer(prompt);
const agentId = await createAndAttachAgent(serverId, tools);
router.push(`/mcp?serverId=${serverId}`);
```

## 📁 New Files to Create

```
frontend/
├── app/
│   └── mcp/
│       └── page.tsx                    # MCP Dashboard
├── components/
│   └── mcp/
│       ├── MCPServerList.tsx           # Server list
│       ├── RuntimeControls.tsx         # Start/stop buttons
│       ├── ActivityFeed.tsx            # Event stream
│       ├── TopologyGraph.tsx           # Visualization
│       └── AgentList.tsx               # Agent list
└── lib/
    └── mcpStore.ts                     # State management
```

## 🔧 Key Functions

### Generate MCP Server
```typescript
async function generateMCPServer(prompt: string) {
  const response = await fetch(`${API_URL}/ai/generate-mcp-server`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ownerId: 'user_default' })
  });
  return await response.json();
}
```

### Create & Attach Agent
```typescript
async function createAndAttachAgent(serverId: string, tools: any[]) {
  // Create agent
  const agentRes = await fetch(`${API_URL}/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Auto Agent',
      allowedTools: tools.map(t => t.toolId),
      ownerId: 'user_default'
    })
  });
  const { agentId } = await agentRes.json();
  
  // Attach to server
  await fetch(`${API_URL}/agents/${agentId}/attach/${serverId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerId: 'user_default' })
  });
  
  return agentId;
}
```

### Start Runtime
```typescript
async function startRuntime(serverId: string) {
  await fetch(`${API_URL}/mcp/servers/${serverId}/runtime/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerId: 'user_default' })
  });
}
```

### Fetch Events
```typescript
async function fetchEvents(serverId?: string) {
  const params = serverId ? `?serverId=${serverId}&limit=50` : '?limit=50';
  const response = await fetch(`${API_URL}/mcp/events${params}`);
  return await response.json();
}
```

### Fetch Topology
```typescript
async function fetchTopology() {
  const response = await fetch(`${API_URL}/mcp/topology?ownerId=user_default`);
  return await response.json();
}
```

## 🎨 Component Templates

### MCP Dashboard (Minimal)
```tsx
export default function MCPDashboard() {
  const [serverId, setServerId] = useState<string | null>(null);
  const [servers, setServers] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchServers().then(setServers);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents(serverId).then(data => setEvents(data.events));
    }, 2000);
    return () => clearInterval(interval);
  }, [serverId]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3">
        <MCPServerList servers={servers} onSelect={setServerId} />
      </div>
      <div className="col-span-6">
        {serverId && <RuntimeControls serverId={serverId} />}
      </div>
      <div className="col-span-3">
        <ActivityFeed events={events} />
      </div>
    </div>
  );
}
```

### Runtime Controls (Minimal)
```tsx
export default function RuntimeControls({ serverId }: { serverId: string }) {
  return (
    <div className="flex gap-2">
      <button onClick={() => startRuntime(serverId)}>
        Start Runtime
      </button>
      <button onClick={() => stopRuntime(serverId)}>
        Stop Runtime
      </button>
    </div>
  );
}
```

### Activity Feed (Minimal)
```tsx
export default function ActivityFeed({ events }: { events: any[] }) {
  return (
    <div>
      <h3>Activity Feed</h3>
      {events.map(event => (
        <div key={event.id}>
          {event.type} - {event.toolId}
        </div>
      ))}
    </div>
  );
}
```

## ✅ Implementation Checklist

### Phase 1 (Critical - 2 hours)
- [ ] Update ChatShell to call `/ai/generate-mcp-server`
- [ ] Create `mcpStore.ts` for state management
- [ ] Create `app/mcp/page.tsx` dashboard
- [ ] Create `MCPServerList.tsx` component
- [ ] Create `RuntimeControls.tsx` component

### Phase 2 (Important - 2 hours)
- [ ] Create `ActivityFeed.tsx` component
- [ ] Create `TopologyGraph.tsx` component
- [ ] Create `AgentList.tsx` component
- [ ] Update navigation to include MCP link
- [ ] Implement auto-create agent flow

### Phase 3 (Polish - 2 hours)
- [ ] Add tool invocation UI
- [ ] Enhance topology visualization
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success notifications

## 🧪 Testing

```bash
# 1. Start backend
cd backend-core
npm run dev

# 2. Start frontend
cd frontend
npm run dev

# 3. Test flow
# - Enter prompt in chat
# - Verify MCP server created
# - Check MCP dashboard shows server
# - Start runtime
# - Verify activity feed updates
```

## 🐛 Common Issues

### Issue: API calls fail
**Fix**: Check `NEXT_PUBLIC_API_URL` in `.env.local`

### Issue: Events not updating
**Fix**: Verify polling interval is running

### Issue: Runtime won't start
**Fix**: Check backend logs, verify MongoDB connection

### Issue: Topology empty
**Fix**: Ensure agent is attached to server

## 📚 Full Documentation

- **Complete Spec**: `FRONTEND-MCP-MIGRATION-PROMPT.md`
- **Backend API**: `MCP-PLATFORM-INTEGRATION.md`
- **Backend Summary**: `MCP-INTEGRATION-SUMMARY.md`

---

**Ready to implement!** Start with Phase 1, test, then move to Phase 2.
