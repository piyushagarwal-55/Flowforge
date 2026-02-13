# Agent Runner Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (No JSON Required!)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DYNAMIC FORM GENERATOR                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Input Schema → Form Fields                              │  │
│  │  • string → text input                                   │  │
│  │  • number → number input                                 │  │
│  │  • boolean → checkbox                                    │  │
│  │  • enum → dropdown                                       │  │
│  │  • object/array → JSON textarea                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ONE-CLICK EXECUTION                          │
│                    POST /run-agent                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTION ENGINE                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  For each tool in executionOrder:                        │  │
│  │    1. Invoke tool                                        │  │
│  │    2. Emit progress event                                │  │
│  │    3. Feed output to context                             │  │
│  │    4. Continue or abort on error                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VISUAL PIPELINE                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Step 1: Input           [✓] Success  5ms                │  │
│  │  Step 2: Validation      [✓] Success  12ms               │  │
│  │  Step 3: DB Insert       [⟳] Running                     │  │
│  │  Step 4: JWT Generate    [⏸] Pending                     │  │
│  │  Step 5: Response        [⏸] Pending                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESULT SUMMARY                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ✅ Total Steps: 5                                       │  │
│  │  ✅ Successful: 5                                        │  │
│  │  ❌ Failed: 0                                            │  │
│  │  ⏱️  Duration: 72ms                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐
│   User Input │
│  (Form Data) │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Frontend: AgentRunner Component                        │
│  • Validates input                                       │
│  • Calls runAgent() API                                  │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Backend: POST /mcp/servers/:serverId/run-agent          │
│  • Creates execution context                             │
│  • Iterates through executionOrder                       │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Runtime Manager: invokeTool()                           │
│  • Finds tool handler                                    │
│  • Executes with context                                 │
│  • Returns output                                        │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Socket.io: Real-time Events                             │
│  • agent:step:start                                      │
│  • agent:step:complete                                   │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Frontend: AgentExecutionPipeline                        │
│  • Updates step status                                   │
│  • Shows progress                                        │
│  • Displays output/errors                                │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│ Final Results│
│  (Summary)   │
└──────────────┘
```

## Component Architecture

### Backend Components

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server Model                         │
│  • serverId                                                 │
│  • tools: MCPTool[]                                         │
│  • executionOrder: string[]  ← NEW                          │
│  • status                                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCPTool Schema                           │
│  • toolId                                                   │
│  • name                                                     │
│  • inputSchema  ← Required                                  │
│  • outputSchema ← Required (NEW)                            │
│  • handler                                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Endpoints                            │
│  • GET /servers/:id/tools  ← NEW                            │
│  • POST /servers/:id/run-agent  ← NEW                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Runtime Manager                          │
│  • createRuntime()                                          │
│  • startRuntime()                                           │
│  • invokeTool()                                             │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Components

```
┌─────────────────────────────────────────────────────────────┐
│              AgentRunner (Main Component)                   │
│  • Fetches tool schemas                                     │
│  • Manages execution state                                  │
│  • Coordinates child components                             │
└─────────────────────────────────────────────────────────────┘
                    │                    │
        ┌───────────┴───────────┐        │
        ▼                       ▼        ▼
┌──────────────┐    ┌──────────────────────────┐
│DynamicToolForm│    │AgentExecutionPipeline    │
│• Schema→Form │    │• Visual steps            │
│• Validation  │    │• Real-time updates       │
│• Submit      │    │• Socket.io integration   │
└──────────────┘    └──────────────────────────┘
```

## Execution Flow

### 1. Initialization Phase
```
User opens /agent-runner
    ↓
Fetch servers (GET /mcp/servers)
    ↓
Select server
    ↓
Fetch tool schemas (GET /servers/:id/tools)
    ↓
Generate dynamic form from inputSchema
```

### 2. Input Phase
```
User fills form
    ↓
Client-side validation
    ↓
User clicks "Run Agent"
    ↓
Call runAgent() API
```

### 3. Execution Phase
```
Backend receives request
    ↓
Create execution context
    ↓
For each tool in executionOrder:
    ├─ Emit "step:start" event
    ├─ Invoke tool handler
    ├─ Update context with output
    ├─ Emit "step:complete" event
    └─ Continue or abort
    ↓
Return final results
```

### 4. Visualization Phase
```
Frontend receives Socket events
    ↓
Update pipeline UI
    ↓
Show step status (pending/running/success/failed)
    ↓
Display output/errors
    ↓
