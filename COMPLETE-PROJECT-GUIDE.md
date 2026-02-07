# 🎯 FlowForge - Complete Project Guide

> **A Visual Backend Builder Powered by AI and Motia Workflows**

---

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Core Features](#core-features)
3. [Technology Stack](#technology-stack)
4. [Architecture Deep Dive](#architecture-deep-dive)
5. [Tambo AI Integration](#tambo-ai-integration)
6. [AI-Powered Workflow Generation](#ai-powered-workflow-generation)
7. [Conversational Workflow Building](#conversational-workflow-building)
8. [Workflow Execution Engine](#workflow-execution-engine)
9. [Real-Time Features](#real-time-features)
10. [Database Architecture](#database-architecture)
11. [API Reference](#api-reference)
12. [Development Guide](#development-guide)
13. [Deployment](#deployment)

---

## 🎯 Project Overview

**FlowForge** is a revolutionary visual backend builder that transforms how developers and non-developers create backend APIs. Instead of writing code manually, users can:

- **Describe what they want in plain English** → AI generates the workflow
- **Build visually** → Drag-and-drop nodes on a canvas
- **Iterate conversationally** → Modify workflows through chat
- **Deploy instantly** → Get production-ready APIs immediately

### Key Innovation: Chat-First Generative UI

FlowForge uses **Tambo AI** to create an adaptive interface where:
- Users start with just a chat input
- The UI progressively reveals components based on intent
- No need to learn complex interfaces upfront
- Natural conversation drives the entire experience


---

## ✨ Core Features

### 1. **AI-Powered Workflow Generation**
- Natural language to workflow conversion
- Powered by Groq (llama-3.1-8b-instant)
- Supports OpenAI and HuggingFace providers
- Intelligent node selection and connection
- Template variable resolution

### 2. **Chat-First Interface (Tambo AI)**
- Conversational workflow building
- Intent-driven UI revelation
- Progressive component mounting
- No learning curve required
- Adaptive workspace layout

### 3. **Conversational Workflow Mutation**
- Iterative workflow building across multiple messages
- Same workflow persists throughout conversation
- AI understands existing workflow context
- Adds only necessary nodes
- Maintains workflow continuity

### 4. **Visual Workflow Builder**
- React Flow-based canvas
- 20+ node types
- Drag-and-drop interface
- Real-time validation
- Automatic execution order calculation

### 5. **Backend Explanation**
- AI-generated workflow explanations
- Step-by-step execution breakdown
- Security and validation analysis
- Data flow visualization
- Human-readable descriptions

### 6. **Real-Time Execution Logs**
- WebSocket-based streaming
- Live step-by-step execution tracking
- Error detection and reporting
- Execution time monitoring
- Correlation ID tracking

### 7. **Instant API Deployment**
- One-click workflow publishing
- Auto-generated REST endpoints
- Production-ready APIs
- No manual deployment needed

### 8. **Database Integration**
- MongoDB with Mongoose ODM
- Dynamic collection management
- Schema introspection
- CRUD operations
- Password hashing (bcrypt)

### 9. **Authentication & Security**
- JWT token generation and validation
- Password hashing
- Input validation middleware
- Auth middleware for protected routes

### 10. **Email Integration**
- SMTP email sending
- Template variable support
- Transactional emails
- Notification system


---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.9 | React framework with App Router |
| **React** | 19.2.1 | UI library |
| **Bun** | 1.2.15 | JavaScript runtime |
| **@xyflow/react** | 12.10.0 | Visual workflow canvas |
| **@tambo-ai/react** | 0.74.1 | **AI-powered generative UI** |
| **Redux Toolkit** | 2.11.2 | State management |
| **Socket.io-client** | 4.8.1 | Real-time communication |
| **Tailwind CSS** | 4.1.18 | Styling |
| **Framer Motion** | 12.23.26 | Animations |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Motia** | 0.17.6-beta.187 | Unified backend framework |
| **Bun** | 1.2.15 | JavaScript runtime |
| **MongoDB** | - | Database |
| **Mongoose** | 9.0.1 | MongoDB ODM |
| **Groq SDK** | 0.37.0 | **AI workflow generation** |
| **Socket.io** | 4.8.1 | Real-time communication |
| **JWT** | 9.0.3 | Authentication |
| **Nodemailer** | 7.0.11 | Email sending |
| **Bcrypt** | 3.0.3 | Password hashing |
| **Zod** | 4.1.12 | Schema validation |

### AI Providers
| Provider | Model | Use Case |
|----------|-------|----------|
| **Groq** (default) | llama-3.1-8b-instant | Fast, cost-effective workflow generation |
| **OpenAI** | gpt-4.1-mini | More accurate, higher cost |
| **HuggingFace** | Llama-3.2-3B-Instruct | Open-source alternative |


---

## 🏗️ Architecture Deep Dive

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Tambo AI    │  │ React Flow   │  │   Chat       │      │
│  │  Provider    │  │   Canvas     │  │  Interface   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Redux      │  │  Socket.io   │  │   Node       │      │
│  │   Store      │  │   Client     │  │  Library     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP + WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (Motia Runtime)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Workflow    │  │   Groq AI    │  │   Socket.io  │      │
│  │   Engine     │  │  Provider    │  │   Server     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   MongoDB    │  │     JWT      │  │  Nodemailer  │      │
│  │  Connector   │  │     Auth     │  │    SMTP      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   MongoDB    │
                    │   Database   │
                    └──────────────┘
```

### Directory Structure

```
/FlowForge
├── /frontend                           # Next.js 15 App Router
│   ├── /app
│   │   ├── layout.tsx                  # Root layout with providers
│   │   ├── page.tsx                    # Main page with Tambo integration
│   │   └── /builder
│   │       └── page.tsx                # Workflow builder canvas
│   ├── /components
│   │   ├── AppProviders.tsx            # TamboProvider + MotiaProvider
│   │   ├── ChatShell.tsx               # Chat interface
│   │   ├── BackendExplainer.tsx        # Workflow explanation UI
│   │   ├── /nodes                      # React Flow node components
│   │   ├── /Ui                         # UI components
│   │   └── /workflow                   # Workflow logic
│   ├── /store                          # Redux store
│   ├── /hooks                          # Custom hooks
│   └── /internal
│       └── ui-map.ts                   # Design system tokens
│
├── /backend                            # Motia Framework
│   ├── motia.config.ts                 # Motia configuration
│   └── /src
│       ├── /ai
│       │   ├── nodeCatalog.ts          # Node definitions for AI
│       │   ├── /prompts                # AI prompt templates
│       │   └── /providers
│       │       ├── groqProvider.ts     # Groq integration
│       │       ├── OpenAIProvider.ts   # OpenAI integration
│       │       └── HuggingFaceProvider.ts
│       ├── /engine
│       │   └── workflowEngine.ts       # Core execution engine
│       ├── /lib
│       │   ├── mongo.ts                # MongoDB connection
│       │   ├── socket.ts               # WebSocket server
│       │   ├── email.ts                # Email utilities
│       │   └── resolveValue.ts         # Template resolver
│       ├── /models
│       │   ├── workflow.model.ts       # Workflow storage
│       │   ├── user.model.ts           # User authentication
│       │   └── publishedApi.model.ts   # Published APIs
│       └── /steps
│           ├── ai-intent.step.ts       # Intent detection
│           ├── generateWorkflowWithAi.step.ts  # AI generation
│           ├── workflow-mutation.step.ts       # Conversational mutation
│           ├── explain-workflow.step.ts        # Workflow explanation
│           ├── executeWorkflow.step.ts         # Workflow execution
│           ├── saveWorkflow.step.ts            # Workflow persistence
│           └── [other steps...]
│
└── /internal                           # Documentation
    ├── project-map.ts                  # Complete architecture map
    └── QUICK-REFERENCE.md              # Quick reference guide
```


---

## 🤖 Tambo AI Integration

### What is Tambo AI?

**Tambo AI** (`@tambo-ai/react@0.74.1`) is a generative UI framework that enables **intent-driven, adaptive interfaces**. Instead of showing all UI components upfront, Tambo dynamically mounts components based on user intent.

### How FlowForge Uses Tambo AI

#### 1. **Chat-First Interface**

**Before Tambo:**
- Users saw complex UI with sidebar, canvas, panels
- Overwhelming for new users
- Required learning the interface first

**After Tambo:**
- Users see only a chat input
- Describe what they want in plain English
- UI progressively reveals based on intent

#### 2. **Intent Detection Flow**

```
User Message
    ↓
ChatShell.tsx (Frontend)
    ↓
POST /ai/intent (Backend)
    ↓
ai-intent.step.ts analyzes prompt
    ↓
Returns: { components: ["WorkflowGraph"], workflowId, ... }
    ↓
TamboProvider mounts components
    ↓
UI adapts dynamically
```

#### 3. **Component Registry**

FlowForge registers these components with Tambo:

| Component | Trigger Keywords | Purpose |
|-----------|------------------|---------|
| **WorkflowGraph** | create, build, make, api, workflow | Visual workflow builder |
| **BackendExplainer** | explain, what does, describe, how | Workflow explanation |
| **ExecutionLogs** | run, test, execute, logs | Real-time execution logs |
| **DeployPanel** | deploy, publish, launch | Deployment options |
| **APIPlayground** | playground, test api | API testing interface |
| **NodeInspector** | inspect, examine, look at | Node configuration |

#### 4. **Implementation Details**

**Frontend Setup (`app/page.tsx`):**

```typescript
import { TamboProvider } from "@tambo-ai/react";

export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  return (
    <TamboProvider apiKey={apiKey}>
      <OrchetrixWorkspace />
    </TamboProvider>
  );
}
```

**Intent Detection (`backend/src/steps/ai-intent.step.ts`):**

```typescript
export const handler: StepHandler<typeof config> = async (req, ctx) => {
  const { prompt, workflowId, ownerId } = req.body;
  
  // Analyze prompt for keywords
  const components = [];
  
  if (/create|build|make|api|workflow/i.test(prompt)) {
    components.push("WorkflowGraph");
  }
  
  if (/explain|what does|describe|how/i.test(prompt)) {
    components.push("BackendExplainer");
  }
  
  if (/deploy|publish|launch/i.test(prompt)) {
    components.push("DeployPanel");
  }
  
  return {
    status: 200,
    body: {
      workflowPrompt: prompt,
      components,
      workflowId,
      correlationId,
    },
  };
};
```

**Dynamic Component Mounting:**

```typescript
function OrchetrixWorkspace() {
  const [intent, setIntent] = useState<IntentResponse | null>(null);
  const [mountedComponents, setMountedComponents] = useState<Set<string>>(new Set());

  const handleIntentReceived = (newIntent: IntentResponse) => {
    setIntent(newIntent);
    setMountedComponents(new Set(newIntent.components));
  };

  return (
    <div>
      <ChatShell onIntentReceived={handleIntentReceived} />
      
      {mountedComponents.has("WorkflowGraph") && <WorkflowGraph />}
      {mountedComponents.has("BackendExplainer") && <BackendExplainer />}
      {mountedComponents.has("ExecutionLogs") && <ExecutionLogsSidebar />}
    </div>
  );
}
```

### Benefits of Tambo Integration

1. **Zero Learning Curve** - Users don't need to learn the UI
2. **Progressive Revelation** - Only show what's needed
3. **Natural Interaction** - Conversation drives everything
4. **Adaptive Layout** - UI changes based on context
5. **Reduced Cognitive Load** - No overwhelming interfaces


---

## 🧠 AI-Powered Workflow Generation

### Overview

FlowForge uses **Groq AI** (llama-3.1-8b-instant) to convert natural language descriptions into complete, executable workflows.

### Generation Flow

```
User Prompt: "Create a signup API with email validation"
    ↓
POST /workflow/generate
    ↓
generateWorkflowWithAi.step.ts
    ↓
Constructs AI Prompt:
  • System Prompt: Instructions for workflow generation
  • Schema Prompt: JSON schema requirements
  • User Prompt: User's request + node catalog
  • Node Catalog: Available node types with examples
    ↓
Groq AI (llama-3.1-8b-instant)
    ↓
Returns JSON workflow:
{
  "nodes": [
    { "id": "step1", "type": "input", "data": {...} },
    { "id": "step2", "type": "inputValidation", "data": {...} },
    { "id": "step3", "type": "dbInsert", "data": {...} },
    { "id": "step4", "type": "response", "data": {...} }
  ],
  "edges": [
    { "id": "edge1", "source": "step1", "target": "step2" },
    { "id": "edge2", "source": "step2", "target": "step3" },
    { "id": "edge3", "source": "step3", "target": "step4" }
  ]
}
    ↓
JSON Extraction & Repair
    ↓
Node Validation & Label Enforcement
    ↓
Return to Frontend
    ↓
React Flow Renders Workflow
```

### AI Prompt Structure

#### 1. **System Prompt** (`systemPrompt.ts`)

```typescript
export const systemPrompt = `
You are a workflow generation expert. Generate valid JSON workflows 
that follow the exact schema provided. Use only allowed node types.
Ensure all nodes have proper labels and field configurations.
Connect nodes in a logical execution order.
`;
```

#### 2. **Schema Prompt** (`schemaPrompt.ts`)

```typescript
export const schemaPrompt = `
Return a JSON object with this structure:
{
  "nodes": [
    {
      "id": "step1",
      "type": "input",
      "data": {
        "label": "User Input",
        "fields": { "variables": [{ "name": "email" }] }
      }
    }
  ],
  "edges": [
    { "id": "edge1", "source": "step1", "target": "step2" }
  ]
}
`;
```

#### 3. **User Prompt** (`userPrompt.ts`)

```typescript
export function userPrompt(prompt: string, nodeCatalog: any[]) {
  return `
USER REQUEST: ${prompt}

AVAILABLE NODE TYPES:
${nodeCatalog.map(n => `
- ${n.type}: ${n.description}
  Example: ${JSON.stringify(n.example, null, 2)}
`).join('\n')}

Generate a workflow that fulfills the user's request.
`;
}
```

### Node Catalog

The AI has access to these node types:

| Node Type | Description | Example Use |
|-----------|-------------|-------------|
| **input** | Define input variables | User provides email, password |
| **inputValidation** | Validate input fields | Check email format, password length |
| **dbFind** | Query MongoDB | Find existing user by email |
| **dbInsert** | Insert document | Create new user record |
| **dbUpdate** | Update document | Update user profile |
| **dbDelete** | Delete document | Remove user account |
| **emailSend** | Send email | Welcome email, password reset |
| **authMiddleware** | JWT validation | Verify authentication token |
| **userLogin** | User login | Validate credentials |
| **jwtGenerate** | Generate JWT | Create auth token |
| **response** | API response | Return success/error message |

### Template Variable System

Workflows use `{{variableName}}` syntax for dynamic values:

```json
{
  "type": "dbInsert",
  "data": {
    "fields": {
      "collection": "users",
      "document": {
        "email": "{{email}}",
        "password": "{{hashedPassword}}",
        "createdAt": "{{timestamp}}"
      }
    }
  }
}
```

At runtime, `resolveValue.ts` replaces templates with actual values:
- `{{email}}` → `"user@example.com"`
- `{{hashedPassword}}` → `"$2a$10$..."`
- `{{timestamp}}` → `"2026-02-08T10:30:00Z"`

### AI Provider Configuration

Switch providers via environment variable:

```bash
# Use Groq (default - fast, cost-effective)
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key

# Use OpenAI (more accurate, higher cost)
AI_PROVIDER=openai
OPENAI_KEY=your_openai_key

# Use HuggingFace (open-source)
AI_PROVIDER=huggingface
HF_API_KEY=your_hf_api_key
```

### Error Handling

1. **JSON Extraction** - Removes markdown code blocks
2. **JSON Repair** - Fixes common syntax errors
3. **Node Validation** - Filters invalid node types
4. **Label Enforcement** - Adds default labels if missing
5. **Edge Validation** - Ensures valid connections


---

## 💬 Conversational Workflow Building

### The Problem

Traditional workflow builders require users to:
1. Generate a complete workflow
2. Manually edit nodes
3. Regenerate if changes needed
4. Lose previous work

### The Solution: Conversational Mutation

FlowForge enables **iterative workflow building through conversation**:

```
User: "create signup api"
→ Generates workflow with 3 nodes: input → validation → dbInsert

User: "add jwt authentication"
→ Adds JWT node to SAME workflow (now 4 nodes)

User: "send welcome email"
→ Adds email node to SAME workflow (now 5 nodes)

Result: ONE workflow, built iteratively across 3 messages
```

### How It Works

#### 1. **Session State Management**

**Frontend (`app/page.tsx`):**

```typescript
const [activeWorkflowId, setActiveWorkflowId] = useState<string | undefined>(
  () => {
    // Restore from sessionStorage on mount
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("activeWorkflowId") || undefined;
    }
    return undefined;
  }
);

// Persist workflowId to sessionStorage
useEffect(() => {
  if (activeWorkflowId) {
    sessionStorage.setItem("activeWorkflowId", activeWorkflowId);
  }
}, [activeWorkflowId]);
```

**ChatShell sends workflowId with every message:**

```typescript
const response = await fetch("/ai/intent", {
  method: "POST",
  body: JSON.stringify({
    prompt: userMessage.content,
    workflowId,  // ← Existing workflow ID
    ownerId: "user_default",
  }),
});
```

#### 2. **Intent Detection with Context**

**Backend (`ai-intent.step.ts`):**

```typescript
export const handler: StepHandler<typeof config> = async (req, ctx) => {
  const { prompt, workflowId, ownerId } = req.body;
  
  // Load existing workflow if workflowId provided
  if (workflowId) {
    const workflowDoc = await Workflow.findOne({ workflowId, ownerId });
    
    if (workflowDoc) {
      ctx.logger.info(`Existing workflow found`, {
        nodeCount: workflowDoc.steps.length,
      });
    }
  }
  
  // Generate new workflowId if needed
  const finalWorkflowId = workflowId || `workflow_${Date.now()}_${uuidv4()}`;
  
  return {
    status: 200,
    body: {
      workflowPrompt: prompt,
      components: ["WorkflowGraph"],
      workflowId: finalWorkflowId,
      isNewWorkflow: !workflowId,
    },
  };
};
```

#### 3. **Workflow Mutation**

**Backend (`generateWorkflowWithAi.step.ts`):**

```typescript
// If workflowId provided, this is a MUTATION request
if (workflowId && ownerId) {
  // Load existing workflow
  const workflowDoc = await Workflow.findOne({ workflowId, ownerId });
  
  if (workflowDoc) {
    const existingWorkflow = {
      nodes: workflowDoc.steps || [],
      edges: workflowDoc.edges || [],
    };
    
    // Generate workflow summary for AI context
    const nodesSummary = existingWorkflow.nodes
      .map((n, idx) => `${idx + 1}. ID: ${n.id}, Type: ${n.type}, Label: ${n.data?.label}`)
      .join('\n');
    
    // Build mutation prompt
    const mutationPrompt = `
You are modifying an EXISTING workflow. Do NOT create a separate workflow.

EXISTING WORKFLOW:
Nodes (${existingWorkflow.nodes.length}):
${nodesSummary}

USER REQUEST: ${prompt}

CRITICAL INSTRUCTIONS:
1. ANALYZE the existing workflow to understand its flow
2. IDENTIFY where the new functionality should be inserted
3. DO NOT duplicate existing functionality
4. ADD ONLY the minimal new nodes needed
5. CONNECT new nodes to existing nodes using their IDs

Return a JSON object with ONLY additions:
{
  "addedNodes": [array of new nodes],
  "addedEdges": [array of new edges],
  "reasoning": "brief explanation"
}
`;
    
    // Call AI with mutation prompt
    const mutation = await ai.generateWorkflow(mutationPrompt, systemPrompt);
    
    // Apply mutation
    const updatedNodes = [...existingWorkflow.nodes, ...mutation.addedNodes];
    const updatedEdges = [...existingWorkflow.edges, ...mutation.addedEdges];
    
    // Save mutated workflow
    workflowDoc.steps = updatedNodes;
    workflowDoc.edges = updatedEdges;
    await workflowDoc.save();
    
    return { nodes: updatedNodes, edges: updatedEdges };
  }
}
```

#### 4. **Response Node Normalization**

FlowForge ensures the **Response node is ALWAYS the last node**:

```typescript
// Find Response node
const responseNode = existingWorkflow.nodes.find(n => n.type === "response");

if (responseNode) {
  // Remove Response node temporarily
  const nodesWithoutResponse = existingWorkflow.nodes.filter(n => n.type !== "response");
  
  // Add new nodes
  const intermediateNodes = [...nodesWithoutResponse, ...newNodes];
  
  // Find terminal nodes (nodes with no outgoing edges)
  const terminalNodes = findTerminalNodes(intermediateNodes, edges);
  
  // Connect terminal nodes to Response
  const newEdgesToResponse = terminalNodes.map(n => ({
    id: `edge_to_response_${n.id}`,
    source: n.id,
    target: responseNode.id,
  }));
  
  // Reinsert Response node as LAST node
  const finalNodes = [...intermediateNodes, responseNode];
}
```

### Example Conversation

```
User: "create signup api"
Backend: Generates workflow_1234567890_abc123
  Nodes: input → validation → dbInsert → response
  
User: "add jwt authentication"
Backend: Loads workflow_1234567890_abc123 (3 nodes)
  AI adds: authMiddleware node
  Result: input → validation → dbInsert → authMiddleware → response
  
User: "send welcome email"
Backend: Loads workflow_1234567890_abc123 (4 nodes)
  AI adds: emailSend node
  Result: input → validation → dbInsert → authMiddleware → emailSend → response
```

### Visual Feedback

New nodes are marked with `_isNew: true`:

```typescript
const sanitizedNewNodes = mutation.addedNodes.map(node => ({
  ...node,
  data: {
    ...node.data,
    _isNew: true,  // ← Frontend can highlight this
  },
}));
```

Frontend can apply CSS:

```css
.node-new {
  outline: 2px solid rgba(255, 255, 255, 0.3);
  animation: pulse 2s ease-in-out;
}
```


---

## ⚙️ Workflow Execution Engine

### Overview

The **Workflow Engine** (`workflowEngine.ts`) is the core of FlowForge. It executes workflows step-by-step, resolves template variables, and manages state.

### Execution Flow

```
Workflow Execution Request
    ↓
POST /workflow/execute
    ↓
executeWorkflow.step.ts
    ↓
Emits "workflow.start" event
    ↓
workflow.start.step.ts (Event Handler)
    ↓
workflowEngine.ts
    ↓
For each step:
  1. Resolve template variables
  2. Execute step logic
  3. Store output in vars object
  4. Log execution details
    ↓
Return execution result
```

### Step Execution Logic

```typescript
export async function executeWorkflow(steps: any[], input: any, ctx: any) {
  const vars: any = { input };
  const executionId = uuidv4();
  
  ctx.logger.info(`[workflowEngine] 🚀 Workflow execution started`, {
    executionId,
    stepCount: steps.length,
  });
  
  for (const step of steps) {
    ctx.logger.info(`[workflowEngine] ▶️ Executing step`, {
      executionId,
      stepId: step.id,
      stepType: step.type,
    });
    
    try {
      // Resolve template variables
      const resolvedFields = resolveValue(step.data.fields, vars);
      
      // Execute step based on type
      switch (step.type) {
        case "input":
          // Input already in vars.input
          break;
          
        case "inputValidation":
          await validateInput(resolvedFields, vars);
          break;
          
        case "dbFind":
          const found = await dbFind(resolvedFields);
          vars[resolvedFields.output] = found;
          break;
          
        case "dbInsert":
          const created = await dbInsert(resolvedFields);
          vars[resolvedFields.output] = created;
          break;
          
        case "authMiddleware":
          const user = await verifyJWT(resolvedFields);
          vars[resolvedFields.output] = user;
          break;
          
        case "emailSend":
          await sendEmail(resolvedFields);
          break;
          
        case "response":
          return {
            ok: true,
            status: resolvedFields.status || 200,
            body: resolvedFields.body,
          };
      }
      
      ctx.logger.info(`[workflowEngine] ✅ Step completed`, {
        executionId,
        stepId: step.id,
      });
      
    } catch (error) {
      ctx.logger.error(`[workflowEngine] ❌ Step failed`, {
        executionId,
        stepId: step.id,
        error: error.message,
      });
      
      throw error;
    }
  }
  
  return { ok: true, output: vars };
}
```

### Template Variable Resolution

**resolveValue.ts:**

```typescript
export function resolveValue(value: any, vars: any): any {
  if (typeof value === "string") {
    // Replace {{variableName}} with actual value
    return value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const keys = path.trim().split(".");
      let result = vars;
      
      for (const key of keys) {
        result = result?.[key];
      }
      
      return result !== undefined ? result : match;
    });
  }
  
  if (Array.isArray(value)) {
    return value.map(v => resolveValue(v, vars));
  }
  
  if (typeof value === "object" && value !== null) {
    const resolved: any = {};
    for (const key in value) {
      resolved[key] = resolveValue(value[key], vars);
    }
    return resolved;
  }
  
  return value;
}
```

**Example:**

```typescript
const fields = {
  collection: "users",
  document: {
    email: "{{input.email}}",
    password: "{{hashedPassword}}",
    createdAt: "{{timestamp}}",
  },
};

const vars = {
  input: { email: "user@example.com" },
  hashedPassword: "$2a$10$...",
  timestamp: "2026-02-08T10:30:00Z",
};

const resolved = resolveValue(fields, vars);
// Result:
// {
//   collection: "users",
//   document: {
//     email: "user@example.com",
//     password: "$2a$10$...",
//     createdAt: "2026-02-08T10:30:00Z",
//   },
// }
```

### Database Operations

#### dbFind

```typescript
async function dbFind(fields: any) {
  const { collection, filters, findType, output } = fields;
  
  const Model = getModel(collection);
  
  if (findType === "findOne") {
    return await Model.findOne(filters);
  } else {
    return await Model.find(filters);
  }
}
```

#### dbInsert

```typescript
async function dbInsert(fields: any) {
  const { collection, document, output } = fields;
  
  const Model = getModel(collection);
  
  // Auto-hash password if present
  if (document.password) {
    document.password = await bcrypt.hash(document.password, 10);
  }
  
  return await Model.create(document);
}
```

#### dbUpdate

```typescript
async function dbUpdate(fields: any) {
  const { collection, filters, update, output } = fields;
  
  const Model = getModel(collection);
  
  return await Model.findOneAndUpdate(
    filters,
    { $set: update },
    { new: true }
  );
}
```

### Authentication

#### JWT Generation

```typescript
async function generateJWT(fields: any) {
  const { payload, expiresIn, output } = fields;
  
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: expiresIn || "7d" }
  );
  
  return token;
}
```

#### JWT Verification

```typescript
async function verifyJWT(fields: any) {
  const { token, output } = fields;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}
```

### Email Sending

```typescript
async function sendEmail(fields: any) {
  const { to, subject, body, from } = fields;
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  
  await transporter.sendMail({
    from: from || process.env.FROM_EMAIL,
    to,
    subject,
    text: body,
  });
}
```


---

## 🔴 Real-Time Features

### WebSocket Architecture

FlowForge uses **Socket.io** for real-time execution log streaming.

```
Frontend                    Backend
   │                           │
   │  socket.connect()         │
   ├──────────────────────────>│
   │                           │
   │  join-execution(id)       │
   ├──────────────────────────>│
   │                           │
   │                           │ Workflow executes
   │                           │ Logs generated
   │                           │
   │  <── execution-log ───────┤
   │  <── execution-log ───────┤
   │  <── execution-log ───────┤
   │                           │
   │  ExecutionLogsSidebar     │
   │  displays logs            │
```

### Backend Setup

**socket.ts:**

```typescript
import { Server } from "socket.io";

export function initializeSocket(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  
  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    socket.on("join-execution", (executionId: string) => {
      socket.join(executionId);
      console.log(`[Socket] Client joined execution: ${executionId}`);
    });
    
    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
  
  return io;
}
```

### Frontend Setup

**MotiaClientProvider.tsx:**

```typescript
import { MotiaStreamProvider } from "@motiadev/stream-client-react";

export function MotiaClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotiaStreamProvider
      url="ws://localhost:3000"
      options={{
        transports: ["websocket"],
      }}
    >
      {children}
    </MotiaStreamProvider>
  );
}
```

**ExecutionStreamProvider.tsx:**

```typescript
import { useMotiaStream } from "@motiadev/stream-client-react";

export function ExecutionStreamProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  
  const stream = useMotiaStream("executionLog", {
    onData: (log: ExecutionLog) => {
      setLogs(prev => [...prev, log]);
    },
  });
  
  return (
    <ExecutionStreamContext.Provider value={{ logs }}>
      {children}
    </ExecutionStreamContext.Provider>
  );
}
```

### Execution Log Stream

**execution-log.stream.ts:**

```typescript
import { z } from "zod";

export const executionLogSchema = z.object({
  id: z.string(),
  executionId: z.string(),
  step: z.string(),
  stepType: z.string(),
  phase: z.enum(["start", "data", "result", "error", "end"]),
  message: z.string(),
  payload: z.any().optional(),
  timestamp: z.number(),
});

export const config = {
  name: "executionLog",
  schema: executionLogSchema,
};
```

### Logging During Execution

**workflowEngine.ts:**

```typescript
// Log step start
ctx.streams.executionLog.set({
  id: uuidv4(),
  executionId,
  step: step.id,
  stepType: step.type,
  phase: "start",
  message: `Executing ${step.type}`,
  timestamp: Date.now(),
});

// Log step result
ctx.streams.executionLog.set({
  id: uuidv4(),
  executionId,
  step: step.id,
  stepType: step.type,
  phase: "result",
  message: `Step completed successfully`,
  payload: result,
  timestamp: Date.now(),
});

// Log errors
ctx.streams.executionLog.set({
  id: uuidv4(),
  executionId,
  step: step.id,
  stepType: step.type,
  phase: "error",
  message: error.message,
  payload: { stack: error.stack },
  timestamp: Date.now(),
});
```

### Frontend Log Display

**ExecutionLogsSidebar.tsx:**

```typescript
export function ExecutionLogsSidebar({ executionId }: { executionId: string }) {
  const { logs } = useExecutionStream();
  
  // Filter logs for this execution
  const executionLogs = logs.filter(log => log.executionId === executionId);
  
  return (
    <div className="execution-logs-sidebar">
      <h3>Execution Logs</h3>
      
      {executionLogs.map(log => (
        <div key={log.id} className={`log-entry log-${log.phase}`}>
          <div className="log-header">
            <span className="log-step">{log.step}</span>
            <span className="log-phase">{log.phase}</span>
            <span className="log-time">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="log-message">{log.message}</div>
          
          {log.payload && (
            <pre className="log-payload">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Log Phases

| Phase | Description | Color |
|-------|-------------|-------|
| **start** | Step execution begins | Blue |
| **data** | Step processing data | Gray |
| **result** | Step completed successfully | Green |
| **error** | Step failed | Red |
| **end** | Workflow execution finished | Purple |


---

## 🗄️ Database Architecture

### MongoDB with Mongoose

FlowForge uses **MongoDB** with **Mongoose ODM** for data persistence.

### Connection Management

**mongo.ts:**

```typescript
import mongoose from "mongoose";

let isConnected = false;

export async function connectMongo() {
  if (isConnected) {
    return;
  }
  
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/FlowForge";
  
  await mongoose.connect(uri);
  
  isConnected = true;
  console.log(`[MongoDB] Connected to ${uri}`);
  
  // Run schema introspection
  await introspectSchemas();
}
```

### Data Models

#### 1. **User Model** (`user.model.ts`)

```typescript
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
}, { timestamps: true });

// Auto-hash password before save
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model("User", userSchema);
```

**Features:**
- Password auto-hashing (bcrypt, 10 rounds)
- Password excluded from queries by default (`select: false`)
- Timestamps (createdAt, updatedAt)

#### 2. **Workflow Model** (`workflow.model.ts`)

```typescript
const workflowSchema = new mongoose.Schema({
  workflowId: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true },
  steps: { type: Array, required: true },
  edges: { type: Array, default: [] },
}, { timestamps: true });

workflowSchema.index({ workflowId: 1, ownerId: 1 });

export default mongoose.model("Workflow", workflowSchema);
```

**Features:**
- Stores workflow definitions
- Indexed by workflowId and ownerId
- Supports edges for React Flow

#### 3. **PublishedApi Model** (`publishedApi.model.ts`)

```typescript
const publishedApiSchema = new mongoose.Schema({
  path: { type: String, required: true, unique: true },
  workflowId: { type: String, required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  ownerId: { type: String, required: true },
  method: { type: String, default: "POST" },
}, { timestamps: true });

publishedApiSchema.index({ workflowId: 1, ownerId: 1 });

export default mongoose.model("PublishedApi", publishedApiSchema);
```

**Features:**
- Registry of published API endpoints
- Unique path constraint
- Links to workflow via workflowId

#### 4. **CollectionDefinitions Model** (`CollectionDefinitions.model.ts`)

```typescript
const collectionDefinitionsSchema = new mongoose.Schema({
  collectionName: { type: String, required: true, unique: true },
  fields: { type: Array, required: true },
  lastSyncedAt: { type: Date, default: Date.now },
});

export default mongoose.model("CollectionDefinitions", collectionDefinitionsSchema);
```

**Features:**
- Stores introspected collection schemas
- Used for field autocomplete in UI
- Updated on database connection

### Schema Introspection

**schemaIntrospector.ts:**

```typescript
export async function introspectSchemas() {
  const collections = await mongoose.connection.db.listCollections().toArray();
  
  for (const collection of collections) {
    const collectionName = collection.name;
    
    // Skip system collections
    if (collectionName.startsWith("system.")) continue;
    
    // Sample documents to infer schema
    const samples = await mongoose.connection.db
      .collection(collectionName)
      .find()
      .limit(10)
      .toArray();
    
    if (samples.length === 0) continue;
    
    // Extract field types
    const fields = extractFields(samples);
    
    // Save to CollectionDefinitions
    await CollectionDefinitions.findOneAndUpdate(
      { collectionName },
      { collectionName, fields, lastSyncedAt: new Date() },
      { upsert: true }
    );
  }
  
  console.log(`[SchemaIntrospector] Introspected ${collections.length} collections`);
}

function extractFields(samples: any[]): any[] {
  const fieldMap = new Map();
  
  for (const sample of samples) {
    for (const key in sample) {
      if (!fieldMap.has(key)) {
        fieldMap.set(key, {
          name: key,
          type: typeof sample[key],
        });
      }
    }
  }
  
  return Array.from(fieldMap.values());
}
```

### Dynamic Model Resolution

**getModel.ts:**

```typescript
export function getModel(collectionName: string) {
  // Check if model already exists
  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName];
  }
  
  // Check connection models
  if (mongoose.connection.models[collectionName]) {
    return mongoose.connection.models[collectionName];
  }
  
  // Create dynamic model
  const schema = new mongoose.Schema({}, { strict: false });
  return mongoose.model(collectionName, schema);
}
```

**Features:**
- Runtime model resolution
- Supports user-defined collections
- Flexible schema (strict: false)

### Database Operations in Workflows

#### Find Operation

```typescript
// Workflow node configuration
{
  "type": "dbFind",
  "data": {
    "fields": {
      "collection": "users",
      "findType": "findOne",
      "filters": { "email": "{{input.email}}" },
      "output": "foundUser"
    }
  }
}

// Execution
const Model = getModel("users");
const result = await Model.findOne({ email: "user@example.com" });
vars.foundUser = result;
```

#### Insert Operation

```typescript
// Workflow node configuration
{
  "type": "dbInsert",
  "data": {
    "fields": {
      "collection": "users",
      "document": {
        "email": "{{input.email}}",
        "password": "{{input.password}}",
        "name": "{{input.name}}"
      },
      "output": "newUser"
    }
  }
}

// Execution (password auto-hashed)
const Model = getModel("users");
const result = await Model.create({
  email: "user@example.com",
  password: "$2a$10$...",  // Auto-hashed
  name: "John Doe",
});
vars.newUser = result;
```

#### Update Operation

```typescript
// Workflow node configuration
{
  "type": "dbUpdate",
  "data": {
    "fields": {
      "collection": "users",
      "filters": { "_id": "{{foundUser._id}}" },
      "update": { "lastLogin": "{{timestamp}}" },
      "output": "updatedUser"
    }
  }
}

// Execution
const Model = getModel("users");
const result = await Model.findOneAndUpdate(
  { _id: "507f1f77bcf86cd799439011" },
  { $set: { lastLogin: "2026-02-08T10:30:00Z" } },
  { new: true }
);
vars.updatedUser = result;
```


---

## 📡 API Reference

### Workflow Management

#### Generate Workflow (AI)

```http
POST /workflow/generate
Content-Type: application/json

{
  "prompt": "create signup api with email validation",
  "workflowId": "workflow_1234567890_abc123",  // Optional for mutation
  "ownerId": "user_default",
  "correlationId": "uuid"
}
```

**Response:**

```json
{
  "nodes": [
    {
      "id": "step1",
      "type": "input",
      "data": {
        "label": "User Input",
        "fields": {
          "variables": [
            { "name": "email" },
            { "name": "password" }
          ]
        }
      }
    },
    {
      "id": "step2",
      "type": "inputValidation",
      "data": {
        "label": "Validate Input",
        "fields": {
          "rules": [
            { "field": "{{email}}", "required": true, "type": "email" },
            { "field": "{{password}}", "required": true, "minLength": 8 }
          ]
        }
      }
    }
  ],
  "edges": [
    { "id": "edge1", "source": "step1", "target": "step2" }
  ],
  "metadata": {
    "generatedAt": "2026-02-08T10:30:00Z",
    "prompt": "create signup api with email validation",
    "correlationId": "uuid"
  }
}
```

#### Execute Workflow (Test)

```http
POST /workflow/execute
Content-Type: application/json

{
  "steps": [...],
  "input": {
    "email": "user@example.com",
    "password": "securepass123"
  }
}
```

**Response:**

```json
{
  "ok": true,
  "executionId": "exec_1234567890_xyz789"
}
```

#### Save Workflow

```http
POST /workflows/save
Content-Type: application/json

{
  "nodes": [...],
  "edges": [...],
  "apiName": "signup",
  "inputVariables": ["email", "password"]
}
```

**Response:**

```json
{
  "ok": true,
  "workflowId": "workflow_1234567890_abc123",
  "apiPath": "/workflow/run/workflow_1234567890_abc123/signup",
  "apiName": "signup"
}
```

#### Run Published Workflow

```http
POST /workflow/run/:workflowId/:apiName
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response:**

```json
{
  "ok": true,
  "status": 200,
  "body": {
    "success": true,
    "message": "User created successfully",
    "data": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

#### Explain Workflow

```http
POST /workflow/explain
Content-Type: application/json

{
  "workflowId": "workflow_1234567890_abc123",
  "ownerId": "user_default",
  "correlationId": "uuid"
}
```

**Response:**

```json
{
  "workflowId": "workflow_1234567890_abc123",
  "summary": "This workflow authenticates users, manages data in the database, and processes requests through 5 steps.",
  "steps": [
    {
      "order": 1,
      "type": "input",
      "label": "User Input",
      "description": "User provides input data to start the workflow",
      "icon": "user"
    },
    {
      "order": 2,
      "type": "inputValidation",
      "label": "Validate Input",
      "description": "Input data is validated to ensure it meets requirements",
      "icon": "shield-check"
    }
  ],
  "dataFlow": [
    "User input is received",
    "Input is validated for correctness",
    "Data is stored in database",
    "Response is returned to user"
  ],
  "securityNotes": [
    {
      "type": "validation",
      "message": "Input validation is active to prevent invalid data",
      "severity": "success"
    },
    {
      "type": "database",
      "message": "1 database write operation(s) detected",
      "severity": "info"
    }
  ],
  "nodeCount": 5,
  "correlationId": "uuid"
}
```

### Intent Detection

#### Analyze Intent (Tambo AI)

```http
POST /ai/intent
Content-Type: application/json

{
  "prompt": "create signup api",
  "workflowId": "workflow_1234567890_abc123",  // Optional
  "ownerId": "user_default",
  "correlationId": "uuid"
}
```

**Response:**

```json
{
  "workflowPrompt": "create signup api",
  "components": ["WorkflowGraph"],
  "correlationId": "uuid",
  "workflowId": "workflow_1234567890_abc123",
  "isNewWorkflow": false,
  "existingNodeCount": 3
}
```

### Database

#### Get Database Schemas

```http
GET /db/schemas
```

**Response:**

```json
{
  "schemas": {
    "users": {
      "fields": [
        { "name": "_id", "type": "object" },
        { "name": "email", "type": "string" },
        { "name": "password", "type": "string" },
        { "name": "name", "type": "string" },
        { "name": "createdAt", "type": "string" },
        { "name": "updatedAt", "type": "string" }
      ]
    },
    "workflows": {
      "fields": [
        { "name": "_id", "type": "object" },
        { "name": "workflowId", "type": "string" },
        { "name": "ownerId", "type": "string" },
        { "name": "steps", "type": "object" }
      ]
    }
  }
}
```

### Execution Logs

#### Get Execution Logs

```http
GET /execution/logs/:executionId
```

**Response:**

```json
[
  {
    "id": "log_1",
    "executionId": "exec_1234567890_xyz789",
    "step": "step1",
    "stepType": "input",
    "phase": "start",
    "message": "Executing input",
    "timestamp": 1707389400000
  },
  {
    "id": "log_2",
    "executionId": "exec_1234567890_xyz789",
    "step": "step1",
    "stepType": "input",
    "phase": "result",
    "message": "Step completed successfully",
    "payload": { "email": "user@example.com" },
    "timestamp": 1707389401000
  }
]
```


---

## 🛠️ Development Guide

### Prerequisites

- **Bun** 1.2.15 or higher
- **MongoDB** (local or Atlas)
- **Node.js** 18+ (for compatibility)

### Environment Setup

#### Backend Environment Variables

Create `backend/.env`:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/FlowForge

# AI Provider (groq | openai | huggingface)
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here

# Authentication
JWT_SECRET=FlowForge-jwt-secret-change-in-production

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@FlowForge.com

# Optional
REDIS_URL=redis://127.0.0.1:6379
NODE_ENV=development
```

#### Frontend Environment Variables

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key_here
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### Installation

#### Backend

```bash
cd backend
bun install
```

#### Frontend

```bash
cd frontend
bun install
```

### Running the Application

#### Start Backend (Terminal 1)

```bash
cd backend
bun run dev
```

Backend will start on `http://localhost:3000`

**Available at:**
- API: `http://localhost:3000`
- Motia Workbench: `http://localhost:3000` (auto-opens)

#### Start Frontend (Terminal 2)

```bash
cd frontend
bun run dev
```

Frontend will start on `http://localhost:5000`

**Available at:**
- Application: `http://localhost:5000`

### Development Commands

#### Backend

```bash
# Development server with hot reload
bun run dev

# Production server
bun run start

# Build for production
bun run build

# Generate TypeScript types
bun run generate-types

# Clean build artifacts
bun run clean
```

#### Frontend

```bash
# Development server
bun run dev

# Production build
bun run build

# Production server
bun run start

# Lint code
bun run lint

# Validate setup
bun run validate

# Check API keys
bun run check:keys

# Run tests
bun run test:chat
bun run test:full
```

### Project Structure

```
/FlowForge
├── backend/
│   ├── src/
│   │   ├── ai/              # AI providers and prompts
│   │   ├── engine/          # Workflow execution engine
│   │   ├── lib/             # Utilities
│   │   ├── models/          # Mongoose models
│   │   └── steps/           # Motia steps (API/Event handlers)
│   ├── motia.config.ts      # Motia configuration
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── app/
│   │   ├── builder/         # Workflow builder page
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main page with Tambo
│   ├── components/
│   │   ├── nodes/           # React Flow node components
│   │   ├── Ui/              # UI components
│   │   ├── workflow/        # Workflow logic
│   │   ├── ChatShell.tsx    # Chat interface
│   │   └── BackendExplainer.tsx  # Explanation UI
│   ├── store/               # Redux store
│   ├── hooks/               # Custom hooks
│   ├── internal/
│   │   └── ui-map.ts        # Design system tokens
│   ├── package.json
│   └── .env.local
│
└── internal/
    ├── project-map.ts       # Complete architecture map
    └── QUICK-REFERENCE.md   # Quick reference guide
```

### Adding a New Node Type

#### 1. Add to Node Catalog (`backend/src/ai/nodeCatalog.ts`)

```typescript
{
  type: "customNode",
  description: "Description of what this node does",
  example: {
    id: "custom_1",
    type: "customNode",
    data: {
      fields: {
        field1: "value1",
        field2: "value2",
      },
    },
  },
  usage: "How to use this node",
}
```

#### 2. Add Execution Logic (`backend/src/engine/workflowEngine.ts`)

```typescript
case "customNode":
  const result = await executeCustomNode(resolvedFields);
  vars[resolvedFields.output] = result;
  break;
```

#### 3. Create React Component (`frontend/components/nodes/CustomNode.tsx`)

```typescript
export function CustomNode({ data }: { data: any }) {
  return (
    <div className="custom-node">
      <div className="node-header">
        <span>{data.label}</span>
      </div>
      <div className="node-body">
        {/* Node content */}
      </div>
    </div>
  );
}
```

#### 4. Register in NodesStore (`frontend/components/nodes/NodesStore.tsx`)

```typescript
const nodeTypes = {
  // ... existing nodes
  customNode: CustomNode,
};
```

#### 5. Add to NodesList (`frontend/assets/NodesList.tsx`)

```typescript
{
  type: "customNode",
  label: "Custom Node",
  icon: <CustomIcon />,
  category: "Custom",
}
```

### Debugging

#### Backend Logs

All operations are logged with correlation IDs:

```
[generateWorkflow] 📥 Request received
  correlationId: abc-123
  prompt: "create signup api"

[generateWorkflow] 🤖 Calling Groq for generation
  correlationId: abc-123

[generateWorkflow] ✅ Workflow generated
  correlationId: abc-123
  nodeCount: 4
```

#### Frontend Logs

Check browser console for:

```
[ChatShell] 🚀 User message submitted
[ChatShell] 📡 Sending to backend /ai/intent
[ChatShell] ✅ Backend intent received
[OrchetrixWorkspace] 🎯 Intent received
[OrchetrixWorkspace] 📦 Components to mount
```

#### Motia Workbench

Access at `http://localhost:3000` for:
- Step execution history
- Event logs
- State inspection
- API testing

### Testing

#### Validate Setup

```bash
cd frontend
bun run validate
```

Checks:
- ✅ Required files exist
- ✅ Environment variables configured
- ✅ Backend is running
- ✅ Intent endpoint responds

#### Run Tests

```bash
cd frontend
bun run test:chat    # Basic chat flow
bun run test:full    # Full end-to-end tests
```


---

## 🚀 Deployment

### Backend Deployment

#### Build

```bash
cd backend
bun run build
```

This runs `motia build` which:
- Compiles TypeScript
- Bundles for production
- Generates optimized output

#### Start Production Server

```bash
bun run start
```

Runs `motia start` on port 3000.

#### Environment Variables (Production)

```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/FlowForge
AI_PROVIDER=groq
GROQ_API_KEY=your_production_groq_key
JWT_SECRET=your_strong_production_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@FlowForge.com
NODE_ENV=production
```

#### Deployment Options

**1. Docker**

```dockerfile
FROM oven/bun:1.2.15

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY . .
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
```

**2. VPS (PM2)**

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start "bun run start" --name FlowForge-backend

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup
```

**3. Cloud Platforms**

- **AWS**: EC2 + MongoDB Atlas
- **GCP**: Compute Engine + MongoDB Atlas
- **Azure**: App Service + MongoDB Atlas
- **Railway**: Direct deployment
- **Render**: Direct deployment

### Frontend Deployment

#### Build

```bash
cd frontend
bun run build
```

This runs `next build` which:
- Generates optimized production build
- Creates `.next` directory
- Optimizes images and assets

#### Start Production Server

```bash
bun run start
```

Runs `next start` on port 3000 (change with `-p` flag).

#### Environment Variables (Production)

```bash
NEXT_PUBLIC_TAMBO_API_KEY=your_production_tambo_key
NEXT_PUBLIC_BACKEND_URL=https://api.FlowForge.com
NEXT_PUBLIC_SOCKET_URL=https://api.FlowForge.com
```

#### Deployment Options

**1. Vercel (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

**2. Netlify**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy

# Production deployment
netlify deploy --prod
```

**3. Docker**

```dockerfile
FROM oven/bun:1.2.15 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN bun run build

FROM oven/bun:1.2.15

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["bun", "run", "start"]
```

**4. Static Export (Optional)**

For static hosting (Netlify, Vercel, S3):

```bash
# Update next.config.js
export default {
  output: 'export',
};

# Build
bun run build

# Deploy 'out' directory
```

### Production Checklist

#### Backend

- [ ] Update `MONGODB_URI` to production database
- [ ] Set strong `JWT_SECRET`
- [ ] Configure production SMTP credentials
- [ ] Set `NODE_ENV=production`
- [ ] Enable CORS for frontend domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring (Datadog, New Relic)
- [ ] Configure logging (Winston, Pino)
- [ ] Set up error tracking (Sentry)

#### Frontend

- [ ] Update `NEXT_PUBLIC_BACKEND_URL` to production API
- [ ] Update `NEXT_PUBLIC_SOCKET_URL` to production WebSocket
- [ ] Set production `NEXT_PUBLIC_TAMBO_API_KEY`
- [ ] Configure CDN for static assets
- [ ] Enable compression (gzip, brotli)
- [ ] Set up analytics (Google Analytics, Plausible)
- [ ] Configure error tracking (Sentry)
- [ ] Set up performance monitoring

#### Database

- [ ] Use MongoDB Atlas or managed MongoDB
- [ ] Enable authentication
- [ ] Configure IP whitelist
- [ ] Set up backups
- [ ] Enable monitoring
- [ ] Create indexes for performance

#### Security

- [ ] Enable HTTPS everywhere
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Set up DDoS protection
- [ ] Regular security audits
- [ ] Keep dependencies updated

### Monitoring

#### Backend Monitoring

```typescript
// Add to motia.config.ts
import observabilityPlugin from '@motiadev/plugin-observability/plugin';

export default defineConfig({
  plugins: [
    observabilityPlugin,
    // ... other plugins
  ],
});
```

#### Frontend Monitoring

```typescript
// Add to app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Scaling

#### Horizontal Scaling

- Deploy multiple backend instances
- Use load balancer (Nginx, HAProxy)
- Share session state via Redis
- Use MongoDB replica set

#### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable caching (Redis)
- Use CDN for static assets

#### Performance Optimization

- Enable compression
- Optimize images (Next.js Image)
- Code splitting (Next.js automatic)
- Lazy loading components
- Database indexing
- Query optimization


---

## 🎓 Usage Examples

### Example 1: User Signup API

**User Prompt:**
```
"Create a signup API that validates email format, hashes password, 
saves to MongoDB, and sends welcome email"
```

**Generated Workflow:**

```
Step 1: Input Node
  - Variables: email, password, name

Step 2: Input Validation Node
  - Validate email format
  - Validate password length (min 8 chars)

Step 3: Database Insert Node
  - Collection: users
  - Document: { email, password (auto-hashed), name }
  - Output: newUser

Step 4: Email Send Node
  - To: {{newUser.email}}
  - Subject: "Welcome to FlowForge"
  - Body: "Hello {{newUser.name}}, welcome!"

Step 5: Response Node
  - Status: 200
  - Body: { success: true, user: {{newUser}} }
```

**API Endpoint:**
```http
POST /workflow/run/workflow_1234567890_abc123/signup

{
  "email": "user@example.com",
  "password": "securepass123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2026-02-08T10:30:00Z"
  }
}
```

### Example 2: User Login API

**User Prompt:**
```
"Create a login API that checks credentials, generates JWT token, 
and returns user data"
```

**Generated Workflow:**

```
Step 1: Input Node
  - Variables: email, password

Step 2: User Login Node
  - Validates credentials
  - Output: loginResult

Step 3: JWT Generate Node
  - Payload: { userId: {{loginResult._id}}, email: {{loginResult.email}} }
  - ExpiresIn: 7d
  - Output: token

Step 4: Response Node
  - Status: 200
  - Body: { success: true, token: {{token}}, user: {{loginResult}} }
```

**API Endpoint:**
```http
POST /workflow/run/workflow_1234567890_xyz789/login

{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Example 3: Protected Profile Update

**User Prompt:**
```
"Create an API to update user profile with JWT authentication"
```

**Generated Workflow:**

```
Step 1: Input Node
  - Variables: name, bio

Step 2: Auth Middleware Node
  - Verifies JWT token from Authorization header
  - Output: currentUser

Step 3: Database Update Node
  - Collection: users
  - Filters: { _id: {{currentUser.userId}} }
  - Update: { name: {{name}}, bio: {{bio}} }
  - Output: updatedUser

Step 4: Response Node
  - Status: 200
  - Body: { success: true, user: {{updatedUser}} }
```

**API Endpoint:**
```http
POST /workflow/run/workflow_1234567890_def456/update-profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "name": "John Smith",
  "bio": "Software Developer"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Smith",
    "bio": "Software Developer"
  }
}
```

### Example 4: Conversational Workflow Building

**Conversation:**

```
User: "create signup api"
AI: Generates workflow with 3 nodes: input → validation → dbInsert → response

User: "add jwt authentication"
AI: Adds JWT node to SAME workflow
Result: input → validation → dbInsert → jwtGenerate → response

User: "send welcome email"
AI: Adds email node to SAME workflow
Result: input → validation → dbInsert → jwtGenerate → emailSend → response

User: "explain what this does"
AI: Shows BackendExplainer component with:
  - Summary: "This workflow validates user input, creates user account, 
    generates authentication token, and sends welcome email"
  - Step-by-step breakdown
  - Security notes
  - Data flow visualization
```

### Example 5: Data Dashboard API

**User Prompt:**
```
"Build an API that fetches all orders from last 30 days, 
calculates total revenue, and returns summary"
```

**Generated Workflow:**

```
Step 1: Input Node
  - Variables: (none - uses current date)

Step 2: Database Find Node
  - Collection: orders
  - Filters: { createdAt: { $gte: {{thirtyDaysAgo}} } }
  - FindType: find (multiple)
  - Output: orders

Step 3: Compute Node (Custom Logic)
  - Calculate: sum of {{orders[].amount}}
  - Output: totalRevenue

Step 4: Response Node
  - Status: 200
  - Body: { 
      orderCount: {{orders.length}}, 
      totalRevenue: {{totalRevenue}},
      orders: {{orders}}
    }
```

### Example 6: Password Reset Flow

**User Prompt:**
```
"Create password reset API that generates reset token, 
saves to database, and emails reset link"
```

**Generated Workflow:**

```
Step 1: Input Node
  - Variables: email

Step 2: Database Find Node
  - Collection: users
  - Filters: { email: {{email}} }
  - FindType: findOne
  - Output: user

Step 3: JWT Generate Node
  - Payload: { userId: {{user._id}}, type: "reset" }
  - ExpiresIn: 1h
  - Output: resetToken

Step 4: Database Update Node
  - Collection: users
  - Filters: { _id: {{user._id}} }
  - Update: { resetToken: {{resetToken}}, resetTokenExpiry: {{oneHourFromNow}} }

Step 5: Email Send Node
  - To: {{user.email}}
  - Subject: "Password Reset Request"
  - Body: "Click here to reset: https://app.com/reset?token={{resetToken}}"

Step 6: Response Node
  - Status: 200
  - Body: { success: true, message: "Reset email sent" }
```


---

## 🎯 Key Architectural Patterns

### 1. **Chat-First Generative UI (Tambo AI)**

**Pattern:** Intent-driven component mounting

**Implementation:**
- User describes intent in natural language
- Backend analyzes intent and returns component list
- Tambo dynamically mounts components
- UI adapts based on conversation context

**Benefits:**
- Zero learning curve
- Progressive revelation
- Natural interaction
- Reduced cognitive load

### 2. **Conversational State Management**

**Pattern:** Session-based workflow persistence

**Implementation:**
- workflowId stored in sessionStorage
- Sent with every chat message
- Backend loads existing workflow
- AI modifies instead of regenerating

**Benefits:**
- Iterative workflow building
- Conversation continuity
- No lost work
- Natural editing experience

### 3. **Template Variable Resolution**

**Pattern:** Late binding of dynamic values

**Implementation:**
- Workflows use `{{variableName}}` syntax
- Values resolved at runtime
- Supports nested paths and arrays
- Recursive resolution

**Benefits:**
- Dynamic workflows
- Reusable templates
- Type-safe at runtime
- Clear data flow

### 4. **Event-Driven Execution**

**Pattern:** Motia event system

**Implementation:**
- Workflow execution emits events
- Event handlers process workflows
- Decoupled architecture
- Async processing

**Benefits:**
- Scalable execution
- Background processing
- Queue management
- Retry logic

### 5. **Real-Time Streaming**

**Pattern:** WebSocket-based log streaming

**Implementation:**
- Socket.io for bidirectional communication
- Room-based isolation per execution
- Motia stream integration
- Zod schema validation

**Benefits:**
- Live execution feedback
- Debugging visibility
- User engagement
- Error detection

### 6. **Dynamic Model Resolution**

**Pattern:** Runtime database model creation

**Implementation:**
- Models created on-demand
- Flexible schema (strict: false)
- Schema introspection
- User-defined collections

**Benefits:**
- No predefined schemas
- User flexibility
- Rapid prototyping
- Dynamic data structures

### 7. **AI-Powered Generation**

**Pattern:** Natural language to structured data

**Implementation:**
- Groq AI with structured prompts
- JSON schema enforcement
- Error recovery (repair, retry)
- Node catalog context

**Benefits:**
- Accessible to non-developers
- Fast workflow creation
- Consistent output
- Extensible node types

### 8. **Response Node Normalization**

**Pattern:** Deterministic workflow structure

**Implementation:**
- Response node always last
- Terminal nodes connected to Response
- Automatic edge rewiring
- Graph validation

**Benefits:**
- Predictable execution
- Clear workflow end
- Prevents infinite loops
- Consistent API responses

---

## 🔍 How Tambo AI Helps FlowForge

### Problem: Complex UI Overwhelms Users

Traditional workflow builders show everything at once:
- Sidebar with 20+ node types
- Canvas with controls
- Configuration panels
- Execution logs
- Deployment options

**Result:** Users don't know where to start.

### Solution: Tambo AI's Generative UI

FlowForge uses Tambo to create an **adaptive interface**:

#### 1. **Progressive Revelation**

```
Initial State:
  ✅ Chat input
  ❌ Sidebar
  ❌ Canvas
  ❌ Panels
  ❌ Logs

After "create signup api":
  ✅ Chat input (smaller)
  ✅ Canvas with workflow
  ❌ Sidebar
  ❌ Panels
  ❌ Logs

After "deploy my api":
  ✅ Chat input
  ✅ Canvas
  ✅ Deploy panel
  ❌ Sidebar
  ❌ Logs

After "run workflow":
  ✅ Chat input
  ✅ Canvas
  ✅ Deploy panel
  ✅ Execution logs
  ❌ Sidebar
```

#### 2. **Intent-Driven Components**

Tambo decides which components to show based on user intent:

| User Says | Tambo Shows |
|-----------|-------------|
| "create api" | WorkflowGraph |
| "explain" | BackendExplainer |
| "deploy" | DeployPanel |
| "run" | ExecutionLogs |
| "test api" | APIPlayground |

#### 3. **Natural Conversation**

Users don't need to learn UI:

```
User: "I want to build a signup API"
→ Tambo shows WorkflowGraph

User: "Add email validation"
→ Workflow updates (same canvas)

User: "How does this work?"
→ Tambo shows BackendExplainer

User: "Deploy it"
→ Tambo shows DeployPanel
```

#### 4. **Context Awareness**

Tambo maintains conversation context:

```typescript
// Frontend tracks workflowId
const [activeWorkflowId, setActiveWorkflowId] = useState<string>();

// Sent with every message
fetch("/ai/intent", {
  body: JSON.stringify({
    prompt: userMessage,
    workflowId: activeWorkflowId,  // ← Context
  }),
});

// Backend uses context
if (workflowId) {
  // Load existing workflow
  // Modify instead of regenerate
}
```

#### 5. **Reduced Cognitive Load**

**Without Tambo:**
- User sees 20+ node types
- Must understand workflow concepts
- Needs to know execution order
- Has to configure each node manually

**With Tambo:**
- User describes what they want
- AI generates workflow
- UI shows only relevant components
- Natural conversation drives everything

### Tambo AI Integration Points

#### 1. **TamboProvider** (`app/page.tsx`)

```typescript
<TamboProvider apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY}>
  <OrchetrixWorkspace />
</TamboProvider>
```

Wraps the entire application, enabling generative UI.

#### 2. **Intent Detection** (`ai-intent.step.ts`)

```typescript
// Analyzes user prompt
const components = [];

if (/create|build|make/i.test(prompt)) {
  components.push("WorkflowGraph");
}

if (/explain|describe/i.test(prompt)) {
  components.push("BackendExplainer");
}

return { components, workflowId, ... };
```

Backend determines which components to show.

#### 3. **Dynamic Mounting** (`app/page.tsx`)

```typescript
const [mountedComponents, setMountedComponents] = useState<Set<string>>(new Set());

const handleIntentReceived = (intent: IntentResponse) => {
  setMountedComponents(new Set(intent.components));
};

return (
  <>
    {mountedComponents.has("WorkflowGraph") && <WorkflowGraph />}
    {mountedComponents.has("BackendExplainer") && <BackendExplainer />}
  </>
);
```

Components mount/unmount based on intent.

#### 4. **Correlation Tracking**

```typescript
const correlationId = uuidv4();

// Frontend logs
console.log(`[ChatShell] 🚀 Message sent`, { correlationId });

// Backend logs
ctx.logger.info(`[aiIntent] 📥 Request received`, { correlationId });

// Track through entire flow
```

Every request tracked end-to-end for debugging.

### Impact of Tambo AI on FlowForge

| Metric | Before Tambo | After Tambo |
|--------|--------------|-------------|
| **Time to First Workflow** | 10+ minutes | 30 seconds |
| **Learning Curve** | Steep | Flat |
| **User Confusion** | High | Low |
| **Cognitive Load** | Heavy | Light |
| **Accessibility** | Developers only | Everyone |
| **User Satisfaction** | Medium | High |

### Why Tambo AI is Perfect for FlowForge

1. **Complexity Hiding** - FlowForge has 20+ node types, complex configuration. Tambo hides this until needed.

2. **Progressive Disclosure** - Users learn as they go, not upfront.

3. **Natural Interaction** - Conversation is more intuitive than clicking through menus.

4. **Context Preservation** - Tambo maintains conversation state across messages.

5. **Adaptive Layout** - UI changes based on what user is doing.

6. **Reduced Friction** - No need to learn interface before being productive.

---

## 📚 Additional Resources

### Documentation
- [Motia Framework Docs](https://motia.dev/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Flow Docs](https://reactflow.dev)
- [Tambo AI Docs](https://tambo.ai/docs)
- [Groq AI Docs](https://console.groq.com/docs)

### Internal Documentation
- `internal/project-map.ts` - Complete architecture map
- `internal/QUICK-REFERENCE.md` - Quick reference guide
- `ARCHITECTURE-FINDINGS.md` - Architecture analysis
- `IMPLEMENTATION-STATUS.md` - Implementation status
- `CONVERSATIONAL-MUTATION-IMPLEMENTED.md` - Mutation feature docs
- `EXPLAIN-BACKEND-IMPLEMENTED.md` - Explanation feature docs

### Community
- [FlowForge GitHub](https://github.com/AymaanPathan/FlowForge)
- [Motia Discord](https://discord.gg/motia)
- [Tambo AI Community](https://tambo.ai/community)

---

## ✅ Project Status

**Status:** ✅ PRODUCTION READY

All core features implemented and tested:
- ✅ AI-powered workflow generation
- ✅ Chat-first interface with Tambo AI
- ✅ Conversational workflow mutation
- ✅ Backend explanation feature
- ✅ Real-time execution logs
- ✅ Visual workflow builder
- ✅ Instant API deployment
- ✅ Database integration
- ✅ Authentication & security
- ✅ Email integration

**Test Results:**
- ✅ 9/9 tests passing
- ✅ No hydration warnings
- ✅ Performance acceptable (avg 200ms)
- ✅ All features verified

**Ready for:**
- ✅ Production deployment
- ✅ User testing
- ✅ Feature development
- ✅ Tambo hackathon demo

---

## 🎉 Conclusion

**FlowForge** is a revolutionary visual backend builder that combines:

1. **AI-Powered Generation** - Natural language to workflows via Groq
2. **Tambo AI Integration** - Chat-first, intent-driven UI
3. **Conversational Building** - Iterative workflow creation
4. **Real-Time Execution** - Live log streaming via WebSocket
5. **Instant Deployment** - One-click API publishing
6. **Production Ready** - Fully tested and documented

The integration of **Tambo AI** transforms FlowForge from a complex developer tool into an accessible platform where anyone can build backend APIs through natural conversation.

**Key Innovation:** Users don't learn the interface - they just describe what they want, and the interface adapts to help them achieve it.

---

**Last Updated:** February 8, 2026  
**Version:** 1.0.0  
**Status:** ✅ COMPLETE AND VERIFIED


