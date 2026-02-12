# MCP Infrastructure Quick Start

## Setup

### 1. Install Dependencies
```bash
cd backend-core
npm install
```

### 2. Configure Environment
```bash
# Copy example env
cp .env.example .env

# Required variables
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/flowforge
AI_PROVIDER=groq
GROQ_API_KEY=your-groq-key

# Optional: Enable MCP engine
USE_MCP_ENGINE=true
```

### 3. Start Server
```bash
npm run dev
```

## Testing MCP Infrastructure

### Run Automated Test
```bash
npm run test:mcp
```

Expected output:
```
=============================================================
MCP INFRASTRUCTURE TEST
=============================================================

1️⃣ Registering built-in tools...
✅ Built-in tools registered

2️⃣ Generating MCP server from prompt...
✅ MCP Server generated:
   Server ID: mcp_1234567890_abc123
   Name: User Registration API
   Tools: 4
   Resources: 2

3️⃣ Creating MCP runtime...
✅ Runtime created: mcp_1234567890_abc123

4️⃣ Starting runtime...
✅ Runtime started: true

5️⃣ Invoking input tool...
✅ Tool invoked successfully

6️⃣ Stopping runtime...
✅ Runtime stopped: true

7️⃣ Listing all runtimes...
✅ Total runtimes: 1

=============================================================
✅ ALL TESTS PASSED
=============================================================
```

## Using MCP via API

### 1. Generate MCP Server
```bash
curl -X POST http://localhost:3001/ai/generate-mcp-server \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a user signup API with email validation and JWT tokens",
    "ownerId": "user_123",
    "correlationId": "test-001"
  }'
```

Response:
```json
{
  "serverId": "mcp_1234567890_abc123",
  "name": "User Registration API",
  "description": "MCP server generated from: Create a user signup API...",
  "tools": [
    {
      "toolId": "input",
      "name": "User Input",
      "description": "input operation",
      "inputSchema": { ... }
    },
    {
      "toolId": "inputValidation",
      "name": "Validate Input",
      "description": "inputValidation operation",
      "inputSchema": { ... }
    },
    ...
  ],
  "resources": [
    {
      "resourceId": "db_users",
      "name": "Database: users",
      "type": "database",
      "config": { ... }
    },
    {
      "resourceId": "auth_service",
      "name": "Authentication Service",
      "type": "auth",
      "config": { ... }
    }
  ],
  "status": "created",
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "prompt": "Create a user signup API...",
    "correlationId": "test-001"
  }
}
```

### 2. Execute Workflow (Using MCP Engine)

First, ensure MCP engine is enabled:
```bash
# In .env
USE_MCP_ENGINE=true
```

Then execute:
```bash
curl -X POST http://localhost:3001/workflows/:workflowId/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "email": "user@example.com",
      "password": "securepass123"
    },
    "ownerId": "user_123"
  }'
```

Response:
```json
{
  "ok": true,
  "executionId": "exec-uuid-here",
  "message": "Workflow execution started"
}
```

### 3. Monitor Execution (via Socket.io)

Connect to Socket.io and join execution room:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.emit('join-execution', { executionId: 'exec-uuid-here' });

socket.on('execution-log', (data) => {
  console.log('Execution event:', data);
  // Events: workflow_start, tool_start, tool_complete, tool_error, workflow_complete
});
```

## Using MCP Programmatically

### Generate and Execute MCP Server

```typescript
import { generateMCPServer } from './src/mcp/server.generator';
import { runtimeManager } from './src/mcp/runtime.manager';
import { registerBuiltInTools } from './src/mcp/tool.registry';

// 1. Register tools
registerBuiltInTools();

// 2. Generate MCP server
const mcpServer = await generateMCPServer(
  "Create a user signup API",
  "user_123",
  "correlation-001"
);

console.log('Generated server:', mcpServer.serverId);
console.log('Tools:', mcpServer.tools.map(t => t.name));

// 3. Create runtime
const runtimeId = runtimeManager.createRuntime(mcpServer);
runtimeManager.startRuntime(runtimeId);

