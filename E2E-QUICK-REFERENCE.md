# E2E Test Quick Reference

## Run the Test

```bash
cd backend-core
npm run test:mcp:e2e
```

## Prerequisites Checklist

- [ ] MongoDB running on localhost:27017
- [ ] `.env` file configured with required variables
- [ ] Dependencies installed (`npm install`)

## Required Environment Variables

```bash
# In backend-core/.env
MONGODB_URI=mongodb://localhost:27017/flowforge-test
JWT_SECRET=test-secret-key
AI_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key
```

## Quick Start MongoDB

```bash
# Option 1: Local MongoDB
mongod --dbpath ./data/db

# Option 2: Docker
docker run -d -p 27017:27017 mongo:latest
```

## Expected Result

```
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
```

## What Gets Tested

1. ✅ MCP server generation from natural language
2. ✅ MongoDB persistence
3. ✅ Runtime lifecycle (create → start → stop)
4. ✅ Agent attachment
5. ✅ Permission enforcement
6. ✅ Authorized tool execution
7. ✅ Unauthorized tool blocking
8. ✅ Socket event emission
9. ✅ Invocation history tracking
10. ✅ Database cleanup

## Test Agents

### Sales Agent
- **ID**: `sales-agent-001`
- **Permissions**: `input`, `dbInsert`, `response`
- **Can**: Register new customers
- **Cannot**: Lookup customers

### Support Agent
- **ID**: `support-agent-001`
- **Permissions**: `input`, `dbFind`, `response`
- **Can**: Lookup customers
- **Cannot**: Register new customers

## Validation Points

The test validates:
- ✅ Server structure is valid
- ✅ Server persists to MongoDB
- ✅ Runtime starts successfully
- ✅ Agents attach to server
- ✅ Authorized tools execute
- ✅ Unauthorized tools are blocked
- ✅ Socket events are emitted
- ✅ Invocation history is tracked
- ✅ Runtime stops cleanly
- ✅ Database cleanup succeeds

## Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongosh

# If not, start it
mongod --dbpath ./data/db
```

### AI Provider Error
```bash
# Verify API key is set
cat backend-core/.env | grep GROQ_API_KEY

# If missing, add it
echo "GROQ_API_KEY=your-key-here" >> backend-core/.env
```

### Permission Test Fails
This means the permission system is not working correctly. Check:
1. Agent `allowedTools` array
2. Tool ID being invoked
3. Permission check logic in `runtime.manager.ts`

### Database Cleanup Fails
```bash
# Manually cleanup
mongosh
use flowforge-test
db.mcpservers.deleteMany({})
```

## Debug Mode

```bash
LOG_LEVEL=debug npm run test:mcp:e2e
```

## Test Duration

- **Expected**: 2-5 seconds
- **With MongoDB startup**: 5-10 seconds

## Success Indicators

✅ All 16 steps complete  
✅ Final message: "MCP INFRASTRUCTURE VERIFIED END TO END"  
✅ Exit code: 0  
✅ No error messages  

## Failure Indicators

❌ Any step fails  
❌ Error message printed  
❌ Exit code: 1  
❌ Stack trace shown  

## CI/CD Integration

```yaml
# GitHub Actions
- name: Start MongoDB
  run: docker run -d -p 27017:27017 mongo:latest

- name: Wait for MongoDB
  run: sleep 5

- name: Run E2E Test
  run: npm run test:mcp:e2e
  working-directory: backend-core
```

## Files Involved

```
backend-core/
├── src/mcp/
│   ├── schemas.ts                    (Permission types)
│   ├── runtime.manager.ts            (Permission enforcement)
│   └── tests/
│       ├── e2e.infrastructure.test.ts (E2E test)
│       └── README.md                  (Test docs)
├── package.json                       (test:mcp:e2e script)
└── .env                               (Configuration)
```

## Next Steps After Test Passes

1. ✅ Verify all steps passed
2. ✅ Check MongoDB for cleanup
3. ✅ Review socket events captured
4. ✅ Validate invocation history
5. 🔄 Integrate into CI/CD
6. 🔄 Add more test scenarios
7. 🔄 Implement Archestra integration

## Common Issues

| Issue | Solution |
|-------|----------|
| MongoDB not running | Start MongoDB: `mongod` or `docker run mongo` |
| Missing API key | Add `GROQ_API_KEY` to `.env` |
| Permission test fails | Check agent `allowedTools` array |
| Cleanup fails | Manually delete: `db.mcpservers.deleteMany({})` |
| Slow execution | Check MongoDB connection latency |

## Test Output Structure

```
=============================================================
MCP END TO END INFRASTRUCTURE TEST
=============================================================

STEP 1: [Description]
✅ [Success message]

STEP 2: [Description]
✅ [Success message]

...

STEP 16: [Description]
✅ [Success message]

=============================================================
✅ MCP INFRASTRUCTURE VERIFIED END TO END
=============================================================

📊 Test Summary:
   ✅ [Summary point 1]
   ✅ [Summary point 2]
   ...

🎯 Platform Capabilities Validated:
   ✅ [Capability 1]
   ✅ [Capability 2]
   ...
```

## Key Metrics

- **Steps**: 16
- **Agents**: 2 (Sales, Support)
- **Tools Tested**: 3 (input, dbFind, dbInsert)
- **Permission Checks**: 3 (2 allowed, 1 denied)
- **Socket Events**: 5+ (tool_start, tool_complete, permission_denied)
- **Database Operations**: 2 (create, delete)

## Documentation

- **Test Implementation**: [E2E-TEST-IMPLEMENTATION.md](./E2E-TEST-IMPLEMENTATION.md)
- **Test Documentation**: [backend-core/src/mcp/tests/README.md](./backend-core/src/mcp/tests/README.md)
- **MCP Infrastructure**: [backend-core/src/mcp/README.md](./backend-core/src/mcp/README.md)

## Support

If the test fails:
1. Check prerequisites (MongoDB, .env)
2. Review error message and stack trace
3. Enable debug logging: `LOG_LEVEL=debug`
4. Check [Troubleshooting](#troubleshooting) section
5. Review test documentation

## Status

✅ **Implementation Complete**  
✅ **All Tests Passing**  
✅ **Documentation Complete**  
✅ **Ready for Production**  
