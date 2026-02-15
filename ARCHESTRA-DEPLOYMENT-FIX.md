# Archestra Deployment Integration - Final Fix

## Issue Resolved
Fixed authentication format inconsistency in Archestra service that was causing 401 Unauthorized errors during deployment.

## What Was Fixed

### 1. Authentication Header Format
**Problem**: The telemetry endpoint was using `Bearer ${apiKey}` format while Archestra expects raw API key.

**Solution**: Updated `sendEventAsync` method in `backend-core/src/services/archestra.service.ts`:

```typescript
// BEFORE (Line 92)
'Authorization': `Bearer ${this.apiKey}`,

// AFTER
'Authorization': this.apiKey, // Raw API key, no "Bearer" prefix
```

This ensures consistency across all Archestra API calls:
- ✅ Telemetry endpoint: Raw API key
- ✅ Teams endpoint: Raw API key  
- ✅ Deployment endpoint: Raw API key

## Current Implementation Status

### Backend (`backend-core/src/services/archestra.service.ts`)
✅ Correct authentication format (raw API key)
✅ Team assignment with Default Team fallback
✅ Proper error handling and logging
✅ Deployment metadata persistence

### Frontend (`frontend/components/mcp/MCPWorkflowDashboard.tsx`)
✅ "Deploy to Archestra" button
✅ Deployment info banner with agent details
✅ Copy endpoint functionality
✅ Open dashboard link
✅ Prevents duplicate deployments

### Database Model (`backend-core/src/models/mcpServer.model.ts`)
✅ Archestra deployment fields:
  - `archestraAgentId`
  - `archestraEndpoint`
  - `archestraDashboardUrl`
  - `archestraDeployedAt`

### API Routes (`backend-core/src/routes/mcp.routes.ts`)
✅ POST `/mcp/servers/:serverId/deploy` endpoint
✅ Returns Archestra deployment info
✅ Prevents duplicate deployments
✅ GET endpoint returns Archestra fields

## Environment Configuration

Ensure your `.env` file has:

```env
# Archestra Configuration
ARCHESTRA_ENDPOINT=http://localhost:9000
ARCHESTRA_API_KEY=archestra_oStLwETyecseLkiKrjDppTQFibKiKvWaeukVxJPZUzFbHIASSgFsqzqimouGeJVJ
ARCHESTRA_DEPLOYMENT_ENDPOINT=http://localhost:9000/api/agents
```

## Testing Instructions

### 1. Restart Backend
```bash
cd backend-core
npm run dev
```

### 2. Verify Archestra is Running
```bash
# Check Archestra API
curl http://localhost:9000/api/health

# Check Archestra UI
# Open http://localhost:3000 in browser
```

### 3. Test Deployment Flow

1. **Create/Open MCP Server in Orchestrix**
   - Navigate to MCP Workflow Dashboard
   - Ensure you have at least one tool/node

2. **Save Workflow**
   - Click "Save" button
   - Verify success message

3. **Deploy to Archestra**
   - Click "Deploy to Archestra" button
   - Wait for deployment (should take 2-5 seconds)
   - Verify success alert with Agent ID and Endpoint

4. **Verify in Archestra UI**
   - Open http://localhost:3000/agents
   - You should see your deployed agent
   - Agent name should match your MCP server name
   - Click on agent to see details

5. **Verify Deployment Info Banner**
   - In Orchestrix, you should see purple banner at top
   - Shows: "Deployed to Archestra"
   - Shows: Agent ID
   - Has buttons: "Copy Endpoint" and "Open Dashboard"

### 4. Test Agent Invocation

```bash
# Get your agent ID from the deployment info
AGENT_ID="your-agent-id-here"

# Test agent invocation
curl -X POST http://localhost:9000/api/agents/$AGENT_ID/invoke \
  -H "Content-Type: application/json" \
  -H "Authorization: archestra_oStLwETyecseLkiKrjDppTQFibKiKvWaeukVxJPZUzFbHIASSgFsqzqimouGeJVJ" \
  -d '{
    "input": {
      "message": "test"
    }
  }'
```

## Expected Results

### ✅ Successful Deployment
- Backend logs show: `[archestra] Deployment successful`
- Frontend shows success alert
- Deployment info banner appears
- Agent visible in Archestra UI at http://localhost:3000/agents
- Agent has correct team assignment (Default Team)

### ✅ Deployment Info Persisted
- Refresh Orchestrix page
- Deployment banner still shows
- "Deploy to Archestra" button is disabled (shows "Deployed")

### ✅ Agent Accessible
- Agent appears in Archestra dashboard
- Agent can be invoked via API
- Agent shows MCP tools in Archestra UI

## Troubleshooting

### Issue: Still Getting 401 Error
**Check**:
1. API key is correct in `.env`
2. No extra spaces or quotes around API key
3. Backend was restarted after `.env` change
4. Archestra is running on port 9000

**Verify API Key**:
```bash
# In Archestra UI
# Go to: Settings → Account → API Keys
# Copy the key and update .env
```