Show final summary
```

## Schema-to-Form Mapping

```
┌─────────────────────────────────────────────────────────────┐
│                    Input Schema                             │
└─────────────────────────────────────────────────────────────┘
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "description": "User email address"
    },
    "password": {
      "type": "string",
      "description": "User password"
    },
    "age": {
      "type": "number",
      "description": "User age"
    },
    "role": {
      "type": "string",
      "enum": ["admin", "user", "guest"]
    },
    "active": {
      "type": "boolean"
    }
  },
  "required": ["email", "password"]
}

                    ↓ TRANSFORMS TO ↓

┌─────────────────────────────────────────────────────────────┐
│                    Dynamic Form                             │
└─────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ Email *                                                  │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [text input]                                         │ │
│ └──────────────────────────────────────────────────────┘ │
│ User email address                                       │
├──────────────────────────────────────────────────────────┤
│ Password *                                               │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [text input]                                         │ │
│ └──────────────────────────────────────────────────────┘ │
│ User password                                            │
├──────────────────────────────────────────────────────────┤
│ Age                                                      │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [number input]                                       │ │
│ └──────────────────────────────────────────────────────┘ │
│ User age                                                 │
├──────────────────────────────────────────────────────────┤
│ Role                                                     │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [Select...        ▼]                                 │ │
│ │  - admin                                             │ │
│ │  - user                                              │ │
│ │  - guest                                             │ │
│ └──────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│ ☐ Active                                                 │
└──────────────────────────────────────────────────────────┘
```

## Real-time Communication

```
┌──────────────┐                    ┌──────────────┐
│   Frontend   │                    │   Backend    │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │  1. Connect Socket.io             │
       ├──────────────────────────────────>│
       │                                   │
       │  2. Join execution room           │
       ├──────────────────────────────────>│
       │                                   │
       │  3. POST /run-agent               │
       ├──────────────────────────────────>│
       │                                   │
       │  4. agent:step:start (Step 1)     │
       │<──────────────────────────────────┤
       │                                   │
       │  5. agent:step:complete (Step 1)  │
       │<──────────────────────────────────┤
       │                                   │
       │  6. agent:step:start (Step 2)     │
       │<──────────────────────────────────┤
       │                                   │
       │  7. agent:step:complete (Step 2)  │
       │<──────────────────────────────────┤
       │                                   │
       │  ... (more steps)                 │
       │                                   │
       │  8. HTTP Response (Final Results) │
       │<──────────────────────────────────┤
       │                                   │
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Scenarios                          │
└─────────────────────────────────────────────────────────────┘

1. Validation Error (Client-side)
   ┌──────────────────────────────────────┐
   │ Email *                              │
   │ ┌──────────────────────────────────┐ │
   │ │ invalid-email                    │ │
   │ └──────────────────────────────────┘ │
   │ ❌ Invalid email format              │
   └──────────────────────────────────────┘
   → Prevents submission

2. Tool Execution Error (Server-side)
   ┌──────────────────────────────────────┐
   │ ❌ Step 3: Database Insert           │
   │    Failed                            │
   │    Error: Duplicate email            │
   └──────────────────────────────────────┘
   → Aborts chain, shows error

3. Runtime Not Started
   ┌──────────────────────────────────────┐
   │ ⚠️  Runtime is not running           │
   │    Start it to execute agents        │
   │    [Start Runtime]                   │
   └──────────────────────────────────────┘
   → Prompts user to start

4. Permission Denied
   ┌──────────────────────────────────────┐
   │ ❌ Permission Denied                 │
   │    Agent not authorized for tool     │
   └──────────────────────────────────────┘
   → Shows permission error
```

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────┐
│                    Optimization Points                      │
└─────────────────────────────────────────────────────────────┘

1. Schema Caching
   • Cache tool schemas on frontend
   • Reduce API calls

2. Socket Connection Reuse
   • Single connection per session
   • Room-based event filtering

3. Lazy Loading
   • Load pipeline component only when needed
   • Reduce initial bundle size

4. Execution Context
   • Reuse context across tools
   • Avoid redundant data passing

5. Database Queries
   • Index on serverId and ownerId
   • Efficient tool lookup
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
└─────────────────────────────────────────────────────────────┘

1. Owner Verification
   • All requests require ownerId
   • Server ownership checked

2. Agent Permissions
   • Tools restricted by allowedTools
   • Permission check before execution

3. Input Validation
   • Schema-based validation
   • Type checking
   • Required field enforcement

4. Runtime Isolation
   • Each server has isolated runtime
   • Context separation

5. Error Sanitization
   • No stack traces to client
   • Safe error messages
```

---

This architecture enables:
- ✅ Zero JSON knowledge required
- ✅ Real-time visual feedback
- ✅ Type-safe execution
- ✅ Scalable design
- ✅ Production-ready security
