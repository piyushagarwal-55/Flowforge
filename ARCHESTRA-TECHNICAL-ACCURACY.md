# Archestra Deployment - Technical Accuracy Guide

## ⚠️ Critical Distinction: Development vs Production

This document clarifies what runs where and when, to ensure technical accuracy when presenting to judges or technical audiences.

---

## The Three Environments

### 1. Development Environment (Orchestrix)

**Location**: User's local machine or Orchestrix cloud instance

**Components**:
- SupervisorAgent (routes user requests)
- BuilderAgent (AI-powered workflow generation/mutation)
- Local MCPRuntime (executes workflows for testing)
- Orchestrix UI (visual workflow editor)
- MongoDB (stores workflow definitions and deployment metadata)

**Purpose**: Workflow creation, mutation, and testing

**Execution Flow**:
```
User Input
  ↓
SupervisorAgent (routes to BuilderAgent)
  ↓
BuilderAgent (generates/mutates workflow using AI)
  ↓
Local MCPRuntime (executes for testing)
  ↓
Results displayed in UI
```

---

### 2. Deployment Process (Orchestrix → Archestra)

**What Happens**:
1. User clicks "Deploy to Archestra"
2. Orchestrix transforms MCP server into deployment package
3. Package sent to Archestra API
4. Archestra provisions infrastructure
5. Deployment metadata saved to Orchestrix MongoDB

**What Gets Sent to Archestra**:
```json
{
  "name": "Signup API",
  "description": "User registration with JWT",
  "tools": [
    {
      "toolId": "input",
      "name": "input",
      "handler": "<function code>",
      "inputSchema": {...},
      "outputSchema": {...}
    },
    {
      "toolId": "validation",
      "name": "inputValidation",
      "handler": "<function code>",
      "inputSchema": {...},
      "outputSchema": {...}
    },
    // ... more tools
  ],
  "executionOrder": ["input", "validation", "dbInsert", "jwtGenerate", "response"],
  "inputSchema": {...},
  "metadata": {
    "createdBy": "orchestrix",
    "serverId": "mcp_123",
    "createdAt": "2026-02-13T...",
    "ownerId": "user-123"
  }
}
```

**What Does NOT Get Sent**:
- ❌ SupervisorAgent
- ❌ BuilderAgent
- ❌ Local MCPRuntime
- ❌ Orchestrix UI
- ❌ MongoDB instance

---

### 3. Production Environment (Archestra)

**Location**: Archestra cloud platform

**Components**:
- Archestra MCP Runtime (executes tool graphs)
- Archestra Platform (routing, governance, observability)
- Public HTTPS endpoint
- Monitoring and logging infrastructure

**Purpose**: Production execution of deployed workflows

**Execution Flow**:
```
External Client (mobile app, website, etc.)
  ↓
POST https://api.archestra.ai/agents/agent_abc123
  ↓
Archestra Platform (routing, governance)
  ↓
Archestra MCP Runtime (loads tool graph)
  ↓
Tool Execution (in sequence):
  - input tool handler executes
  - validation tool handler executes
  - dbInsert tool handler executes
  - jwtGenerate tool handler executes
  - response tool handler executes
  ↓
Response returned to client
```

**Key Point**: NO SupervisorAgent or BuilderAgent involved. Tools execute directly in Archestra's MCP runtime.

---

## Common Misconceptions

### ❌ WRONG: "Archestra runs your SupervisorAgent"

**Reality**: SupervisorAgent only exists in Orchestrix. It's used during workflow creation and mutation, not production execution.

### ❌ WRONG: "BuilderAgent processes requests in production"

**Reality**: BuilderAgent only runs when generating or mutating workflows. It's not deployed to Archestra.

### ❌ WRONG: "Your local MCPRuntime executes in Archestra"

**Reality**: Archestra has its own MCP runtime optimized for production. Your local runtime is only for testing.

### ✅ CORRECT: "Archestra executes the tool graph directly"

**Reality**: Archestra's MCP runtime loads the tool definitions and executes them in sequence, without any agent orchestration layer.

---

## What Archestra Provides

### Infrastructure
- ✅ Scalable compute resources
- ✅ Load balancing
- ✅ Auto-scaling
- ✅ High availability

### Runtime
- ✅ MCP-compliant execution engine
- ✅ Tool graph execution
- ✅ Context management
- ✅ Error handling

### Networking
- ✅ Public HTTPS endpoints
- ✅ SSL/TLS termination
- ✅ DDoS protection
- ✅ Rate limiting

### Observability
- ✅ Request logging
- ✅ Performa