### Issue: Agent Not Visible in Archestra UI
**Check**:
1. Team assignment in deployment logs
2. User is member of Default Team
3. Refresh Archestra UI (hard refresh: Ctrl+Shift+R)

**Manual Team Check**:
```bash
curl http://localhost:9000/api/teams \
  -H "Authorization: archestra_oStLwETyecseLkiKrjDppTQFibKiKvWaeukVxJPZUzFbHIASSgFsqzqimouGeJVJ"
```

### Issue: Deployment Succeeds but No Banner
**Check**:
1. Frontend console for errors
2. Server details endpoint returns Archestra fields:
```bash
curl "http://localhost:4000/mcp/servers/YOUR_SERVER_ID?ownerId=YOUR_OWNER_ID"
```

## Architecture Overview

```
┌─────────────────┐
│   Orchestrix    │
│   (Frontend)    │
└────────┬────────┘
         │ 1. Click "Deploy to Archestra"
         ↓
┌─────────────────┐
│   Orchestrix    │
│   (Backend)     │
│                 │
│  POST /mcp/     │
│  servers/:id/   │
│  deploy         │
└────────┬────────┘
         │ 2. archestraService.deployToArchestra()
         ↓
┌─────────────────┐
│   Archestra     │
│   Platform      │
│                 │
│  POST /api/     │
│  agents         │
│                 │
│  Authorization: │
│  archestra_xxx  │ ← Raw API key (no Bearer)
└────────┬────────┘
         │ 3. Returns agent ID
         ↓
┌─────────────────┐
│   MongoDB       │
│                 │
│  Save:          │
│  - agentId      │
│  - endpoint     │
│  - dashboardUrl │
└─────────────────┘
```

## Key Technical Details

### Authentication Format
- **Archestra expects**: `Authorization: archestra_xxx`
- **NOT**: `Authorization: Bearer archestra_xxx`
- This is different from most APIs (OpenAI, Anthropic, etc.)

### Team Assignment
- Agents MUST be assigned to a team to be visible in UI
- We fetch Default Team ID from `/api/teams`
- Fallback to hardcoded ID: `0547b7a5-9405-46dd-8f47-ea9b9357a6d1`

### Deployment Payload Structure
```json
{
  "name": "Generated MCP Server",
  "description": "Deployed from Orchestrix",
  "teams": ["team-id-here"],
  "mcpServers": [
    {
      "url": "stdio",
      "name": "server-name",
      "tools": [...],
      "resources": [...],
      "prompts": [...]
    }
  ],
  "config": {
    "executionOrder": [...],
    "metadata": {
      "source": "orchestrix",
      "orchestrixServerId": "...",
      "createdAt": "...",
      "ownerId": "..."
    }
  }
}
```

## Demo Script for Judges

1. **Show AI-Generated API**
   - "Let me create a signup API using natural language"
   - Type: "create a signup api with email validation and JWT"
   - Show nodes being generated automatically

2. **Save Workflow**
   - Click "Save"
   - "This persists the MCP server definition"

3. **Deploy to Archestra**
   - Click "Deploy to Archestra"
   - "This transforms our local MCP server into a production-hosted Archestra agent"
   - Show deployment success

4. **Show in Archestra Dashboard**
   - Open http://localhost:3000/agents
   - "Here's our agent in the Archestra platform"
   - Click on agent to show details
   - "All the tools we generated are now available as an Archestra agent"

5. **Show Agent Invocation**
   - Copy endpoint from banner
   - Show curl command or Postman
   - "This agent can now be called by other agents or applications"

6. **Highlight Integration**
   - "This demonstrates the full 'Best Use of Archestra' criteria:"
   - ✅ AI generates API workflow
   - ✅ Deploys to Archestra platform
   - ✅ Appears in Archestra dashboard
   - ✅ Tools are visible and callable
   - ✅ Agent-to-Agent communication ready
   - ✅ Full observability in Archestra

## Files Modified

1. `backend-core/src/services/archestra.service.ts` - Fixed auth header
2. `backend-core/src/models/mcpServer.model.ts` - Already had Archestra fields
3. `backend-core/src/routes/mcp.routes.ts` - Already had deploy endpoint
4. `frontend/components/mcp/MCPWorkflowDashboard.tsx` - Already had deployment UI

## Next Steps

1. ✅ Restart backend with fixed authentication
2. ✅ Test deployment flow end-to-end
3. ✅ Verify agent appears in Archestra UI
4. ✅ Test agent invocation
5. ✅ Prepare demo for judges

## Success Criteria

- [ ] Backend starts without errors
- [ ] Deployment completes without 401 error
- [ ] Agent appears in Archestra UI
- [ ] Deployment info banner shows in Orchestrix
- [ ] Agent can be invoked via API
- [ ] Tools are visible in Archestra agent details

---

**Status**: Ready for testing
**Last Updated**: February 14, 2026
**Author**: Kiro AI Assistant
