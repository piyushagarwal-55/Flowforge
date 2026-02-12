# MCP Infrastructure E2E Testing

## Overview

This directory contains end-to-end (E2E) tests for the MCP infrastructure. These are NOT unit tests - they are complete system-level validations that simulate real platform usage.

## Test Files

### `e2e.infrastructure.test.ts`

Comprehensive end-to-end test that validates the entire MCP infrastructure stack:

1. **MCP Server Generation** - Natural language → MCP server
2. **Database Persistence** - MongoDB storage and retrieval
3. **Runtime Management** - Create, start, stop lifecycles
4. **Agent Management** - Multi-agent attachment
5. **Permission Enforcement** - Tool access control
6. **Tool Execution** - Authorized and unauthorized calls
7. **Observability** - Socket.io event capture
8. **Invocation Tracking** - History and audit trail

## Running Tests

### Run E2E Test
```bash
cd backend-core
npm run test:mcp:e2e
```

### Prerequisites

1. **MongoDB Running**
   ```bash
   # Local MongoDB
   mongod --dbpath ./data/db
   
   # Or use Docker
   docker run -d -p 27017:27017 mongo:latest
   ```

2. **Environment Variables**
   ```bash
   # Required in .env
   MONGODB_URI=mongodb://localhost:27017/flowforge-test
   JWT_SECRET=test-secret-key
   AI_PROVIDER=groq
   GROQ_API_KEY=your-groq-api-key
   ```

3. **Dependencies Installed**
   ```bash
   npm install
   ```

## Test Scenario

The E2E test simulates a complete platform workflow:

### Scenario: Customer Management System

**Agents:**
- **Sales Agent** - Can register new customers (dbInsert, response)
- **Support Agent** - Can lookup customers (dbFind, response)

**Test Flow:**

1. Generate MCP server for "customer management API"
2. Persist server to MongoDB
3. Create runtime and start it
4. Create two agents with different permissions
5. Attach agents to the server
6. Sales agent successfully inserts customer (authorized)
7. Support agent successfully finds customer (authorized)
8. Support agent fails to insert customer (unauthorized)
9. Validate all socket events were emitted
10. Check invocation history
11. Stop runtime
12. Cleanup database

## Expected Output

```
=============================================================
MCP END TO END INFRASTRUCTURE TEST
=============================================================

STEP 1: Register built-in MCP tools
✅ Built-in tools registered

STEP 2: Connect to MongoDB
✅ MongoDB connected

STEP 3: Generate MCP server from natural language prompt
   Prompt: "Create a customer management API with user lookup and registration"
✅ MCP Server generated:
   Server ID: mcp_1234567890_abc123
   Name: Customer Management API
   Tools: 4
   Resources: 2
   Tools: input, dbFind, dbInsert, response

STEP 4: Persist MCP server to MongoDB
✅ MCP server persisted to MongoDB

STEP 5: Create MCP runtime
✅ Runtime created: mcp_1234567890_abc123

STEP 6: Start runtime
✅ Runtime started: true

STEP 7: Create two agents
✅ Agents created:
   - Sales Agent (sales-agent-001)
     Allowed tools: input, dbInsert, response
   - Support Agent (support-agent-001)
     Allowed tools: input, dbFind, response

STEP 8: Attach agents to MCP server
✅ Agents attached:
   - Sales Agent: true
   - Support Agent: true

STEP 9: Invoke authorized tool (Sales Agent → dbInsert)
   [Socket Event] tool_start: ...
   [Socket Event] tool_complete: ...
✅ Authorized tool invocation succeeded
   Agent: Sales Agent
   Tool: dbInsert
   Result: Success

STEP 10: Validate socket event logs
✅ Socket events captured:
   - tool_start events: 1
   - tool_complete events: 1

STEP 11: Invoke authorized tool (Support Agent → dbFind)
   [Socket Event] tool_start: ...
   [Socket Event] tool_complete: ...
✅ Authorized tool invocation succeeded
   Agent: Support Agent
   Tool: dbFind
   Result: Found

STEP 12: Attempt forbidden tool call (Support Agent → dbInsert)
   [Socket Event] permission_denied: ...
✅ Permission denied as expected
   Agent: Support Agent
   Tool: dbInsert
   Error: Agent support-agent-001 is not authorized to use tool dbInsert

STEP 13: Validate permission denied socket event
✅ Permission denied event captured:
   - Events: 1
   - Agent: support-agent-001
   - Tool: dbInsert

STEP 14: Validate invocation history
✅ Invocation history retrieved:
   - Total invocations: 2
   - Successful: 2
   - Failed: 0

STEP 15: Stop runtime
✅ Runtime stopped: true

STEP 16: Cleanup database
✅ Database cleaned up

=============================================================
✅ MCP INFRASTRUCTURE VERIFIED END TO END
=============================================================

📊 Test Summary:
   ✅ MCP server generated and persisted
   ✅ Runtime created and started
   ✅ Agents attached (Sales Agent, Support Agent)
   ✅ Authorized tools executed successfully
   ✅ Unauthorized tool blocked by permissions
   ✅ Socket events emitted and captured
   ✅ Invocation history tracked
   ✅ Runtime stopped cleanly
   ✅ Database cleanup completed

🎯 Platform Capabilities Validated:
   ✅ MCP server generation from natural language
   ✅ Runtime lifecycle management
   ✅ Agent-based access control
   ✅ Permission enforcement
   ✅ Tool invocation with context
   ✅ Real-time observability
   ✅ Database persistence
```

