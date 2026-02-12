# Orchestrix Backend Core

Standalone Bun-based backend for Orchestrix - migrated from Motia framework.

## Overview

This is a complete rewrite of the Orchestrix backend, removing all Motia framework and Redis dependencies while preserving 100% of the original functionality. The new backend runs independently using standard Node.js/Bun patterns with Express for routing, Socket.io for real-time communication, and MongoDB for data persistence and session management.

## Key Changes from Original Backend

### Removed Dependencies
- ❌ Motia framework (@motiadev/*)
- ❌ Redis (ioredis)
- ❌ Motia plugins (endpoint, logs, observability, states)

### New Architecture
- ✅ Express HTTP server
- ✅ Socket.io for real-time execution logs (replaces Redis pub/sub)
- ✅ MongoDB-based session management (replaces Redis sessions)
- ✅ Standard Express routing (replaces Motia step files)
- ✅ Bun runtime

## Installation

```bash
# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/orchestrix

# Authentication
JWT_SECRET=your-secret-key-here

# AI Provider API Keys
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

## Running the Backend

### Development Mode
```bash
bun run dev
```

### Production Mode
```bash
bun run start
```

### Build
```bash
bun run build
```

## Project Structure

```
backend-core/
├── src/
│   ├── index.ts                 # Application entry point
│   ├── server.ts                # HTTP server setup
│   ├── socket.ts                # Socket.io initialization
│   │
│   ├── routes/                  # HTTP route handlers
│   │   ├── auth.routes.ts       # Authentication endpoints
│   │   ├── workflow.routes.ts   # Workflow CRUD endpoints
│   │   ├── execution.routes.ts  # Workflow execution endpoints
│   │   ├── ai.routes.ts         # AI intent and generation
│   │   └── collection.routes.ts # Collection management
│   │
│   ├── services/                # Business logic layer
│   │   ├── workflowEngine.ts    # Workflow execution engine
│   │   ├── sessionService.ts    # Session management
│   │   └── sessionCleanupJob.ts # Background session cleanup
│   │
│   ├── ai/                      # AI integration layer
│   │   ├── providers/           # AI provider implementations
│   │   ├── nodeCatalog.ts       # Workflow node definitions
│   │   ├── workflowSchema.ts    # Workflow schema definitions
│   │   └── prompts/             # AI prompt templates
│   │
│   ├── models/                  # Mongoose schemas
│   │   ├── workflow.model.ts
│   │   ├── user.model.ts
│   │   ├── session.model.ts     # NEW: Session storage
│   │   ├── CollectionData.model.ts
│   │   ├── CollectionDefinitions.model.ts
│   │   └── publishedApi.model.ts
│   │
│   ├── middleware/              # Express middleware
│   │   ├── auth.middleware.ts   # JWT validation
│   │   └── error.middleware.ts  # Error handling
│   │
│   ├── db/                      # Database utilities
│   │   ├── mongo.ts             # MongoDB connection
│   │   └── getModel.ts          # Dynamic model retrieval
│   │
│   └── utils/                   # Utility functions
│       ├── logger.ts            # Logging utility
│       ├── resolveValue.ts      # Variable resolution
│       ├── validation.ts        # Input validation
│       ├── email.ts             # Email sending
│       ├── extractJson.ts       # JSON extraction
│       └── repairJson.ts        # JSON repair
│
├── .env.example                 # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Logout (requires auth)
- `GET /auth/me` - Get current user (requires auth)

### Workflows
- `GET /workflows` - List user's workflows
- `GET /workflows/:workflowId` - Get workflow by ID
- `POST /workflows` - Create new workflow
- `PUT /workflows/:workflowId` - Update workflow
- `DELETE /workflows/:workflowId` - Delete workflow

### Execution
- `POST /workflows/:workflowId/execute` - Execute workflow
- `POST /workflows/run` - Run workflow with inline definition
- `POST /workflow/run/:workflowId/:apiName` - Run published API

### AI
- `POST /ai/intent` - Analyze user intent
- `POST /ai/generate-workflow` - Generate workflow from prompt
- `POST /ai/mutate-workflow` - Mutate existing workflow
- `POST /ai/explain-workflow` - Explain workflow in natural language

### Collections
- `GET /collections` - List collections
- `POST /collections` - Create collection
- `GET /collections/:id` - Get collection
- `PUT /collections/:id` - Update collection
- `DELETE /collections/:id` - Delete collection
- `GET /collections/:id/data` - Get collection data
- `POST /collections/:id/data` - Insert data

### Health Check
- `GET /health` - Server health status

## Real-Time Features

### Socket.io Events

The backend emits real-time execution logs via Socket.io:

**Client → Server:**
- `join-execution` - Join execution room to receive logs
- `leave-execution` - Leave execution room

**Server → Client:**
- `execution-log` - Real-time execution log events
  - `step_start` - Step execution started
  - `step_complete` - Step execution completed
  - `step_error` - Step execution failed
  - `workflow_complete` - Workflow execution completed

## Workflow Engine

The workflow engine supports the following node types:

- `input` - User input variables
- `inputValidation` - Input validation rules
- `dbFind` - Find documents in MongoDB
- `dbInsert` - Insert documents into MongoDB
- `dbUpdate` - Update documents in MongoDB
- `authMiddleware` - JWT authentication
- `jwtGenerate` - Generate JWT tokens
- `emailSend` - Send emails
- `response` - Return API response

## Session Management

Sessions are stored in MongoDB with automatic cleanup:
- Default expiration: 7 days
- Cleanup job runs every hour
- TTL index for automatic expiration

## Logging

The backend uses a structured logging system:
- Log levels: debug, info, warn, error
- Timestamps and request IDs
- Console output in development
- Structured logging for production

## Error Handling

Global error handling middleware:
- Consistent error response format
- Error logging with context
- Environment-aware error details
- Proper HTTP status codes

## Testing

```bash
# Run tests
bun test
```

## Deployment

### Prerequisites
- Bun runtime installed
- MongoDB instance running
- Environment variables configured

### Steps
1. Build the application: `bun run build`
2. Set environment variables
3. Start the server: `bun run start`

## Differences from Motia Backend

| Feature | Motia Backend | Backend Core |
|---------|--------------|--------------|
| Framework | Motia | Express |
| Runtime | Node.js | Bun |
| Routing | Step files | Express routes |
| Sessions | Redis | MongoDB |
| Real-time logs | Redis pub/sub | Socket.io |
| Configuration | motia.config.ts | .env |
| Startup | `motia dev` | `bun run dev` |
| Port | 3000 | 4000 |

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify network connectivity

### Socket.io Connection Issues
- Check FRONTEND_URL in .env
- Verify CORS configuration
- Check browser console for errors

### AI Provider Issues
- Verify API keys in .env
- Check AI_PROVIDER environment variable
- Review AI provider logs

## Contributing

This backend is part of the Orchestrix project. For contributions, please follow the project's contribution guidelines.

## License

[Your License Here]
