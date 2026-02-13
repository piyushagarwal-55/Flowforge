# Agent Runner - Schema-Driven Tool Forms & One-Click Execution

## Overview

The Agent Runner feature transforms the MCP platform from a developer-only tool into a user-friendly system that anyone can use. Instead of manually writing JSON for each tool invocation, users fill out dynamic forms and click "Run Agent" to execute complete workflows.

## Key Features

### 1. Schema-Driven Forms
- Every tool includes `inputSchema` and `outputSchema`
- Forms are automatically generated from schemas
- Field validation happens client-side
- No JSON knowledge required

### 2. One-Click Execution
- Execute entire agent workflows with a single button
- Visual pipeline shows progress in real-time
- Automatic error handling and rollback
- Live updates via WebSocket

### 3. Visual Pipeline
- See each step: pending → running → success/failed
- Real-time progress indicators
- Output preview for each step
- Duration tracking

### 4. Result Summary
- Total steps executed
- Success/failure counts
- Total execution time
- Detailed step-by-step results

## Architecture

### Backend Components

#### 1. Tool Schema Enforcement (`backend-core/src/mcp/schemas.ts`)
```typescript
export interface MCPTool {
  toolId: string;
  name: string;
  description: string;
  inputSchema: MCPToolSchema;  // Required
  outputSchema: MCPToolSchema; // Required
  handler: (input: any, context: any) => Promise<any>;
}
```

#### 2. Execution Order (`backend-core/src/mcp/schemas.ts`)
```typescript
export interface MCPServer {
  // ... other fields
  executionOrder?: string[]; // Ordered list of toolIds
}
```

Generated automatically from workflow edges using topological sort.

#### 3. API Endpoints

**GET /mcp/servers/:serverId/tools**
- Returns tool schemas for form generation
- Includes executionOrder
- No handlers (serializable)

**POST /mcp/servers/:serverId/run-agent**
- Executes full agent chain
- Takes user input
- Returns step-by-step results
- Emits real-time events via Socket.io

### Frontend Components

#### 1. DynamicToolForm (`frontend/components/DynamicToolForm.tsx`)
- Renders form fields from schema
- Handles validation
- Supports: string, number, boolean, enum, object, array
- Required field indicators
- Error messages

#### 2. AgentExecutionPipeline (`frontend/components/AgentExecutionPipeline.tsx`)
- Visual step-by-step display
- Real-time status updates
- Socket.io integration
- Progress indicators
- Output/error display

#### 3. AgentRunner (`frontend/components/AgentRunner.tsx`)
- Main orchestration component
- Fetches tool schemas
- Manages execution state
- Shows results summary
- Reset functionality

#### 4. Agent Runner Page (`frontend/app/agent-runner/page.tsx`)
- Server selection
- Runtime management
- Full UI integration

## Usage Flow

### 1. Create MCP Server
```typescript
const server = await generateMCPServer('Create a user signup API');
// Server includes executionOrder: ['input', 'inputValidation', 'dbInsert', 'response']
```

### 2. Start Runtime
```typescript
await startRuntime(serverId);
```

### 3. Open Agent Runner
Navigate to `/agent-runner` and select your server.

### 4. Fill Form
Dynamic form appears based on first tool (usually `input`):
- Email field (string, required)
- Password field (string, required)
- Name field (string, optional)

### 5. Click "Run Agent"
- Pipeline visualization appears
- Each step executes in order
- Real-time status updates
- Automatic error handling

### 6. View Results
- Summary statistics
- Step-by-step details
- Output data
- Duration metrics

## Example: User Signup Flow

### Execution Order
```json
[
  "input",
  "inputValidation",
  "dbInsert",
  "jwtGenerate",
  "response"
]
```

### Visual Pipeline
```
┌─────────────────────────────┐
│ ✓ Step 1: Input             │
│   Read user input           │
│   Duration: 5ms             │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│ ✓ Step 2: Input Validation  │
│   Validate email & password │
│   Duration: 12ms            │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│ ✓ Step 3: Database Insert   │
│   Create user record        │
│   Duration: 45ms            │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│ ✓ Step 4: JWT Generate      │
│   Generate auth token       │
│   Duration: 8ms             │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│ ✓ Step 5: Response          │
│   Return success response   │
│   Duration: 2ms             │
└─────────────────────────────┘
```

