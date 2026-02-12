# Requirements Document

## Introduction

This document specifies the requirements for migrating the Orchestrix backend from the Motia framework to a standalone Bun-based backend architecture. The migration aims to remove all Motia framework dependencies and Redis dependencies while preserving all existing functionality. The new backend will run independently using standard Node.js/Bun patterns with Express or Hono for routing, Socket.io for real-time communication, and MongoDB for data persistence and session management.

## Glossary

- **Motia_Framework**: A workflow orchestration framework that provides routing, state management, and plugin architecture
- **Backend_Core**: The new standalone backend application to be created at the project root
- **Step_File**: A Motia-specific route handler file (*.step.ts) that needs conversion to standard routes
- **Redis_Pub_Sub**: Redis publish/subscribe mechanism currently used for execution log streaming
- **Socket_IO**: WebSocket library for real-time bidirectional communication
- **Execution_Stream**: Real-time log streaming mechanism for workflow execution updates
- **AI_Provider**: Service integration for AI models (Groq, OpenAI, Gemini, HuggingFace)
- **Workflow_Engine**: Core logic for executing workflow definitions
- **Session_Store**: Mechanism for storing user session data
- **Authentication_Middleware**: JWT-based authentication logic
- **MongoDB_Models**: Mongoose schema definitions for data persistence

## Requirements

### Requirement 1: Project Structure Creation

**User Story:** As a developer, I want a new standalone backend directory created, so that the migration can proceed without affecting the existing backend.

#### Acceptance Criteria

1. THE System SHALL create a new directory named "backend-core" at the project root
2. THE System SHALL preserve the existing "backend" directory unchanged during migration
3. THE Backend_Core SHALL contain a standard Node.js/Bun project structure with src/, package.json, tsconfig.json, and .env.example files
4. THE Backend_Core SHALL include subdirectories: routes/, services/, ai/, db/, utils/, and models/
5. THE Backend_Core SHALL have an entry point file at src/index.ts

### Requirement 2: Dependency Management

**User Story:** As a developer, I want all Motia and Redis dependencies removed, so that the backend runs without framework-specific code.

#### Acceptance Criteria

