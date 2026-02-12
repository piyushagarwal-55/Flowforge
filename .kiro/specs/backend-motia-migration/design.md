# Design Document: Backend Motia Migration

## Overview

This design outlines the migration of the Orchestrix backend from the Motia framework to a standalone Bun-based architecture. The migration will create a new `backend-core` directory containing a self-contained Express/Hono application that preserves all existing functionality while eliminating framework dependencies.

The key architectural change is moving from Motia's plugin-based routing system to standard HTTP routing, and replacing Redis pub/sub with direct Socket.io event emission for real-time log streaming. All business logic, AI integrations, database models, and authentication mechanisms will be preserved with minimal modifications.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│                    (No changes required)                     │
└────────────┬────────────────────────────────────────────────┘
             │ HTTP/WebSocket
             ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend-Core (Bun)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              HTTP Server (Express/Hono)              │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │   Auth     │  │  Workflow  │  │     AI     │    │  │
│  │  │   Routes   │  │   Routes   │  │   Routes   │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Socket.io Server                        │  │
│  │  (Real-time execution log streaming)                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Service Layer                       │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │  Workflow  │  │     AI     │  │    Auth    │    │  │
│  │  │   Engine   │  │  Providers │  │  Service   │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB Database                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Workflows│  │  Users   │  │Collections│  │ Sessions │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

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
│   │   ├── authService.ts       # Authentication logic
│   │   ├── sessionService.ts    # Session management
│   │   └── emailService.ts      # Email sending
│   │
│   ├── ai/                      # AI integration layer
│   │   ├── providers/
│   │   │   ├── groqProvider.ts
│   │   │   ├── openaiProvider.ts
│   │   │   ├── geminiProvider.ts
│   │   │   └── huggingfaceProvider.ts
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
│   ├── middleware/              # Express/Hono middleware
│   │   ├── auth.middleware.ts   # JWT validation
│   │   ├── cors.middleware.ts   # CORS configuration
│   │   ├── error.middleware.ts  # Error handling
│   │   └── logger.middleware.ts # Request logging
│   │
│   ├── db/                      # Database utilities
│   │   └── mongo.ts             # MongoDB connection
│   │
│   └── utils/                   # Utility functions
│       ├── logger.ts            # Logging utility
│       ├── resolveValue.ts      # Variable resolution
│       └── validation.ts        # Input validation
│
├── .env.example                 # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Components and Interfaces

### 1. HTTP Server (server.ts)

**Responsibility**: Initialize and configure the HTTP server with middleware and routes.

**Framework Choice**: Express (recommended for simplicity and ecosystem maturity)

**Interface**:
```typescript
interface ServerConfig {
  port: number;
  corsOrigin: string;
  environment: 'development' | 'production';
}

function createServer(config: ServerConfig): {
  app: Express;
  httpServer: http.Server;
}
```

**Implementation Details**:
- Initialize Express application
- Apply middleware in order: CORS → body parser → logger → routes → error handler
- Create HTTP server from Express app
- Export both app and httpServer for Socket.io attachment

### 2. Socket.io Server (socket.ts)

**Responsibility**: Manage WebSocket connections for real-time execution log streaming.

**Interface**:
```typescript
interface SocketServer {
  io: Server;
  emitExecutionLog(executionId: string, logData: ExecutionLogData): void;
}

interface ExecutionLogData {
  type: 'step_start' | 'step_complete' | 'step_error' | 'workflow_complete';
  stepIndex?: number;
  stepType?: string;
  data?: any;
  error?: string;
  timestamp: string;
}

function initSocket(httpServer: http.Server): SocketServer;
```

**Implementation Details**:
- Initialize Socket.io with CORS configuration
- Handle `connection` event to log client connections
- Handle `join-execution` event to add clients to execution-specific rooms
- Provide `emitExecutionLog` helper to emit logs to specific execution rooms
- Replace Redis pub/sub pattern with direct Socket.io emission

### 3. Route Conversion Pattern

**Motia Step Pattern** (before):
```typescript
export const config: ApiRouteConfig = {
  name: "aiIntent",
  type: "api",
  path: "/ai/intent",
  method: "POST",
  emits: [],
};

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  // Handler logic
  return {
    status: 200,
    body: { data }
  };
};
```

