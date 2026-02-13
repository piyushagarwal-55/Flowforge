# How to Use the MCP Platform

## What is This Platform?

FlowForge MCP Platform lets you:
1. **Generate backend APIs** from natural language descriptions
2. **Control AI agents** that can execute tools
3. **Monitor everything** in real-time

Think of it as: **"Describe what you want → Get a working API → Control it with agents"**

---

## Step-by-Step Usage Guide

### 1. Generate an MCP Server (Your API)

**What it does**: Creates a backend API with tools based on your description.

**How to do it**:
1. Go to the home page (chat interface)
2. Enter a prompt like:
   - "Create a user registration API"
   - "Build a blog system with posts and comments"
   - "Make an e-commerce checkout flow"
3. Wait ~5-10 seconds
4. You'll be redirected to the MCP Dashboard

**What you get**:
- An MCP Server with multiple tools (like `input`, `dbInsert`, `response`)
- An agent automatically created and attached
- A runtime ready to start

---

### 2. Start the Runtime

**What it does**: Activates your MCP server so tools can be executed.

**How to do it**:
1. On the MCP Dashboard, find your server in the left panel
2. Click on it to select it
3. Click the **"Start Runtime"** button
4. Watch the status change to "running"
5. See "Runtime Started" appear in the Activity Feed

**Why you need this**: Tools can only be invoked when the runtime is running.

---

### 3. Invoke Tools (Use Your API)

**What it does**: Executes individual tools (like database operations, sending emails, etc.)

**How to do it**:
1. Make sure runtime is running (green status)
2. In the **Tool Invocation** panel (center):
   - Select a tool from the dropdown (e.g., "Database Insert")
   - Review the pre-filled JSON input (you can edit it)
   - Click **"Invoke Tool"**
3. See the result appear below
4. Watch the Activity Feed show:
   - 🔧 Tool Invoked
   - ✅ Tool Completed

**Example Tools**:

**Database Insert** - Add data to database:
```json
{
  "collection": "users",
  "data": {
    "email": "john@example.com",
    "name": "John Doe",
    "createdAt": "2026-02-12T06:00:00.000Z"
  }
}
```

**Database Find** - Query database:
```json
{
  "collection": "users",
  "filters": { "email": "john@example.com" },
  "findType": "one"
}
```

**Input** - Define input variables:
```json
{
  "variables": [
    { "name": "email" },
    { "name": "password" }
  ]
}
```

**Response** - Send API response:
```json
{
  "status": 200,
  "body": {
    "success": true,
    "message": "User created successfully"
  }
}
```

---

### 4. Monitor Activity

**What it does**: Shows real-time events from your MCP server.

**How to use it**:
- Look at the **Activity Feed** (right panel)
- Events update every 2 seconds
- You'll see:
  - ▶️ Runtime Started
  - 🔧 Tool Invoked
  - ✅ Tool Completed
  - ⏹️ Runtime Stopped
  - 🚫 Permission Denied (if agent lacks permission)

**Why it's useful**: Debug issues, monitor performance, audit agent actions.

---

### 5. View Topology

**What it does**: Shows the relationship between agents, servers, and tools.

**How to read it**:
- **Agents** (blue) - AI agents that can invoke tools
- **Servers** (green) - Your MCP servers (APIs)
- **Tools** (purple) - Individual operations (dbInsert, response, etc.)
- **Connections** - Shows which agent can access which server/tools

**Example**:
```
Auto Agent → User Management API → [input, dbInsert, dbFind, response]
```

This means "Auto Agent" can use all 4 tools on the "User Management API" server.

---

## Real-World Use Cases

### Use Case 1: User Registration System

**Prompt**: "Create a user registration API with email validation"

**Generated Tools**:
- `input` - Collect email and password
- `inputValidation` - Validate email format
- `dbInsert` - Save user to database
- `response` - Return success message

**How to use**:
1. Start runtime
2. Invoke `input` with email/password
3. Invoke `inputValidation` to check format
4. Invoke `dbInsert` to save user
5. Invoke `response` to send confirmation

### Use Case 2: Blog Post Creation

**Prompt**: "Build a blog API with post creation"

**Generated Tools**:
- `input` - Collect title, content, author
- `dbInsert` - Save post to database
- `response` - Return post ID

**How to use**:
1. Start runtime
2. Invoke `input` with post data
3. Invoke `dbInsert` to save
4. Invoke `response` to confirm

### Use Case 3: E-commerce Checkout

**Prompt**: "Create a checkout API with payment processing"

