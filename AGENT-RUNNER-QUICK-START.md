# Agent Runner Quick Start Guide

## 🚀 What Was Fixed

### Critical Fix: Context Structure
The input tool was failing because the context structure didn't match expectations. This has been fixed.

**Before (Broken)**:
```typescript
context.vars.input = { email, password, name }
```

**After (Fixed)**:
```typescript
context.vars.input.input = { email, password, name }
```

### Runtime Status Fix
The agent runner page was checking the wrong field for runtime status. Now it correctly checks `runtimeStatus` instead of `status`.

---

## 🎯 How to Use

### 1. Start Backend
```bash
cd backend-core
bun run dev
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Create MCP Server (if needed)
Go to the chat interface and type:
```
Create a user registration API
```

### 4. Start Runtime
In the dashboard, find your server and click the "Start Runtime" button if it's not already running.

### 5. Run Agent
1. Click the "Run" button on your server (appears when runtime is running)
2. Fill in the form:
   - Email: `test@example.com`
   - Password: `password123` (min 8 chars)
   - Name: `Test User` (optional)
3. Click "Continue"
4. Click "Run Agent"
5. Watch the pipeline execute in real-time!

---

## 🧪 Test the Fix

Run the test script:
```bash
cd backend-core
bun run test-agent-runner-flow.ts
```

This will:
- ✅ List all MCP servers
- ✅ Fetch tool schemas
- ✅ Start runtime if needed
- ✅ Execute agent with test data
- ✅ Show step-by-step results

---

## 🔍 Verify User Creation

Check MongoDB:
```bash
mongosh
use orchestrix
db.users.find().pretty()
```

You should see:
```json
{
  "_id": ObjectId("..."),
  "email": "test@example.com",
  "password": "$2a$10$...", // Hashed password
  "name": "Test User",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

---

## 🐛 Troubleshooting

### "Continue" Button Not Working
1. Check browser console for errors
2. Verify form validation is passing (email format, password length)
3. Check that `onSubmit` is being called

### "Run" Button Not Appearing
1. Verify runtime status: `GET /mcp/servers?ownerId=user_default`
2. Check that `runtimeStatus === 'running'`
3. Start runtime if needed

### Agent Execution Fails
1. Check backend logs for errors
2. Verify MongoDB is running
3. Check that all environment variables are set
4. Verify Socket.io connection is established

### Input Tool Error
This should now be fixed! If you still see errors:
1. Check that context structure is: `context.vars.input.input`
2. Verify the fix is applied in `backend-core/src/routes/mcp.routes.ts` line ~456

---

## 📝 What Each Component Does

### Backend
- **mcp.routes.ts**: Handles API requests, creates proper context structure
- **tool.registry.ts**: Defines tool handlers, extracts data from context
- **runtime.manager.ts**: Manages MCP runtime lifecycle
- **socket.ts**: Handles real-time updates via Socket.io

### Frontend
- **SimpleInputForm**: User-friendly form with validation
- **AgentRunner**: Orchestrates the flow (form → run button → execution)
- **AgentExecutionPipeline**: Real-time visualization of execution steps
- **MCPServerList**: Shows servers with "Run" button

---

## ✅ Success Checklist

- [ ] Backend running on port 4000
- [ ] Frontend running on port 5000
- [ ] MongoDB running on port 27017
- [ ] MCP server created
- [ ] Runtime started (status: running)
- [ ] "Run" button visible on dashboard
- [ ] Form accepts input and shows "Continue" button
- [ ] "Run Agent" button appears after form submission
- [ ] Pipeline executes all steps
- [ ] User created in MongoDB
- [ ] Password is hashed
- [ ] Execution summary displays

---

## 🎉 Expected Result

When everything works:
1. Form submission → "Run Agent" button appears
2. Click "Run Agent" → Pipeline starts
3. Steps execute in order:
   - ⏳ Input → ✅ Success
   - ⏳ Validation → ✅ Success
   - ⏳ Create User → ✅ Success
   - ⏳ Response → ✅ Success
4. Summary shows:
   - Total Steps: 4
   - Successful: 4
   - Failed: 0
   - Duration: ~500ms
5. User exists in MongoDB with hashed password

---

## 📞 Need Help?

If issues persist:
1. Check `AGENT-RUNNER-FIX-SUMMARY.md` for detailed information
2. Run `test-agent-runner-flow.ts` to diagnose issues
3. Check backend logs: `tail -f backend-core/logs/app.log`
4. Check browser console for frontend errors
5. Verify all environment variables are set correctly

---

## 🔗 Related Files

- `backend-core/src/routes/mcp.routes.ts` - Context structure fix
- `backend-core/src/mcp/tool.registry.ts` - Input tool handler
- `frontend/app/agent-runner/page.tsx` - Runtime status fix
- `frontend/components/SimpleInputForm.tsx` - User input form
- `frontend/components/AgentRunner.tsx` - Main runner component
- `frontend/components/AgentExecutionPipeline.tsx` - Pipeline visualization

---

## 🚀 Next Steps

Once everything is working:
1. Try creating different types of MCP servers
2. Customize the input form for different use cases
3. Add more tools to the execution pipeline
4. Implement error recovery and retry logic
5. Add execution history and logs
6. Build custom agents with specific permissions
