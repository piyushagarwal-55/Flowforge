# Agent Runner Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Backend running on `http://localhost:4000`
- Frontend running on `http://localhost:5000`
- MongoDB connected

### Step 1: Generate an MCP Server

Open your browser and navigate to the main page, then use the chat interface:

```
"Create a user signup API with email and password validation"
```

Or use the API directly:
```bash
curl -X POST http://localhost:4000/ai/generate-mcp-server \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a user signup API with email and password validation",
    "ownerId": "user_default"
  }'
```

You'll receive a response with a `serverId` like `mcp_1234567890_abc123`.

### Step 2: Start the Runtime

```bash
curl -X POST http://localhost:4000/mcp/servers/{serverId}/runtime/start \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": "user_default"
  }'
```

### Step 3: Open Agent Runner

Navigate to: **http://localhost:5000/agent-runner**

### Step 4: Select Your Server

Use the dropdown to select the server you just created.

### Step 5: Fill the Form

You'll see a dynamic form with fields like:
- **Email** (required)
- **Password** (required)
- **Name** (optional)

Fill them in:
```
Email: john@example.com
Password: SecurePass123!
Name: John Doe
```

### Step 6: Click "▶ Run Agent"

Watch the magic happen:

```
┌─────────────────────────────┐
│ ✓ Step 1: Input             │
│   Read user input           │
│   Duration: 5ms             │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│ ⟳ Step 2: Input Validation  │
│   Validating...             │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│ ⏸ Step 3: Database Insert   │
│   Pending...                │
└─────────────────────────────┘
```

### Step 7: View Results

After execution completes, you'll see:

```
✅ Execution Summary

Total Steps: 5
Successful: 5
Failed: 0
Duration: 72ms

✔ User created
✔ Record ID: 507f1f77bcf86cd799439011
✔ Token generated
```

## 🎯 What Just Happened?

1. **Dynamic Form Generated** - From tool schemas, no manual JSON
2. **Full Chain Executed** - All tools ran in order automatically
3. **Real-time Updates** - Via WebSocket, you saw each step
4. **Database Updated** - User was actually created in MongoDB
5. **Results Displayed** - Clear summary with all details

## 🔥 Try These Examples

### Example 1: Blog Post API
```
"Create a blog API with posts and comments"
```

### Example 2: E-commerce Cart
```
"Create a shopping cart API with add, remove, and checkout"
```

### Example 3: Task Manager
```
"Create a task management API with create, update, and delete"
```

## 🛠️ Troubleshooting

### "No servers available"
- Generate a server first using the chat interface
- Check that backend is running

### "Runtime not running"
- Click "Start Runtime" button in the UI
- Or use the API endpoint to start it

### "Form not appearing"
- Check browser console for errors
- Verify server has tools with inputSchema
- Refresh the page

### "Execution fails"
- Check backend logs for errors
- Verify MongoDB is connected
- Ensure all required fields are filled

## 📚 Learn More

- **Full Documentation**: See `AGENT-RUNNER-GUIDE.md`
- **Implementation Details**: See `SCHEMA-FORMS-IMPLEMENTATION-SUMMARY.md`
- **API Reference**: Check the guide for complete API docs

## 💡 Pro Tips

1. **Save Time**: The form remembers your last input
2. **Watch Logs**: Open browser DevTools to see Socket events
3. **Test Fast**: Use the "Run Again" button to retry
4. **Debug**: Check execution logs in the backend console

## 🎉 Success!

You've just executed a complete agent workflow without writing a single line of JSON. That's the power of schema-driven forms and one-click execution!

---

**Next Steps:**
- Create more complex workflows
- Attach agents with permissions
- Build custom tools
- Deploy to production
