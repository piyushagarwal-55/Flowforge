# 🎯 FlowForge

> **"The backend that adapts to you, not the other way around."**



FlowForge is a **chat-first generative UI backend builder** that harnesses the power of [Tambo AI](https://tambo.ai/) to create production-ready APIs through natural conversation. No complex interfaces to learn, no manual coding required — just describe what you want, and watch the UI adapt to build it.

**The Force is strong with this one:**
- 💬 **Chat-First Interface** - Start with just a conversation
- 🎨 **Generative UI** - Components appear based on your intent
- 🤖 **AI-Powered** - Groq generates complete workflows from plain English
- 🔄 **Conversational Iteration** - Build workflows across multiple messages
- ⚡ **Instant Deployment** - From idea to production API in minutes

---

## ✨ What Makes FlowForge Special?

### 🌟 Generative UI Powered by Tambo

Unlike traditional backend builders that overwhelm you with complex interfaces, FlowForge uses **Tambo's Generative UI SDK** to create an adaptive experience:

- **Start with just a chat input** - No overwhelming UI on first load
- **Components appear based on intent** - The AI decides what you need to see
- **Progressive revelation** - UI adapts as your needs evolve
- **Zero learning curve** - Just talk naturally about what you want to build

### 🎯 What Can You Build?

- 🔐 **Authentication Systems** - Login, signup, JWT, password reset
- 📊 **CRUD APIs** - Full database operations (MongoDB)
- 📧 **Email Automations** - Transactional emails, notifications
- 🔄 **Workflow Automation** - Multi-step backend processes
- 🎨 **Custom Business Logic** - Any backend flow you can describe

All through natural conversation, no manual coding required.

---

## 🎯 Who Is It For?

| User Type | Use Case |
| --- | --- |
| 🚀 **Non-coders** | Build real backend logic without learning programming |
| ⚡ **Developers** | Build APIs 10x faster with visual workflows |
| 👥 **Teams** | Create automations instantly without backend knowledge |
| 💼 **Founders** | Get production-ready backend that scales from day one |

---

## 💡 How It Works (The Generative UI Way)

### 1️⃣ Start with a Conversation

```
You: "create a user signup API with email validation"
```

**No complex UI to learn.** Just a chat input. That's it.

### 2️⃣ AI Understands Your Intent

FlowForge analyzes your message using **Tambo AI** to understand:
- What you're trying to build
- Which components you need to see
- How to structure the workflow

### 3️⃣ UI Adapts Dynamically

The interface **generates itself** based on your intent:
- ✅ **WorkflowGraph** appears - Visual canvas with your workflow
- ✅ **Nodes auto-generated** - Input → Validation → Database → Response
- ✅ **Connections made** - Proper data flow established

### 4️⃣ Iterate Through Conversation

```
You: "add JWT authentication"
```

The **same workflow** evolves:
- AI adds JWT node to existing workflow
- Connects it properly in the flow
- No need to start over or manually edit

```
You: "send welcome email after signup"
```

Workflow grows again:
- Email node added
- Integrated into the flow
- One workflow, built conversationally

### 5️⃣ Deploy Instantly

```
You: "deploy this as an API"
```

- **DeployPanel** component appears
- One click to publish
- Get production-ready endpoint immediately


---

## 🚀 Key Features

### � Tambo-Powered Generative UI

The star of the show! FlowForge uses **Tambo AI (@tambo-ai/react v0.74.1)** to create an intent-driven interface:

- **Intent Detection** - Analyzes your message to understand what you need
- **Dynamic Component Mounting** - Shows only relevant UI components
- **Progressive Revelation** - Interface evolves with your conversation
- **Zero Cognitive Load** - No overwhelming dashboards or complex menus

**Registered Components:**
- `WorkflowGraph` - Visual workflow builder (React Flow)
- `BackendExplainer` - AI-generated workflow explanations
- `ExecutionLogs` - Real-time execution monitoring
- `DeployPanel` - One-click API deployment
- `APIPlayground` - Test your endpoints
- `NodeInspector` - Configure workflow nodes

### 🧠 AI-Powered Workflow Generation

Powered by **Groq (llama-3.1-8b-instant)** for blazing-fast workflow generation:

- **Natural Language → Workflow** - Describe in plain English, get complete workflows
- **Intelligent Node Selection** - AI chooses the right nodes for your use case
- **Proper Connections** - Automatically wires nodes in logical order
- **Template Variables** - Dynamic data flow with `{{variableName}}` syntax
- **Multi-Provider Support** - Groq (default), OpenAI, HuggingFace

### � Conversational Workflow Building

**The game-changer:** Build workflows iteratively across multiple messages:

```
Message 1: "create signup api"
→ Generates: input → validation → dbInsert → response

Message 2: "add jwt authentication"  
→ Adds to SAME workflow: input → validation → dbInsert → JWT → response

Message 3: "send welcome email"
→ Evolves further: input → validation → dbInsert → JWT → email → response
```

**How it works:**
- Session state management (sessionStorage)
- Workflow ID persists across messages
- AI understands existing workflow context
- Adds only necessary nodes
- Maintains workflow continuity

### 🎨 Visual Workflow Builder

Built with **React Flow (@xyflow/react v12.10.0)**:

- Intuitive drag-and-drop canvas
- 20+ node types (database, auth, email, logic)
- Real-time validation
- Automatic layout
- Dark mode design

### 🔄 Real-Time Execution Logs

Watch your workflow execute step-by-step:

- **WebSocket streaming** (Socket.io)
- Live step-by-step execution tracking
- Error detection with stack traces
- Execution time per node
- Correlation ID tracking
- Color-coded log levels

### 💾 Instant API Deployment

From workflow to production API in seconds:

- One-click deployment
- Auto-generated REST endpoints
- MongoDB persistence
- Production-ready immediately

### 🗄️ Database Integration

**MongoDB with Mongoose ODM:**

- Dynamic collection management
- Schema introspection
- CRUD operations (Find, Insert, Update, Delete)
- Automatic password hashing (bcrypt)

### 🔐 Built-In Security

- JWT token generation and validation
- Password hashing (bcrypt)
- Input validation middleware
- Auth middleware for protected routes

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                  FRONTEND (Next.js 15)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Tambo AI    │  │    Chat      │  │ React Flow   │      │
│  │  Provider    │  │  Interface   │  │   Canvas     │      │
│  │  (Intent)    │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Redux      │  │  Socket.io   │  │  Generative  │      │
│  │   Store      │  │   Client     │  │     UI       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP + WebSocket
                            ▼
┌────────────────────────────────────────────────────────────┐
│                         BACKEND                            │
|                            │                               │                        
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Workflow    │  │   Groq AI    │  │   Socket.io  │      │
│  │   Engine     │  │  (llama-3.1) │  │   Server     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   MongoDB    │  │     JWT      │  │  Nodemailer  │      │
│  │  Connector   │  │     Auth     │  │    SMTP      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   MongoDB    │
                    │   Database   │
                    └──────────────┘
```

### The Generative UI Flow

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
TamboProvider mounts components dynamically
    ↓
UI adapts to user intent
    ↓
POST /workflow/generate (if workflow needed)
    ↓
Groq AI generates workflow
    ↓
React Flow renders on canvas
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.9 | React framework with App Router |
| **React** | 19.2.1 | UI library |
| **Bun** | 1.2.15 | JavaScript runtime & package manager |
| **@tambo-ai/react** | 0.74.1 | **🌟 Generative UI SDK** |
| **@xyflow/react** | 12.10.0 | Visual workflow canvas |
| **Redux Toolkit** | 2.11.2 | State management |
| **Socket.io-client** | 4.8.1 | Real-time communication |
| **Tailwind CSS** | 4.1.18 | Styling framework |
| **Framer Motion** | 12.23.26 | Animations |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Bun** | 1.2.15 | JavaScript runtime |
| **MongoDB** | - | Database |
| **Mongoose** | 9.0.1 | MongoDB ODM |
| **Groq SDK** | 0.37.0 | **🤖 AI workflow generation** |
| **Socket.io** | 4.8.1 | Real-time communication |
| **JWT** | 9.0.3 | Authentication |
| **Nodemailer** | 7.0.11 | Email sending |
| **Bcrypt** | 3.0.3 | Password hashing |
| **Zod** | 4.1.12 | Schema validation |

### AI Providers
| Provider | Model | Use Case |
|----------|-------|----------|
| **Groq** (default) | llama-3.1-8b-instant | Fast, cost-effective workflow generation |
| **OpenAI** | gpt-4o-mini | More accurate, higher cost |
| **HuggingFace** | Llama-3.2-3B-Instruct | Open-source alternative |

---

## 📦 Quick Start

### Prerequisites

- **Bun** 1.2.15+ ([Install Bun](https://bun.sh/))
- **MongoDB** (local or Atlas)
- **Tambo API Key** ([Get one here](https://tambo.ai/))
- **Groq API Key** ([Get one here](https://console.groq.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/flowforge.git
cd flowforge
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
bun install

# Install backend dependencies
cd ../backend
bun install
```

### 3. Environment Setup

**Frontend `.env.local`:**

```bash
NEXT_PUBLIC_TAMBO_API_KEY=tambo_your_actual_key_here
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

**Backend `.env`:**

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/FlowForge
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_actual_key_here
JWT_SECRET=your-secret-key-change-in-production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. Run the Application

```bash
# Terminal 1 - Backend
cd backend
bun run dev

# Terminal 2 - Frontend
cd frontend
bun run dev
```

### 5. Open Your Browser

Visit **http://localhost:5000** and start building!

---

## 🎮 Try These Prompts

Once the app is running, try these example prompts:

### Basic CRUD
```
"create a signup API with email validation"
"create a login API that returns a JWT token"
"create an API to update user profile"
"create an API to delete a user account"
```

### Conversational Building
```
1. "create signup api"
2. "add jwt authentication"
3. "send welcome email after signup"
```
Watch the workflow evolve across messages!

### Advanced Features
```
"explain my workflow"  → Shows BackendExplainer component
"run my workflow"      → Shows ExecutionLogs component
"deploy this api"      → Shows DeployPanel component
```

---

## � Hackathon Highlights

### Why FlowForge is Perfect for "The UI Strikes Back"

**1. Generative UI at Its Core**
- Uses Tambo AI to dynamically mount components based on user intent
- No static interfaces - the UI adapts to what you're trying to do
- Progressive revelation keeps cognitive load minimal

**2. Best Use Case of Tambo**
- **Intent-driven component mounting** - Chat message → AI analysis → Dynamic UI
- **Conversational state management** - Workflow persists across messages
- **Context-aware UI** - Shows only relevant components at the right time
- **Zero learning curve** - Users don't need to learn the interface

**3. Technical Innovation**
- **Session state persistence** - Workflows survive across messages
- **AI-powered workflow mutation** - Iterative building through conversation
- **Real-time feedback** - WebSocket streaming for execution logs
- **Production-ready** - Instant API deployment from chat

**4. Real-World Impact**
- **Democratizes backend development** - Non-coders can build APIs
- **10x faster development** - From idea to production in minutes
- **Reduces complexity** - No overwhelming dashboards or menus
- **Scalable architecture** - Built on Motia's production-grade framework

### Demo Flow

```
1. User: "create signup api"
   → WorkflowGraph appears with 4 nodes

2. User: "add jwt authentication"
   → Same workflow evolves, JWT node added

3. User: "explain my workflow"
   → BackendExplainer component appears

4. User: "run it"
   → ExecutionLogs sidebar streams real-time logs

5. User: "deploy this"
   → DeployPanel appears, one-click deployment
```

**The UI literally strikes back** - adapting to user intent instead of forcing users to adapt to the UI!

---

## 🧪 Testing & Validation

FlowForge includes comprehensive test suites:

```bash
cd frontend

# Check API keys are configured
bun run check:keys

# Validate setup
bun run validate

# Mock tests (fast, no API calls)
bun run test:chat      # Basic chat flow
bun run test:full      # Comprehensive tests

# Real integration tests (uses actual APIs)
bun run test:real      # Real Tambo + Groq
```

**Test Results:**
- ✅ 24/24 tests passing
- ✅ Real Tambo integration verified
- ✅ Real Groq workflow generation verified
- ✅ Production-ready

---

## 📚 Documentation

- **[COMPLETE-PROJECT-GUIDE.md](./COMPLETE-PROJECT-GUIDE.md)** - Deep dive into architecture
- **[QUICK-START.md](./QUICK-START.md)** - Get up and running fast
- **[internal/project-map.ts](./internal/project-map.ts)** - Complete codebase map
- **[internal/QUICK-REFERENCE.md](./internal/QUICK-REFERENCE.md)** - Quick reference guide

---

## 🎨 Node Types Reference

### Input/Output Nodes
- **Input Node** - Define API request schema
- **Response Node** - Format and return API response

### Database Nodes
- **Find Record** - Query MongoDB with filters
- **Insert Record** - Create new database entries
- **Update Record** - Modify existing records
- **Delete Record** - Remove database entries

### Authentication Nodes
- **User Login** - Validate credentials
- **Auth Middleware** - JWT verification
- **JWT Generate** - Create authentication tokens

### Communication Nodes
- **Email Sender** - Send emails via SMTP/NodeMailer

### Logic Nodes
- **Validation Middleware** - Validate input data
- **Compute Node** - Transform/process data

---

## 🚀 Deployment

### Production Deployment

**Backend (Motia):**
```bash
cd backend
bun run build
bun run start
```

**Frontend (Next.js):**
```bash
cd frontend
bun run build
bun run start
```

**Recommended Platforms:**
- **Frontend:** Vercel (optimized for Next.js)
- **Backend:** Railway, Render, or your own server
- **Database:** MongoDB Atlas

---

## 🤝 Contributing

We welcome contributions! This project was built for "The UI Strikes Back" hackathon, showcasing the power of Tambo's Generative UI.

---

## 📄 License

MIT License - feel free to use this project as inspiration for your own Tambo applications!

---

## 🙏 Acknowledgments

- **[Tambo AI](https://tambo.ai/)** - For the amazing Generative UI SDK
- **[Groq](https://groq.com/)** - For blazing-fast AI inference
- **"The UI Strikes Back" Hackathon** - For the inspiration to build this

---

## 🌟 Star Us!

If you find FlowForge useful, please star the repository and share it with others building with Tambo!

**May the Force (of Generative UI) be with you!** ⚡








