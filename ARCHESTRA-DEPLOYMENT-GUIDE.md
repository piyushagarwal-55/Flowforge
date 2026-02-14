# Archestra Deployment Integration - Complete Guide

## Overview

Orchestrix now supports deploying generated MCP servers directly to Archestra, converting local workflows into production-hosted agents with public endpoints.

## Architecture

```
User → Orchestrix UI → Backend API → Archestra API → Hosted Agent
                ↓
         MongoDB (Deployment Info)
```

### Agent Roles

**During Development (Orchestrix):**
- **SupervisorAgent**: Routes user requests to appropriate handlers
- **BuilderAgent**: Generates and mutates workflows using AI
- **MCPRuntime**: Executes workflows locally for testing

**During Production (Archestra):**
- **Archestra MCP Runtime**: Executes the deployed tool graph
- **Archestra Platform**: Provides hosting, routing, governance, observability

⚠️ **IMPORTANT**: SupervisorAgent and BuilderAgent are NOT deployed to Archestra. They only exist in Orchestrix for workflow creation, mutation, and local testing. Production execution uses Archestra's MCP runtime directly.

---

## 🎯 Critical Technical Distinction

### What Gets Deployed vs What Stays Local

**Deployed to Archestra:**
```
✅ Tool Definitions (input, validation, dbInsert, jwtGenerate, response)
✅ Tool Handlers (the actual code that executes)
✅ Execution Order (sequence of tool execution)
✅ Input Schema (API contract)
✅ Metadata (name, description, creator info)
```

**Stays in Orchestrix (NOT Deployed):**
```
❌ SupervisorAgent (only for routing during development)
❌ BuilderAgent (only for AI generation/mutation)
❌ Local MCPRuntime (replaced by Archestra's runtime)
❌ Orchestrix UI (development interface)
❌ MongoDB (deployment metadata only)
```

### Execution Comparison

| Phase | Location | Runtime | Agents Involved |
|-------|----------|---------|-----------------|
| **Workflow Creation** | Orchestrix | Local MCPRuntime | SupervisorAgent, BuilderAgent |
| **Workflow Mutation** | Orchestrix | Local MCPRuntime | SupervisorAgent, BuilderAgent |
| **Local Testing** | Orchestrix | Local MCPRuntime | SupervisorAgent, BuilderAgent |
| **Production** | Archestra | Archestra MCP Runtime | None (direct tool execution) |

### Why This Matters

1. **Performance**: Production execution is faster because it skips agent orchestration overhead
2. **Scalability**: Archestra's runtime is optimized for production workloads
3. **Observability**: Archestra provides its own monitoring and logging
4. **Governance**: Archestra enforces policies at the platform level
5. **Simplicity**: Deployed agents are just tool graphs, not complex agent systems

---

## Implementation Components

### 1. Backend Service (`backend-core/src/services/archestra.service.ts`)

The Archestra service handles:
- Telemetry events (existing functionality)
- **NEW: Deployment to Archestra**

#### Key Method: `deployToArchestra()`

```typescript
async deployToArchestra(mcpServer: any): Promise<ArchestraDeploymentResponse>
```

**What it does:**
1. Validates Archestra configuration (API key and endpoint)
2. Transforms MCP server into Archestra agent format
3. POSTs to Archestra deployment endpoint
4. Returns deployment response with:
   - `agentId`: Unique identifier for the deployed agent
   - `publicEndpoint`: Public URL for API calls
   - `dashboardUrl`: Archestra dashboard link

**Deployment Request Format:**
```json
{
  "name": "Signup API",
  "description": "User registration with JWT",
  "tools": [...],
  "executionOrder": ["input", "validation", "dbInsert", "jwtGenerate", "response"],
  "inputSchema": {...},
  "metadata": {
    "createdBy": "orchestrix",
    "serverId": "mcp_1234567890",
    "createdAt": "2026-02-13T...",
    "ownerId": "user-123"
  }
}
```

### 2. Database Schema (`backend-core/src/models/mcpServer.model.ts`)

Added fields to `IMCPServer` interface:

```typescript
archestraAgentId?: string;        // Archestra agent ID
archestraEndpoint?: string;       // Public API endpoint
archestraDashboardUrl?: string;   // Dashboard URL
archestraDeployedAt?: Date;       // Deployment timestamp
```