1. THE System SHALL remove all @motiadev/* package dependencies from package.json
2. THE System SHALL remove the "motia" package dependency from package.json
3. THE System SHALL remove all ioredis and redis package dependencies from package.json
4. THE System SHALL add Express or Hono as the HTTP server framework
5. THE System SHALL retain socket.io, mongoose, and all AI provider SDKs (groq-sdk, openai, @google/generative-ai, @huggingface/inference)
6. THE System SHALL retain authentication dependencies (jsonwebtoken, bcryptjs)
7. THE System SHALL retain email dependencies (nodemailer)
8. THE System SHALL configure Bun as the runtime environment

### Requirement 3: Route Conversion

**User Story:** As a developer, I want all Motia step files converted to standard Express/Hono routes, so that the API endpoints function identically without the framework.

#### Acceptance Criteria

1. WHEN converting Step_Files, THE System SHALL extract the route path, HTTP method, and handler logic
2. WHEN converting Step_Files, THE System SHALL preserve all request validation logic
3. WHEN converting Step_Files, THE System SHALL preserve all response formatting logic
4. THE System SHALL convert authentication middleware from Motia format to standard Express/Hono middleware
5. THE System SHALL create route files in backend-core/src/routes/ organized by domain (auth, workflow, execution, ai)
6. THE System SHALL ensure all 20+ step files are converted to equivalent routes
7. THE System SHALL maintain backward compatibility with existing frontend API calls

### Requirement 4: Session Management Migration

**User Story:** As a developer, I want Redis-based sessions replaced with MongoDB or in-memory sessions, so that Redis is no longer required.

#### Acceptance Criteria

1. THE System SHALL remove all Redis client initialization code
2. THE System SHALL implement session storage using MongoDB with mongoose
3. THE System SHALL create a Session_Store model with fields for session ID, user ID, data, and expiration
4. THE System SHALL implement session middleware that reads/writes to MongoDB
5. THE System SHALL maintain session expiration and cleanup logic
6. THE System SHALL ensure session-based authentication continues to work identically

### Requirement 5: Execution Log Streaming Migration

**User Story:** As a developer, I want execution log streaming migrated from Redis pub/sub to Socket.io, so that real-time logs work without Redis.

#### Acceptance Criteria

1. THE System SHALL remove all Redis pub/sub code from execution log streaming
2. WHEN a workflow execution generates logs, THE System SHALL emit log events directly via Socket_IO
3. THE System SHALL maintain the existing Socket_IO room-based architecture for execution streams
4. THE System SHALL preserve the log event payload structure for frontend compatibility
5. THE System SHALL ensure clients can join execution rooms and receive real-time log updates
6. THE System SHALL handle socket disconnection and reconnection gracefully

### Requirement 6: AI Provider Integration

**User Story:** As a developer, I want all AI provider integrations preserved, so that AI functionality continues to work identically.

#### Acceptance Criteria

1. THE System SHALL migrate all AI provider files from backend/src/ai/providers/ to backend-core/src/ai/providers/
2. THE System SHALL preserve Groq_Provider integration and configuration
3. THE System SHALL preserve OpenAI_Provider integration and configuration
4. THE System SHALL preserve Gemini_Provider integration and configuration
5. THE System SHALL preserve HuggingFace_Provider integration and configuration
6. THE System SHALL maintain the AI provider selection logic
7. THE System SHALL preserve all AI prompt templates and node catalog definitions
8. THE System SHALL ensure AI-powered workflow generation continues to function

### Requirement 7: Workflow Engine Migration

**User Story:** As a developer, I want the workflow engine migrated, so that workflow execution logic continues to work without Motia.

#### Acceptance Criteria

1. THE System SHALL migrate backend/src/engine/workflowEngine.ts to backend-core/src/services/workflowEngine.ts
2. THE System SHALL remove any Motia-specific workflow execution patterns
3. THE System SHALL preserve workflow node execution logic
4. THE System SHALL preserve workflow state management
5. THE System SHALL preserve workflow error handling
6. THE System SHALL ensure workflows can be executed via API routes
7. THE System SHALL maintain workflow execution result formatting

### Requirement 8: Database Models Migration

**User Story:** As a developer, I want all MongoDB models migrated, so that data persistence continues to work identically.

#### Acceptance Criteria

1. THE System SHALL migrate all Mongoose models from backend/src/models/ to backend-core/src/models/
2. THE System SHALL preserve the Workflow model schema and methods
3. THE System SHALL preserve the User model schema and methods
4. THE System SHALL preserve the CollectionData model schema and methods
5. THE System SHALL preserve the CollectionDefinitions model schema and methods
6. THE System SHALL preserve the PublishedApi model schema and methods
7. THE System SHALL maintain all model indexes and validation rules
8. THE System SHALL ensure MongoDB connection logic is framework-independent

### Requirement 9: Authentication System Migration

**User Story:** As a developer, I want the authentication system migrated, so that user login and JWT validation continue to work.

#### Acceptance Criteria

1. THE System SHALL migrate JWT token generation logic to backend-core
2. THE System SHALL migrate JWT token validation middleware to backend-core
3. THE System SHALL preserve password hashing with bcryptjs
4. THE System SHALL preserve user registration logic
5. THE System SHALL preserve user login logic
6. THE System SHALL maintain JWT secret configuration via environment variables
7. THE System SHALL ensure protected routes require valid JWT tokens

### Requirement 10: Email Service Migration

**User Story:** As a developer, I want the email service migrated, so that email functionality continues to work.

#### Acceptance Criteria

1. THE System SHALL migrate nodemailer configuration to backend-core
2. THE System SHALL preserve email template logic
3. THE System SHALL preserve SMTP configuration via environment variables
4. THE System SHALL maintain email sending functionality for user notifications
5. THE System SHALL ensure email error handling is preserved

### Requirement 11: Server Configuration

**User Story:** As a developer, I want the backend to run independently on port 4000, so that it can be started with a simple command.

#### Acceptance Criteria

1. THE Backend_Core SHALL listen on port 4000 by default
2. THE Backend_Core SHALL allow port configuration via PORT environment variable
3. THE Backend_Core SHALL initialize Socket_IO on the same HTTP server
4. THE Backend_Core SHALL connect to MongoDB on startup
5. THE Backend_Core SHALL start with the command "bun run src/index.ts"
6. THE Backend_Core SHALL log startup messages indicating successful initialization
7. THE Backend_Core SHALL handle graceful shutdown on SIGTERM and SIGINT signals

### Requirement 12: Environment Configuration

**User Story:** As a developer, I want all environment variables documented, so that the backend can be configured correctly.

#### Acceptance Criteria

1. THE System SHALL create a .env.example file in backend-core/
2. THE .env.example SHALL include PORT with default value 4000
3. THE .env.example SHALL include MONGODB_URI for database connection
4. THE .env.example SHALL include JWT_SECRET for authentication
5. THE .env.example SHALL include GROQ_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, and HUGGINGFACE_API_KEY
6. THE .env.example SHALL include SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS for email
7. THE .env.example SHALL include FRONTEND_URL for CORS configuration
8. THE .env.example SHALL include NODE_ENV for environment detection

### Requirement 13: CORS Configuration

**User Story:** As a developer, I want CORS properly configured, so that the frontend can communicate with the backend.

#### Acceptance Criteria

1. THE Backend_Core SHALL enable CORS middleware
2. THE Backend_Core SHALL allow requests from FRONTEND_URL environment variable
3. THE Backend_Core SHALL allow credentials in CORS requests
4. THE Backend_Core SHALL allow standard HTTP methods (GET, POST, PUT, DELETE, PATCH)
5. THE Backend_Core SHALL allow standard headers (Content-Type, Authorization)

### Requirement 14: Error Handling

**User Story:** As a developer, I want consistent error handling, so that errors are properly logged and returned to clients.

#### Acceptance Criteria

1. THE Backend_Core SHALL implement global error handling middleware
2. WHEN an error occurs, THE System SHALL log the error with stack trace
3. WHEN an error occurs, THE System SHALL return a JSON error response with status code and message
4. THE System SHALL distinguish between operational errors (4xx) and system errors (5xx)
5. THE System SHALL sanitize error messages in production to avoid leaking sensitive information
6. THE System SHALL preserve error handling logic from the original backend

### Requirement 15: Logging System

**User Story:** As a developer, I want a logging system implemented, so that application events can be tracked.

#### Acceptance Criteria

1. THE Backend_Core SHALL implement a logger utility
2. THE Logger SHALL support log levels: debug, info, warn, error
3. THE Logger SHALL include timestamps in log messages
4. THE Logger SHALL include request IDs for tracing
5. THE Logger SHALL log to console in development
6. THE Logger SHALL support structured logging for production

### Requirement 16: Code Organization

**User Story:** As a developer, I want code organized by domain, so that the codebase is maintainable.

#### Acceptance Criteria

1. THE Backend_Core SHALL organize routes by domain (auth, workflow, execution, ai, collection)
2. THE Backend_Core SHALL separate business logic into service files
3. THE Backend_Core SHALL separate database operations into repository or model files
4. THE Backend_Core SHALL separate utility functions into utils/ directory
5. THE Backend_Core SHALL use TypeScript for type safety
6. THE Backend_Core SHALL follow consistent naming conventions

### Requirement 17: Frontend Compatibility

**User Story:** As a developer, I want the backend to maintain API compatibility, so that the frontend continues to work without changes.

#### Acceptance Criteria

1. THE Backend_Core SHALL maintain identical API endpoint paths
2. THE Backend_Core SHALL maintain identical request payload structures
3. THE Backend_Core SHALL maintain identical response payload structures
4. THE Backend_Core SHALL maintain identical HTTP status codes
5. THE Backend_Core SHALL maintain identical error response formats
6. THE Backend_Core SHALL maintain identical WebSocket event names and payloads
7. WHEN the frontend makes API calls, THE Backend_Core SHALL respond identically to the original backend

### Requirement 18: Zero Framework Dependencies

**User Story:** As a developer, I want zero Motia imports in the final code, so that the backend is completely framework-independent.

#### Acceptance Criteria

1. THE Backend_Core SHALL contain zero imports from @motiadev/* packages
2. THE Backend_Core SHALL contain zero imports from "motia" package
3. THE Backend_Core SHALL contain zero imports from ioredis or redis packages
4. THE Backend_Core SHALL use only standard npm packages and AI provider SDKs
5. WHEN searching the codebase for "motia", THE System SHALL return zero results in backend-core/
6. WHEN searching the codebase for "redis", THE System SHALL return zero results in backend-core/

### Requirement 19: Testing Preparation

**User Story:** As a developer, I want the backend structured for testing, so that tests can be added in the future.

#### Acceptance Criteria

1. THE Backend_Core SHALL separate business logic from HTTP handling
2. THE Backend_Core SHALL use dependency injection patterns where appropriate
3. THE Backend_Core SHALL export testable functions from service modules
4. THE Backend_Core SHALL structure code to allow mocking of external dependencies
5. THE Backend_Core SHALL include a tests/ directory structure for future test files

### Requirement 20: Documentation

**User Story:** As a developer, I want documentation for the new backend, so that I can understand how to run and maintain it.

#### Acceptance Criteria

1. THE Backend_Core SHALL include a README.md file
2. THE README SHALL document how to install dependencies
3. THE README SHALL document how to configure environment variables
4. THE README SHALL document how to run the backend in development
5. THE README SHALL document how to build and run in production
6. THE README SHALL document the project structure
7. THE README SHALL document key architectural decisions
8. THE README SHALL document differences from the original Motia-based backend