## What Gets Tested

### ✅ MCP Server Generation
- Natural language prompt → MCP server definition
- Tool extraction from workflow nodes
- Resource identification
- Server metadata

### ✅ Database Persistence
- MongoDB connection
- Server document creation
- Query and retrieval
- Cleanup on completion

### ✅ Runtime Management
- Runtime creation from server definition
- Start/stop lifecycle
- Status tracking
- Runtime retrieval

### ✅ Agent Management
- Agent creation with permissions
- Agent attachment to servers
- Multi-agent support
- Agent metadata tracking

### ✅ Permission Enforcement
- Tool access control
- Permission checking before invocation
- Denial of unauthorized access
- Error handling for permission violations

### ✅ Tool Execution
- Authorized tool invocation
- Context passing
- Variable resolution
- Result handling

### ✅ Observability
- Socket.io event emission
- Event capture and validation
- Real-time logging
- Event type verification

### ✅ Invocation Tracking
- History recording
- Success/failure tracking
- Duration measurement
- Agent attribution

## Test Architecture

### Mock Socket Server

The test uses a mock Socket.io server that captures all events:

```typescript
class MockSocketServer {
  public events: any[] = [];

  emitExecutionLog(executionId: string, data: any) {
    this.events.push({ executionId, ...data });
  }

  getEvents(type?: string): any[] {
    return type 
      ? this.events.filter(e => e.type === type)
      : this.events;
  }
}
```

### Real Components

The test uses REAL implementations (no mocks):
- ✅ Real MCP runtime manager
- ✅ Real tool registry
- ✅ Real MongoDB connection
- ✅ Real permission system
- ✅ Real tool handlers

This ensures the test validates actual platform behavior.

## Validation Points

The test explicitly validates:

1. **Server Structure** - serverId, name, tools, resources exist
2. **Persistence** - Document exists in MongoDB after save
3. **Runtime Status** - Status transitions (created → running → stopped)
4. **Agent Attachment** - Agents present in runtime.agents array
5. **Permission Success** - Authorized tools execute without error
6. **Permission Denial** - Unauthorized tools throw PermissionDeniedError
7. **Socket Events** - tool_start, tool_complete, permission_denied emitted
8. **Invocation History** - All invocations recorded with metadata
9. **Cleanup** - Database documents removed after test

## Failure Handling

If any step fails:
1. Error message printed with stack trace
2. Database cleanup attempted
3. Process exits with code 1

This ensures:
- No test pollution
- Clear failure reporting
- Clean test environment

## Adding New Tests

To add new E2E tests:

1. Create new test file in this directory
2. Follow the same structure:
   - Clear step-by-step console output
   - Explicit validation at each step
   - Real component usage (no mocks)
   - Database cleanup
3. Add script to package.json
4. Document in this README

## Debugging

### Enable Debug Logging
```bash
LOG_LEVEL=debug npm run test:mcp:e2e
```

### Check MongoDB State
```bash
# Connect to MongoDB
mongosh

# Switch to test database
use flowforge-test

# Check MCP servers
db.mcpservers.find().pretty()
```

### Inspect Socket Events
The test captures all socket events in `mockSocketServer.events`. Add logging:

```typescript
console.log("All events:", JSON.stringify(mockSocketServer.events, null, 2));
```

## CI/CD Integration

This test can be integrated into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run E2E Tests
  run: |
    docker run -d -p 27017:27017 mongo:latest
    sleep 5
    npm run test:mcp:e2e
```

## Performance

Typical test execution time:
- **Local**: 2-5 seconds
- **CI**: 5-10 seconds (includes MongoDB startup)

## Troubleshooting

### "MongoDB connection failed"
**Solution**: Ensure MongoDB is running on localhost:27017

### "AI provider error"
**Solution**: Set valid GROQ_API_KEY in .env

### "Tool not found in registry"
**Solution**: Ensure registerBuiltInTools() is called

### "Permission check failed"
**Solution**: Verify agent.allowedTools includes the tool being invoked

## Future Enhancements

Planned additions:
- [ ] Multi-server orchestration test
- [ ] Agent-to-agent communication test
- [ ] Resource connector validation
- [ ] Archestra integration test
- [ ] Performance benchmarking
- [ ] Concurrent execution test
- [ ] Error recovery test

## Contributing

When modifying the E2E test:
1. Maintain clear step-by-step output
2. Add explicit validation for new features
3. Ensure cleanup always runs
4. Update this README
5. Test locally before committing

## License

Part of FlowForge MCP - Personal Agent Infrastructure