These fields are:
- Indexed for efficient queries
- Optional (only set after deployment)
- Persisted to MongoDB
- Returned in API responses

### 3. API Route (`backend-core/src/routes/mcp.routes.ts`)

#### New Endpoint: `POST /mcp/servers/:serverId/deploy`

**Request:**
```json
{
  "ownerId": "user-123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "serverId": "mcp_1234567890",
  "agentId": "agent_abc123",
  "endpoint": "https://api.archestra.ai/agents/agent_abc123",
  "dashboardUrl": "https://archestra.ai/dashboard/agent_abc123",
  "deployedAt": "2026-02-13T10:30:00.000Z"
}
```

**Error Response (400) - Already Deployed:**
```json
{
  "error": "Server already deployed to Archestra",
  "agentId": "agent_abc123",
  "endpoint": "https://api.archestra.ai/agents/agent_abc123",
  "dashboardUrl": "https://archestra.ai/dashboard/agent_abc123"
}
```

**Error Response (500) - Deployment Failed:**
```json
{
  "success": false,
  "error": "Failed to deploy to Archestra: API key not configured"
}
```

#### Updated Endpoint: `GET /mcp/servers/:serverId`

Now returns Archestra deployment info:

```json
{
  "serverId": "mcp_1234567890",
  "name": "Signup API",
  "archestraAgentId": "agent_abc123",
  "archestraEndpoint": "https://api.archestra.ai/agents/agent_abc123",
  "archestraDashboardUrl": "https://archestra.ai/dashboard/agent_abc123",
  "archestraDeployedAt": "2026-02-13T10:30:00.000Z"
}
```

### 4. Frontend UI (`frontend/components/mcp/MCPWorkflowDashboard.tsx`)

#### New State Variables

```typescript
const [isDeploying, setIsDeploying] = useState(false);
const [deploymentInfo, setDeploymentInfo] = useState<{
  agentId: string;
  endpoint: string;
  dashboardUrl: string;
} | null>(null);
```

#### Deploy Button

Located in the control panel, between Save and Run buttons:

```tsx
<button
  onClick={handleDeploy}
  disabled={isDeploying || !!deploymentInfo}
  className="px-4 py-2 text-[13px] font-medium text-purple-400..."
>
  {isDeploying ? (
    <>
      <Spinner />
      <span>Deploying...</span>
    </>
  ) : deploymentInfo ? (
    <>
      <Zap size={14} />
      <span>Deployed</span>
    </>
  ) : (
    <>
      <Zap size={14} />
      <span>Deploy to Archestra</span>
    </>
  )}
</button>
```

**Button States:**
- **Default**: "Deploy to Archestra" (purple, enabled)
- **Deploying**: "Deploying..." (spinner, disabled)
- **Deployed**: "Deployed" (disabled, shows checkmark)

#### Deployment Info Banner

Appears at the top of the canvas when deployed:

```tsx
{deploymentInfo && (
  <div className="px-6 py-3 bg-purple-500/10 border-b border-purple-500/20">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[13px] font-semibold text-purple-400">
          Deployed to Archestra
        </div>
        <div className="text-[11px] text-white/50">
          Agent ID: {deploymentInfo.agentId}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={copyEndpoint}>Copy Endpoint</button>
        <a href={deploymentInfo.dashboardUrl}>Open Dashboard</a>
      </div>
    </div>
  </div>
)}
```

#### Handler Function