**Generated Tools**:
- `input` - Collect cart items, payment info
- `inputValidation` - Validate payment details
- `dbInsert` - Create order record
- `emailSend` - Send confirmation email
- `response` - Return order confirmation

---

## Understanding Agents

**What are agents?**
- AI entities that can invoke tools on your behalf
- Have specific permissions (which tools they can use)
- Attached to MCP servers

**Why use agents?**
- **Security**: Control what operations can be performed
- **Governance**: Audit who did what
- **Automation**: Agents can execute workflows automatically

**Agent Permissions**:
- When you generate an MCP server, an agent is auto-created
- The agent gets permission to use ALL tools on that server
- You can edit permissions later (Phase 3 feature)

---

## Common Questions

### Q: What happens when I invoke a tool?
**A**: The tool executes its operation (database query, email send, etc.) and returns a result. You'll see the result in the UI and events in the Activity Feed.

### Q: Can I invoke tools without starting the runtime?
**A**: No, the runtime must be "running" for tools to work. This is a safety feature.

### Q: What if a tool fails?
**A**: You'll see an error message in the Tool Invocation panel and an error event in the Activity Feed.

### Q: Can I create multiple MCP servers?
**A**: Yes! Just go back to chat and enter a new prompt. Each server is independent.

### Q: What's the difference between a server and a tool?
**A**: 
- **Server** = Your entire API (like "User Management API")
- **Tool** = Individual operation (like "Database Insert")
- One server contains multiple tools

### Q: Can I edit the tools after generation?
**A**: Not yet (Phase 3 feature). Currently, tools are generated based on your prompt and cannot be modified.

### Q: What databases does this connect to?
**A**: MongoDB (configured in backend). Tools like `dbInsert`, `dbFind`, `dbUpdate` interact with MongoDB.

---

## Tips & Best Practices

### 1. **Be Specific in Prompts**
❌ Bad: "Create an API"
✅ Good: "Create a user registration API with email validation and database storage"

### 2. **Start Simple**
Start with basic operations, then create more complex servers as you learn.

### 3. **Monitor the Activity Feed**
Always check the Activity Feed after invoking tools to ensure they executed successfully.

### 4. **Test Tools Individually**
Don't try to invoke all tools at once. Test each one separately to understand what it does.

### 5. **Use Realistic Data**
When invoking tools, use realistic test data (real email formats, valid dates, etc.)

---

## Troubleshooting

### Problem: "Runtime must be running to invoke tools"
**Solution**: Click "Start Runtime" button first.

### Problem: Tool invocation fails with "Permission denied"
**Solution**: The agent doesn't have permission for that tool. This shouldn't happen with auto-created agents, but if it does, check agent permissions.

### Problem: "Tool not found in registry"
**Solution**: The tool wasn't registered properly. Try stopping and starting the runtime.

### Problem: Database operations fail
**Solution**: Check that MongoDB is running and connected (see backend logs).

### Problem: Activity Feed not updating
**Solution**: Refresh the page. The feed polls every 2 seconds, so there may be a slight delay.

---

## What's Next?

After you're comfortable with the basics:

1. **Create Complex Servers**: Try prompts with multiple operations
2. **Chain Tool Invocations**: Invoke tools in sequence to build workflows
3. **Monitor Performance**: Use Activity Feed to see execution times
4. **Explore Topology**: Understand the relationships between components

---

## Architecture Overview

```
You (User)
    ↓
Chat Interface → Generate MCP Server
    ↓
MCP Dashboard
    ├── Start Runtime
    ├── Invoke Tools → Execute Operations
    └── Monitor Events → See Results
```

**Data Flow**:
1. Prompt → AI generates server definition
2. Server created with tools
3. Agent created and attached
4. Runtime started
5. Tools invoked by agent
6. Results returned
7. Events logged

---

## Summary

**The MCP Platform lets you**:
- 🎯 Generate APIs from descriptions
- 🤖 Control agents with permissions
- 🔧 Execute tools (database, email, etc.)
- 📊 Monitor everything in real-time
- 🔗 Visualize relationships

**Key Concepts**:
- **MCP Server** = Your API
- **Tools** = Individual operations
- **Agents** = Entities that invoke tools
- **Runtime** = Execution environment
- **Activity Feed** = Real-time event log

**Basic Workflow**:
1. Describe what you want
2. Start the runtime
3. Invoke tools
4. See results

That's it! You now have a complete understanding of how to use the MCP Platform. 🚀