### Result Summary
```json
{
  "success": true,
  "summary": {
    "totalSteps": 5,
    "successCount": 5,
    "failedCount": 0,
    "duration": 72
  }
}
```

## API Reference

### Get Tool Schemas
```typescript
GET /mcp/servers/:serverId/tools?ownerId=user_default

Response:
{
  "serverId": "mcp_123",
  "tools": [
    {
      "toolId": "input",
      "name": "Input",
      "description": "Reads user input variables",
      "inputSchema": {
        "type": "object",
        "properties": {
          "variables": {
            "type": "array",
            "items": { ... }
          }
        },
        "required": ["variables"]
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "variables": { "type": "object" }
        }
      }
    }
  ],
  "executionOrder": ["input", "inputValidation", "dbInsert", "response"]
}
```

### Run Agent
```typescript
POST /mcp/servers/:serverId/run-agent

Body:
{
  "ownerId": "user_default",
  "agentId": "agent_123", // optional
  "input": {
    "email": "user@example.com",
    "password": "SecurePass123!"
  }
}

Response:
{
  "success": true,
  "serverId": "mcp_123",
  "executionId": "agent-run-1234567890",
  "results": [
    {
      "step": 1,
      "toolId": "input",
      "toolName": "Input",
      "status": "success",
      "output": { ... },
      "duration": 5
    },
    // ... more steps
  ],
  "summary": {
    "totalSteps": 5,
    "successCount": 5,
    "failedCount": 0,
    "duration": 72
  }
}
```

## Socket Events

### agent:step:start
```typescript
{
  "executionId": "agent-run-1234567890",
  "step": 1,
  "totalSteps": 5,
  "toolId": "input",
  "toolName": "Input",
  "status": "running"
}
```

### agent:step:complete
```typescript
{
  "executionId": "agent-run-1234567890",
  "step": 1,
  "totalSteps": 5,
  "toolId": "input",
  "toolName": "Input",
  "status": "success",
  "output": { ... },
  "duration": 5
}
```

## Testing

### Run Full Chain Test
```bash
cd backend-core
npm run test:agent-chain
```

Or directly:
```bash
npx ts-node src/mcp/tests/agent.fullchain.test.ts
```

### Test Coverage
- Server generation
- Runtime creation
- Tool execution
- Chain orchestration
- Database verification
- Error handling

## Benefits

### For Users
- ✅ No JSON knowledge required
- ✅ Visual feedback
- ✅ One-click execution
- ✅ Clear error messages
- ✅ Progress tracking

### For Developers
- ✅ Schema-driven development
- ✅ Type safety
- ✅ Automatic validation
- ✅ Reusable components
- ✅ Easy testing

### For Demos
- ✅ Professional UI
- ✅ Real-time updates
- ✅ Clear value proposition
- ✅ Non-technical friendly
- ✅ Impressive visuals

## Future Enhancements

1. **Conditional Execution**
   - Skip steps based on conditions
   - Branching workflows

2. **Parallel Execution**
   - Execute independent tools simultaneously
   - Faster completion

3. **Step Retry**
   - Automatic retry on failure
   - Configurable retry policies

4. **Input Templates**
   - Save common inputs
   - Quick execution

5. **Execution History**
   - View past executions
   - Replay functionality

## Troubleshooting

### Forms Not Appearing
- Check that server has tools
- Verify inputSchema is present
- Check browser console for errors

### Execution Fails
- Ensure runtime is started
- Check tool permissions
- Verify input data format
- Review execution logs

### Real-time Updates Not Working
- Check Socket.io connection
- Verify CORS settings
- Check network tab for WebSocket

## Conclusion

The Agent Runner transforms the MCP platform into a production-ready system that anyone can use. By combining schema-driven forms with one-click execution and real-time visualization, we've created an experience that's both powerful and accessible.

No more JSON. No more confusion. Just agents running.