**Express Route Pattern** (after):
```typescript
router.post('/ai/intent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Handler logic (same as before)
    res.status(200).json({ data });
  } catch (error) {
    next(error); // Pass to error middleware
  }
});
```

**Conversion Rules**:
1. Extract HTTP method and path from Motia config
2. Convert `req.body` access (same in both)
3. Replace `ctx.logger` with imported logger utility
4. Replace `return { status, body }` with `res.status(status).json(body)`
5. Wrap in try-catch and pass errors to `next(error)`

### 4. Authentication Middleware

**Interface**:
```typescript
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
```

**Implementation**:
```typescript
async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 5. Session Management

**Model Schema**:
```typescript
interface ISession {
  sessionId: string;
  userId: string;
  data: Record<string, any>;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  data: { type: Schema.Types.Mixed, default: {} },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });
```

**Service Interface**:
```typescript
interface SessionService {
  create(userId: string, data?: any): Promise<string>; // Returns sessionId
  get(sessionId: string): Promise<ISession | null>;
  update(sessionId: string, data: any): Promise<void>;
  delete(sessionId: string): Promise<void>;
  cleanup(): Promise<number>; // Remove expired sessions, returns count
}
```

**Implementation Notes**:
- Sessions expire after 7 days by default (configurable)
- Background job runs every hour to cleanup expired sessions
- Session ID is a UUID v4
- Session data is stored as JSON in MongoDB

### 6. Workflow Engine Service

**Interface**:
```typescript
interface WorkflowExecutionResult {
  ok: boolean;
  stepsExecuted: number;
  steps: StepLog[];
  output?: any;
  error?: string;
  failedStep?: number;
  totalDurationMs: number;
}

interface StepLog {
  stepIndex: number;
  stepType: string;
  stepName: string;
  status: 'success' | 'failed';
  input: any;
  output: any;
  error: any;
  durationMs: number;
  startedAt: number;
}

async function runEngine(
  steps: any[],
  input: any,
  headers: any,
  executionId: string,
  socketServer: SocketServer
): Promise<WorkflowExecutionResult>;
```

**Implementation Changes**:
- Add `executionId` and `socketServer` parameters
- Replace console logging with Socket.io emission
- Emit `step_start`, `step_complete`, `step_error`, and `workflow_complete` events
- Preserve all step type handlers (input, inputValidation, dbFind, dbInsert, dbUpdate, authMiddleware, jwtGenerate, emailSend, response)
- Maintain variable resolution logic with `resolveObject`

### 7. AI Provider Integration

**Provider Interface**:
```typescript
interface AIProvider {
  name: string;
  generateWorkflow(prompt: string, context?: any): Promise<WorkflowDefinition>;
  generateMutation(prompt: string, existingWorkflow: WorkflowDefinition): Promise<WorkflowDefinition>;
  explainWorkflow(workflow: WorkflowDefinition): Promise<string>;
}

