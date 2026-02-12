# MCP Infrastructure

This directory contains the core MCP (Model Context Protocol) infrastructure that transforms FlowForge from a workflow builder into an agent infrastructure platform.

## Architecture Overview

```
User Prompt → MCP Server Generator → MCP Server Definition
                                    ↓
                            Runtime Manager
                                    ↓
                            Tool Registry → Tool Invocation
                                    ↓
                            Execution Results
```

## Core Components

### 1. `schemas.ts` - MCP Type Definitions

Defines the core MCP primitives:

- **MCPTool**: Represents a tool that agents can invoke
- **MCPResource**: Represents external resources (database, email, auth)
- **MCPAgent**: Represents an AI agent with specific permissions
- **MCPPermission**: Controls which tools an agent can access
- **MCPServer**: The complete server definition with tools, resources, and agents

### 2. `tool.registry.ts` - Tool Management

Manages the registration and retrieval of MCP tools.

**Key Functions:**
- `registerTool(tool)` - Register a new MCP tool
- `getTool(toolId)` - Retrieve a tool by ID
- `listTools()` - List all registered tools
- `registerBuiltInTools()` - Register all built-in tools from workflow nodes

**Built-in Tools:**
- `input` - Read user input variables
- `inputValidation` - Validate input fields
- `dbFind` - Find documents in MongoDB
- `dbInsert` - Insert documents into MongoDB
- `dbUpdate` - Update documents in MongoDB
- `authMiddleware` - Verify JWT tokens
- `jwtGenerate` - Generate JWT tokens
- `emailSend` - Send emails
- `response` - Return API responses

### 3. `runtime.manager.ts` - Runtime Orchestration

Manages active MCP server runtimes and tool invocations.

**Key Functions:**
- `createRuntime(serverDefinition)` - Create a new runtime from server definition
- `startRuntime(serverId)` - Start an MCP runtime
- `stopRuntime(serverId)` - Stop an MCP runtime
- `invokeTool(serverId, toolId, input, context)` - Invoke a tool within a runtime
- `getInvocations(serverId)` - Get invocation history

**Runtime Lifecycle:**
1. Create runtime from MCP server definition
2. Start runtime (status: "running")
3. Invoke tools with context
4. Stop runtime when done

### 4. `server.generator.ts` - MCP Server Generation

Converts natural language prompts into MCP server definitions.

**Key Functions:**
- `generateMCPServer(prompt, ownerId, correlationId)` - Generate new MCP server
- `mutateMCPServer(existingServer, prompt, correlationId)` - Mutate existing server

**Process:**
1. Use AI to generate workflow from prompt
2. Convert workflow nodes to MCP tools
3. Extract resources from node configurations
4. Create MCPServer object with tools and resources

## Workflow → MCP Mapping

| Workflow Concept | MCP Equivalent |
|-----------------|----------------|
| Workflow | MCP Server |
| Node | MCP Tool |
| Node Handler | Tool Handler |
| Execution | Tool Invocation |
| Variables | Runtime Context |
| Database/Email/Auth | MCP Resources |

## Execution Flow

### Old Flow (Workflow-based)
```
Chat → Workflow Generator → Workflow JSON → Execution Engine → Direct Node Execution
```

### New Flow (MCP-based)
```
Chat → MCP Server Generator → MCP Server Definition → Runtime Manager → Tool Invocation
```

## Usage Example

```typescript
import { generateMCPServer } from './mcp/server.generator';
import { runtimeManager } from './mcp/runtime.manager';
import { registerBuiltInTools } from './mcp/tool.registry';

// 1. Register built-in tools
registerBuiltInTools();

// 2. Generate MCP server from prompt
const mcpServer = await generateMCPServer(
  "Create a user signup API",
  "user_123",
  "correlation-001"
);

// 3. Create and start runtime
const runtimeId = runtimeManager.createRuntime(mcpServer);
runtimeManager.startRuntime(runtimeId);

// 4. Invoke tools
const context = {
  vars: { input: { email: "test@example.com" } },
  headers: {},
  executionId: "exec-001",
  socketServer: socketServerInstance,
};

const result = await runtimeManager.invokeTool(
  runtimeId,
  "input",
  { variables: [{ name: "email" }] },
  context
);

// 5. Stop runtime
runtimeManager.stopRuntime(runtimeId);
```

## Database Persistence

MCP servers are persisted in MongoDB using the `MCPServer` model:

```typescript
import MCPServer from '../models/mcpServer.model';

// Save MCP server
await MCPServer.create({
  serverId: mcpServer.serverId,
  name: mcpServer.name,
  tools: mcpServer.tools,
  resources: mcpServer.resources,
  status: mcpServer.status,
  ownerId: mcpServer.ownerId,
});

// Load MCP server
const server = await MCPServer.findOne({ serverId });
```

## Feature Flag

The MCP engine can be enabled/disabled via environment variable:

```bash
USE_MCP_ENGINE=true
```

When enabled, workflow execution uses `runMCPEngine` instead of `runEngine`.

## Testing

Run the MCP infrastructure test:

```bash
npm run test:mcp
```

This validates:
- Tool registration
- MCP server generation
- Runtime creation and management
- Tool invocation
- Context handling

## Future Enhancements

1. **Agent Permissions** - Implement permission checks before tool invocation
2. **Multi-Agent Orchestration** - Support multiple agents with different tool access
3. **Archestra Integration** - Add observability and governance
4. **MCP Protocol Compliance** - Implement full MCP specification
5. **Tool Marketplace** - Allow custom tool registration
6. **Resource Connectors** - Add more resource types (APIs, databases, etc.)

## Migration Path

The system maintains backward compatibility:

1. **Phase 1** (Current): MCP infrastructure exists alongside workflow system
2. **Phase 2**: Gradual migration of endpoints to use MCP
3. **Phase 3**: Full MCP adoption, workflow system deprecated
4. **Phase 4**: Remove legacy workflow code

## API Endpoints

### New MCP Endpoints

- `POST /ai/generate-mcp-server` - Generate MCP server from prompt
- `POST /mcp/servers/:serverId/start` - Start MCP runtime
- `POST /mcp/servers/:serverId/stop` - Stop MCP runtime
- `POST /mcp/servers/:serverId/invoke` - Invoke tool in runtime

### Compatibility Endpoints

- `POST /ai/generate-workflow` - Uses MCP internally, returns workflow format
- `POST /workflows/:workflowId/execute` - Can use MCP engine via feature flag

## Contributing

When adding new tools:

1. Define tool schema in `tool.registry.ts`
2. Implement tool handler
3. Register tool in `registerBuiltInTools()`
4. Update node catalog mapping in `server.generator.ts`
5. Add tests

## License

Part of FlowForge MCP - Personal Agent Infrastructure