```typescript
const handleDeploy = async () => {
  setIsDeploying(true);
  addLog('info', '🚀 Deploying to Archestra...');
  
  try {
    const response = await fetch(`${apiUrl}/mcp/servers/${serverId}/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to deploy to Archestra');
    }

    const result = await response.json();
    
    setDeploymentInfo({
      agentId: result.agentId,
      endpoint: result.endpoint,
      dashboardUrl: result.dashboardUrl,
    });
    
    addLog('success', '✅ Deployed to Archestra successfully!', result);
    
    // Show success modal and copy endpoint
    alert(`✅ Deployed Successfully!\n\nAgent ID: ${result.agentId}\nEndpoint: ${result.endpoint}`);
    await navigator.clipboard.writeText(result.endpoint);
  } catch (err) {
    addLog('error', '❌ Failed to deploy to Archestra', err.message);
    alert('❌ Failed to deploy: ' + err.message);
  } finally {
    setIsDeploying(false);
  }
};
```

#### Auto-Load Deployment Info

On component mount, checks if already deployed:

```typescript
const fetchRuntimeStatus = async () => {
  const response = await fetch(`${apiUrl}/mcp/servers/${serverId}?ownerId=${ownerId}`);
  const data = await response.json();
  
  // Load deployment info if exists
  if (data.archestraAgentId) {
    setDeploymentInfo({
      agentId: data.archestraAgentId,
      endpoint: data.archestraEndpoint,
      dashboardUrl: data.archestraDashboardUrl,
    });
  }
};
```

## Configuration

### Environment Variables

Add to `backend-core/.env`:

```env
# Archestra Configuration
ARCHESTRA_ENDPOINT=https://api.archestra.ai/telemetry
ARCHESTRA_API_KEY=your_api_key_here
ARCHESTRA_DEPLOYMENT_ENDPOINT=https://api.archestra.ai/mcp/agents
```

**Required for deployment:**
- `ARCHESTRA_API_KEY`: Your Archestra API key
- `ARCHESTRA_DEPLOYMENT_ENDPOINT`: Archestra deployment endpoint (defaults to production)

**Optional:**
- `ARCHESTRA_ENDPOINT`: Telemetry endpoint (for observability)

### Obtaining API Key

1. Sign up at https://archestra.ai
2. Navigate to Settings → API Keys
3. Generate a new API key
4. Copy and paste into `.env` file

## User Flow

### Complete Deployment Journey

1. **Create Workflow**
   - User: "create a sign up api"
   - AI generates workflow with nodes

2. **Test Locally**
   - Click "Start Runtime"
   - Click "Run" to test with sample data
   - Verify execution logs

3. **Deploy to Archestra**
   - Click "Deploy to Archestra"
   - System shows "Deploying..." spinner
   - Success modal appears with:
     - Agent ID
     - Public endpoint (auto-copied to clipboard)
     - Dashboard link

4. **Post-Deployment**
   - Purple banner appears at top
   - "Deploy" button changes to "Deployed" (disabled)
   - User can:
     - Copy endpoint again
     - Open Archestra dashboard
     - Continue editing workflow locally

5. **Using Deployed API**
   - External apps can call the public endpoint
   - Archestra MCP Runtime executes the tool graph directly
   - Tools execute in sequence: input → validation → dbInsert → jwtGenerate → response
   - Response returned to client
   - Example:
     ```bash
     curl -X POST https://api.archestra.ai/agents/agent_abc123 \
       -H "Content-Type: application/json" \
       -d '{"email":"user@example.com","password":"secure123","name":"John"}'
     ```

**⚠️ Important**: SupervisorAgent and BuilderAgent are NOT involved in production execution. They only run in Orchestrix during workflow creation, mutation, and local testing. Archestra uses its own MCP runtime to execute the deployed tool graph.

## Observability

### Execution Logs

All deployment activities are logged:

```typescript
addLog('info', '🚀 Deploying to Archestra...');
addLog('success', '✅ Deployed to Archestra successfully!', result);
addLog('error', '❌ Failed to deploy to Archestra', error.message);
```

Logs appear in the Execution Logs panel with:
- Timestamp
- Type (info, success, error)
- Message
- Details (expandable JSON)

### Agent Activity

**During Local Development (Orchestrix):**
- SupervisorAgent receives user requests
- BuilderAgent generates/mutates workflows
- Local MCPRuntime executes tools for testing
- All activities logged in Orchestrix dashboard

**During Production Execution (Archestra):**
- Archestra MCP Runtime executes tool graph directly
- Tools execute in defined sequence
- Archestra platform provides observability
- Logs visible in Archestra dashboard

**⚠️ Key Point**: SupervisorAgent and BuilderAgent do NOT run in production. They are development-time components that stay in Orchestrix. Production uses Archestra's MCP runtime exclusively.

## Testing

### Manual Testing

1. Start backend: `cd backend-core && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open http://localhost:5000
4. Create a workflow
5. Click "Deploy to Archestra"
6. Verify deployment info appears

