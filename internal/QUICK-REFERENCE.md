# FlowForge Quick Reference

## Project Overview
**FlowForge** is a fullstack visual workflow builder that allows users to create API workflows through a drag-and-drop interface or AI-powered natural language generation.

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5.9 (App Router)
- **Runtime**: Bun 1.2.15
- **UI Library**: React 19.2.1
- **Workflow Canvas**: @xyflow/react 12.10.0
- **State**: Redux Toolkit 2.11.2
- **Real-time**: Socket.io-client 4.8.1
- **Styling**: Tailwind CSS 4.1.18

### Backend
- **Framework**: Motia 0.17.6-beta.187
- **Runtime**: Bun 1.2.15
- **Database**: MongoDB (Mongoose 9.0.1)
- **AI**: Groq SDK 0.37.0 (llama-3.1-8b-instant)
- **Auth**: JWT (jsonwebtoken 9.0.3)
- **Email**: Nodemailer 7.0.11
- **Real-time**: Socket.io 4.8.1

## Directory Structure

```
/FlowForge
├── /frontend                    # Next.js App Router
│   ├── /app/builder            # Main workflow builder page
│   ├── /components             # React components
│   │   ├── /nodes              # React Flow node types
│   │   ├── /Ui                 # UI components
│   │   └── /workflow           # Workflow logic
│   ├── /store                  # Redux store
│   └── /hooks                  # Custom hooks
│
├── /backend                     # Motia Framework
│   └── /src
│       ├── /ai                 # AI workflow generation
│       │   ├── nodeCatalog.ts  # Available node types
│       │   └── /providers      # AI providers (Groq/OpenAI/HF)
│       ├── /engine             # Workflow execution engine
│       ├── /lib                # Utilities (mongo, socket, email)
│       ├── /models             # Mongoose models
│       └── /steps              # Motia steps (API/Event handlers)
│
└── /internal                    # Documentation
    ├── project-map.ts          # Complete architecture map
    └── QUICK-REFERENCE.md      # This file
```

## Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/workflow/generate` | POST | AI workflow generation |
| `/workflow/execute` | POST | Test workflow execution |
| `/workflows/save` | POST | Save & publish workflow |
| `/workflow/run/:workflowId/:apiName` | POST | Execute published workflow |
| `/db/schemas` | GET | Get database schemas |
| `/execution/logs/:executionId` | GET | Get execution logs |

## Environment Variables

### Backend (.env)
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/Orchestrix

# AI Provider (groq | openai | huggingface)
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key

# Authentication
JWT_SECRET=your_jwt_secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@orchestrix.com

# Optional
REDIS_URL=redis://127.0.0.1:6379
NODE_ENV=development
```

## Development Commands

### Backend
```bash
cd backend
bun install          # Install dependencies
bun run dev          # Start dev server (port 3000)
bun run build        # Build for production
bun run start        # Start production server
```

### Frontend
```bash
cd frontend
bun install          # Install dependencies
bun run dev          # Start dev server (port 5000)
bun run build        # Build for production
bun run start        # Start production server
```

## Workflow Node Types

| Type | Description |
|------|-------------|
| `input` | Define input variables |
| `inputValidation` | Validate input fields |
| `dbFind` | Query MongoDB collection |
| `dbInsert` | Insert MongoDB document |
| `dbUpdate` | Update MongoDB document |
| `dbDelete` | Delete MongoDB document |
| `emailSend` | Send email via SMTP |
| `authMiddleware` | JWT authentication |
| `userLogin` | User login validation |

## Template Variable Syntax

Variables are referenced using `{{variableName}}` syntax:
- `{{email}}` - Input variable
- `{{foundUser.email}}` - Nested object
- `{{users[0].name}}` - Array access

## Workflow Execution Flow

1. **Creation**: User builds workflow in React Flow canvas
2. **Validation**: Graph validated (no cycles, required fields)
3. **Save**: Workflow saved to MongoDB, API published
4. **Execution**: 
   - Test: POST `/workflow/execute` with steps array
   - Published: POST `/workflow/run/:workflowId/:apiName`
5. **Logging**: Real-time logs streamed via WebSocket

## Key Files to Understand

### Frontend
- `app/builder/page.tsx` - Main workflow builder
- `components/nodes/NodesStore.tsx` - Node type registry
- `components/Ui/NodeEditorSidebar.tsx` - Node configuration
- `hooks/useExecutionStream.ts` - Real-time log streaming

### Backend
- `src/engine/workflowEngine.ts` - Core execution engine
- `src/steps/generateWorkflowWithAi.step.ts` - AI generation
- `src/ai/nodeCatalog.ts` - Node definitions for AI
- `src/lib/mongo.ts` - Database connection
- `src/lib/socket.ts` - WebSocket server

## Common Tasks

### Add New Node Type
1. Add to `backend/src/ai/nodeCatalog.ts`
2. Add execution logic in `backend/src/engine/workflowEngine.ts`
3. Create React component in `frontend/components/nodes/`
4. Register in `frontend/components/nodes/NodesStore.tsx`
5. Add to `frontend/assets/NodesList.tsx`

### Change AI Provider
Set `AI_PROVIDER` environment variable:
- `groq` (default) - Fast, cost-effective
- `openai` - More accurate, higher cost
- `huggingface` - Open-source models

### Debug Workflow Execution
1. Check execution logs in UI sidebar
2. View console logs in `workflowEngine.ts`
3. Use Motia Workbench at http://localhost:3000
4. Check MongoDB for saved workflows
5. Inspect WebSocket messages in browser DevTools

## Architecture Highlights

- **Event-Driven**: Workflows execute via Motia events
- **Real-time**: WebSocket streaming for execution logs
- **Dynamic**: Runtime model resolution for user collections
- **Type-Safe**: Full TypeScript coverage
- **Modular**: Step-based architecture with auto-discovery
- **AI-Powered**: Natural language to workflow conversion

## Status: ✅ Production Ready

All subsystems verified and documented. Ready for development and deployment.