interface WorkflowDefinition {
  steps: WorkflowStep[];
  edges: WorkflowEdge[];
  inputVariables: InputVariable[];
}
```

**Providers to Migrate**:
1. **GroqProvider**: Uses groq-sdk, supports llama models
2. **OpenAIProvider**: Uses openai SDK, supports GPT models
3. **GeminiProvider**: Uses @google/generative-ai, supports Gemini models
4. **HuggingFaceProvider**: Uses @huggingface/inference, supports various models

**Migration Notes**:
- All provider files can be copied directly with minimal changes
- Remove any Motia-specific imports
- Update logger references to use new logger utility
- Preserve all prompt templates and node catalog definitions

### 8. Route Definitions

#### Authentication Routes (auth.routes.ts)

```typescript
POST   /auth/register          # User registration
POST   /auth/login             # User login
POST   /auth/logout            # User logout (clear session)
GET    /auth/me                # Get current user (requires auth)
```

#### Workflow Routes (workflow.routes.ts)

```typescript
GET    /workflows/:workflowId  # Get workflow by ID
POST   /workflows              # Create new workflow
PUT    /workflows/:workflowId  # Update workflow
DELETE /workflows/:workflowId  # Delete workflow
GET    /workflows              # List user's workflows
```

#### Execution Routes (execution.routes.ts)

```typescript
POST   /workflows/:workflowId/execute  # Execute workflow
GET    /executions/:executionId/logs   # Get execution logs (SSE endpoint)
POST   /workflows/run                  # Run workflow with inline definition
```

#### AI Routes (ai.routes.ts)

```typescript
POST   /ai/intent                      # Analyze user intent
POST   /ai/generate-workflow           # Generate workflow from prompt
POST   /ai/mutate-workflow             # Mutate existing workflow
POST   /ai/explain-workflow            # Explain workflow in natural language
```

#### Collection Routes (collection.routes.ts)

```typescript
GET    /collections                    # List collections
POST   /collections                    # Create collection
GET    /collections/:id                # Get collection
PUT    /collections/:id                # Update collection
DELETE /collections/:id                # Delete collection
GET    /collections/:id/data           # Get collection data
POST   /collections/:id/data           # Insert data
```

## Data Models

### Session Model (NEW)

```typescript
interface ISession extends Document {
  sessionId: string;
  userId: string;
  data: Record<string, any>;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>({
  sessionId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  userId: { 
    type: String, 
    required: true, 
    index: true 
  },
  data: { 
    type: Schema.Types.Mixed, 
    default: {} 
  },
  expiresAt: { 
    type: Date, 
    required: true, 
    index: true 
  },
}, { 
  timestamps: true 
});

// TTL index for automatic cleanup
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### Existing Models (Preserved)

All existing models will be migrated without schema changes:

1. **Workflow Model**: Stores workflow definitions with steps, edges, and metadata
2. **User Model**: Stores user credentials and profile information
3. **CollectionData Model**: Stores dynamic collection data
4. **CollectionDefinitions Model**: Stores collection schema definitions
5. **PublishedApi Model**: Stores published API configurations

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Route Conversion Preserves Behavior

*For any* Motia step file with a specific HTTP method, path, and handler logic, converting it to an Express/Hono route should produce identical responses for identical requests.

**Validates: Requirements 3.1, 3.2, 3.3, 3.7, 17.1, 17.2, 17.3, 17.4, 17.5**

### Property 2: Authentication Token Validation Consistency

*For any* valid JWT token that was accepted by the Motia backend, the new backend should accept it and extract the same user information.

**Validates: Requirements 9.1, 9.2, 9.6, 9.7**

### Property 3: Session Storage Round-Trip

*For any* session data stored in MongoDB, retrieving it by session ID should return equivalent data to what was stored.

**Validates: Requirements 4.2, 4.3, 4.4**

### Property 4: Execution Log Streaming Completeness

*For any* workflow execution that generates N log events, all N events should be emitted via Socket.io to clients in the execution room.

**Validates: Requirements 5.2, 5.3, 5.4, 5.5**

### Property 5: Workflow Engine Step Execution Equivalence

*For any* workflow definition with steps S1, S2, ..., Sn and input I, executing it in the new engine should produce the same output and side effects as the Motia engine.

**Validates: Requirements 7.1, 7.3, 7.4, 7.5, 7.6, 7.7**

### Property 6: AI Provider Response Consistency

*For any* AI provider (Groq, OpenAI, Gemini, HuggingFace) and prompt P, the migrated provider should generate workflow definitions with the same structure as the original.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8**

### Property 7: Database Model Schema Preservation

*For any* document that could be stored in the Motia backend's MongoDB, the same document should be storable in the new backend with identical validation rules.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8**

### Property 8: Zero Framework Dependencies

*For any* file in backend-core/src/, searching for "motia", "redis", or "@motiadev" should return zero matches.

**Validates: Requirements 2.1, 2.2, 2.3, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6**

### Property 9: Environment Configuration Completeness

*For any* environment variable required by the application, it should be documented in .env.example with a description or example value.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8**

### Property 10: Error Response Format Consistency

*For any* error that occurs during request processing, the error response format (status code, JSON structure) should match the original backend's format.

**Validates: Requirements 14.2, 14.3, 14.4, 14.5, 17.5**

### Property 11: CORS Configuration Allows Frontend

*For any* request from the configured FRONTEND_URL with credentials, the CORS middleware should allow the request.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**

### Property 12: Server Startup Independence

*For any* valid environment configuration, running "bun run src/index.ts" should start the server successfully without requiring Motia or Redis.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**

## Error Handling

### Error Handling Strategy

1. **Global Error Middleware**: Catch all unhandled errors and format responses
2. **Async Error Wrapping**: Use try-catch in all async route handlers
3. **Error Classification**: Distinguish between operational (4xx) and system (5xx) errors
4. **Error Logging**: Log all errors with context (request ID, user ID, stack trace)
5. **Error Sanitization**: Remove sensitive information in production

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;              // Human-readable error message
  code?: string;              // Error code (e.g., 'VALIDATION_ERROR')
  details?: any;              // Additional error details
  requestId?: string;         // Request ID for tracing
  timestamp: string;          // ISO timestamp
}
```

### Error Middleware Implementation

```typescript
function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string;
  
  logger.error('Request error', {
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  // Determine status code
  const statusCode = (err as any).statusCode || 500;
  
  // Build error response
  const errorResponse: ErrorResponse = {
    error: err.message || 'Internal server error',
    code: (err as any).code,
    requestId,
    timestamp: new Date().toISOString(),
  };
  
  // Include details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = (err as any).details;
  }
  
  res.status(statusCode).json(errorResponse);
}
```

### Common Error Scenarios

1. **Authentication Errors** (401): Invalid or missing JWT token
2. **Authorization Errors** (403): Valid token but insufficient permissions
3. **Validation Errors** (400): Invalid request payload
4. **Not Found Errors** (404): Resource doesn't exist
5. **Database Errors** (500): MongoDB connection or query failures
6. **AI Provider Errors** (500): AI API failures or timeouts
7. **Email Errors** (500): SMTP failures

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests for specific scenarios and property-based tests for comprehensive coverage:

**Unit Tests**:
- Specific examples demonstrating correct behavior
- Edge cases (empty inputs, null values, boundary conditions)
- Error conditions (invalid tokens, missing data, network failures)
- Integration points between components

**Property-Based Tests**:
- Universal properties across all inputs
- Route conversion correctness
- Authentication consistency
- Session storage reliability
- Workflow execution equivalence

### Testing Framework

- **Unit Testing**: Jest or Bun's built-in test runner
- **Property Testing**: fast-check library
- **Integration Testing**: Supertest for HTTP endpoint testing
- **Minimum Iterations**: 100 iterations per property test

### Property Test Configuration

Each property test must:
1. Run minimum 100 iterations
2. Reference its design document property
3. Use tag format: **Feature: backend-motia-migration, Property {number}: {property_text}**

### Test Organization

```
backend-core/
├── tests/
│   ├── unit/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── workflow.test.ts
│   │   └── execution.test.ts
│   └── properties/
│       ├── route-conversion.property.test.ts
│       ├── auth-consistency.property.test.ts
│       ├── session-storage.property.test.ts
│       └── workflow-execution.property.test.ts
```

### Key Test Scenarios

**Unit Tests**:
- Route handler returns correct status codes
- Middleware correctly validates JWT tokens
- Session service creates and retrieves sessions
- Workflow engine executes each step type correctly
- AI providers generate valid workflow definitions
- Error middleware formats errors correctly

**Property Tests**:
- All converted routes produce identical responses to Motia routes
- All valid JWT tokens are accepted consistently
- All session data round-trips correctly
- All workflow executions produce consistent results
- All AI provider responses have valid structure

**Integration Tests**:
- Full authentication flow (register → login → protected route)
- Full workflow lifecycle (create → execute → get logs)
- Socket.io connection and log streaming
- Database operations across multiple models
- Error handling across the request pipeline

### Migration Validation Tests

Special tests to validate migration correctness:

1. **API Compatibility Test**: Record requests/responses from old backend, replay against new backend, compare results
2. **Database Schema Test**: Verify all existing documents can be read by new models
3. **Socket Event Test**: Verify Socket.io events match Redis pub/sub events
4. **Dependency Audit Test**: Scan codebase for Motia/Redis imports (should be zero)

### Test Data Generation

Use factories for generating test data:
- User factory (with hashed passwords)
- Workflow factory (with valid steps and edges)
- Session factory (with expiration dates)
- JWT token factory (with valid signatures)
- Execution log factory (with timestamps)

### Continuous Testing

- Run unit tests on every commit
- Run integration tests before merging
- Run property tests nightly (due to longer execution time)
- Run migration validation tests before deployment