### Automated Testing

Run the test script:

```bash
npx ts-node test-archestra-deployment.ts
```

**Expected Output:**
```
🚀 Testing Archestra Deployment Flow

Step 1: Generating signup API workflow...
✅ Workflow generated: mcp_1234567890

Step 2: Starting runtime...
✅ Runtime started

Step 3: Deploying to Archestra...
✅ Deployment successful!
📋 Deployment Info:
   Agent ID: agent_abc123
   Endpoint: https://api.archestra.ai/agents/agent_abc123
   Dashboard: https://archestra.ai/dashboard/agent_abc123

Step 4: Verifying deployment info...
✅ Deployment info persisted correctly
   Agent ID: agent_abc123
   Endpoint: https://api.archestra.ai/agents/agent_abc123
   Dashboard: https://archestra.ai/dashboard/agent_abc123
   Deployed At: 2026-02-13T10:30:00.000Z

✅ All tests passed!
```

## Error Handling

### Common Errors

1. **API Key Not Configured**
   ```
   Error: Archestra deployment is not configured. Please set ARCHESTRA_API_KEY and ARCHESTRA_ENDPOINT in environment variables.
   ```
   **Solution**: Add API key to `.env` and restart backend

2. **Already Deployed**
   ```
   Error: Server already deployed to Archestra
   ```
   **Solution**: This is expected. Each workflow can only be deployed once.

3. **Network Error**
   ```
   Error: Failed to deploy to Archestra: Network request failed
   ```
   **Solution**: Check internet connection and Archestra API status

4. **Invalid API Key**
   ```
   Error: Failed to deploy to Archestra: Unauthorized
   ```
   **Solution**: Verify API key is correct and active

## Security Considerations

### API Key Storage
- Never commit API keys to version control
- Use `.env` files (already in `.gitignore`)
- Rotate keys periodically

### Endpoint Access
- Deployed endpoints are public by default
- Consider adding authentication middleware for protected resources
- Use JWT tokens for user-specific operations

### Data Privacy
- Workflow metadata is sent to Archestra
- Includes: name, description, tools, execution order
- Does NOT include: user data, execution results, credentials

## Future Enhancements

### Phase 1 (Current)
- ✅ Deploy MCP servers to Archestra
- ✅ Persist deployment info
- ✅ UI feedback and controls
- ✅ Execution log integration

### Phase 2 (Planned)
- [ ] Undeploy/redeploy functionality
- [ ] Deployment versioning
- [ ] A/B testing between versions
- [ ] Custom domain mapping

### Phase 3 (Future)
- [ ] Deployment analytics dashboard
- [ ] Usage metrics and billing
- [ ] Auto-scaling configuration
- [ ] Multi-region deployment

## Troubleshooting

### Deployment Button Disabled

**Symptom**: Deploy button is grayed out

**Possible Causes:**
1. Already deployed (check for purple banner)
2. Currently deploying (check for spinner)
3. No nodes in workflow

**Solution**: 
- If already deployed, this is expected behavior
- If deploying, wait for completion
- If no nodes, add tools first

### Deployment Info Not Loading

**Symptom**: Deployed workflow doesn't show banner on reload

**Possible Causes:**
1. Database connection issue
2. Server restart cleared runtime state
3. Browser cache issue

**Solution**:
1. Check MongoDB connection
2. Refresh the page
3. Clear browser cache and reload

### Endpoint Not Working

**Symptom**: Calling deployed endpoint returns 404

**Possible Causes:**
1. Archestra agent not fully provisioned
2. Incorrect endpoint URL
3. Network/firewall issues

**Solution**:
1. Wait 30 seconds and retry
2. Verify endpoint URL from dashboard
3. Check Archestra status page

## Support

For issues or questions:
1. Check execution logs in dashboard
2. Review backend logs: `backend-core/logs/`
3. Test with provided script: `test-archestra-deployment.ts`
4. Contact Archestra support for API issues

## Conclusion

The Archestra deployment integration transforms Orchestrix from a local workflow builder into a complete API deployment platform. Users can now go from natural language description to production-hosted API in under 60 seconds, with full observability and control throughout the process.