// 4. Invoke tools
const context = {
  vars: { 
    input: { 
      email: "test@example.com",
      password: "pass123"
    } 
  },
  headers: {},
  executionId: "exec-001",
  socketServer: socketServerInstance,
};

// Invoke input tool
const inputResult = await runtimeManager.invokeTool(
  runtimeId,
  "input",
  {
    variables: [
      { name: "email", type: "string", required: true },
      { name: "password", type: "string", required: true }
    ]
  },
  context
);

console.log('Input result:', inputResult);
console.log('Context vars:', context.vars);

// Invoke validation tool
const validationResult = await runtimeManager.invokeTool(
  runtimeId,
  "inputValidation",
  {
    rules: [
      { field: "{{email}}", required: true, type: "email" },
      { field: "{{password}}", required: true, minLength: 8 }
    ]
  },
  context
);

console.log('Validation result:', validationResult);

// 5. Stop runtime
runtimeManager.stopRuntime(runtimeId);
```

## Available MCP Tools

All workflow nodes are now available as MCP tools:

| Tool ID | Description | Input Schema |
|---------|-------------|--------------|
| `input` | Read user input variables | `{ variables: Array }` |
| `inputValidation` | Validate input fields | `{ rules: Array }` |
| `dbFind` | Find MongoDB documents | `{ collection, filters, findType }` |
| `dbInsert` | Insert MongoDB document | `{ collection, data }` |
| `dbUpdate` | Update MongoDB document | `{ collection, filter, data }` |
| `authMiddleware` | Verify JWT token | `{ output }` |
| `jwtGenerate` | Generate JWT token | `{ payload, expiresIn }` |
| `emailSend` | Send email | `{ to, subject, body }` |
| `response` | Return API response | `{ status, body }` |

## Debugging

### Enable Debug Logging
```bash
# In .env
LOG_LEVEL=debug
```

### Check Runtime Status
```typescript
import { runtimeManager } from './src/mcp/runtime.manager';

// List all runtimes
const runtimes = runtimeManager.listRuntimes();
console.log('Active runtimes:', runtimes);

// Get specific runtime
const runtime = runtimeManager.getRuntime('mcp_123');
console.log('Runtime status:', runtime?.status);

// Get invocation history
const invocations = runtimeManager.getInvocations('mcp_123');
console.log('Invocations:', invocations);
```

### Check Tool Registry
```typescript
import { toolRegistry } from './src/mcp/tool.registry';

// List all tools
const tools = toolRegistry.listTools();
console.log('Registered tools:', tools.map(t => t.name));

// Get specific tool
const tool = toolRegistry.getTool('input');
console.log('Tool:', tool);
```

## Common Issues

### Issue: "Tool not found in registry"
**Solution:** Ensure `registerBuiltInTools()` is called before using tools.

### Issue: "Runtime not running"
**Solution:** Call `runtimeManager.startRuntime(serverId)` before invoking tools.

### Issue: "Model not found for collection"
**Solution:** Ensure MongoDB models are registered in `backend-core/src/db/getModel.ts`.

### Issue: "JWT_SECRET is not configured"
**Solution:** Set `JWT_SECRET` in `.env` file.

## Next Steps

1. ✅ Test MCP infrastructure with automated test
2. ✅ Generate MCP server via API
3. ✅ Execute workflow using MCP engine
4. 🔄 Implement agent permissions
5. 🔄 Add multi-agent orchestration
6. 🔄 Integrate Archestra observability
7. 🔄 Build agent-first UI

## Resources

- [MCP Infrastructure README](./backend-core/src/mcp/README.md)
- [Implementation Summary](./MCP-INFRASTRUCTURE-IMPLEMENTATION.md)
- [Architecture Documentation](./backend-core/src/mcp/README.md#architecture-overview)

## Support

For issues or questions:
1. Check the [MCP README](./backend-core/src/mcp/README.md)
2. Review [Implementation Summary](./MCP-INFRASTRUCTURE-IMPLEMENTATION.md)
3. Run automated tests: `npm run test:mcp`
4. Enable debug logging: `LOG_LEVEL=debug`
