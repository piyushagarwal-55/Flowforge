# Implementation Plan: Backend Motia Migration

## Overview

This implementation plan breaks down the migration from Motia framework to standalone Bun backend into discrete, incremental steps. Each task builds on previous work, with checkpoints to validate progress. The migration preserves all existing functionality while eliminating framework dependencies.

## Tasks

- [x] 1. Initialize backend-core project structure
  - Create backend-core/ directory at project root
  - Create src/ subdirectories: routes/, services/, ai/, models/, middleware/, db/, utils/
  - Initialize package.json with Bun configuration
  - Create tsconfig.json with appropriate TypeScript settings
  - Create .env.example with all required environment variables
  - Create .gitignore file
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [x] 2. Set up core dependencies and utilities
  - [x] 2.1 Install core dependencies
    - Install Express, Socket.io, Mongoose, JWT, bcryptjs, nodemailer
    - Install AI provider SDKs (groq-sdk, openai, @google/generative-ai, @huggingface/inference)
    - Install development dependencies (TypeScript, types)
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.8_
  
  - [x] 2.2 Create logger utility
    - Implement logger with debug, info, warn, error levels
    - Add timestamp and request ID support
    - Configure console output for development
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [x] 2.3 Create MongoDB connection utility
    - Migrate backend/src/lib/mongo.ts to backend-core/src/db/mongo.ts
    - Remove Motia-specific code
    - Add connection error handling and retry logic
    - _Requirements: 8.8, 11.4_

  - [x] 2.4 Create utility functions
    - Migrate resolveValue.ts for variable resolution
    - Create validation utility functions
    - _Requirements: 7.4_

- [x] 3. Implement database models
  - [x] 3.1 Migrate existing models
    - Copy and adapt Workflow model
    - Copy and adapt User model
    - Copy and adapt CollectionData model
    - Copy and adapt CollectionDefinitions model
    - Copy and adapt PublishedApi model
    - Remove any Motia-specific imports
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [x] 3.2 Create Session model
    - Define Session schema with sessionId, userId, data, expiresAt
    - Add TTL index for automatic cleanup
    - Add indexes for sessionId and userId
    - _Requirements: 4.3_

- [x] 4. Implement HTTP server and middleware
  - [x] 4.1 Create server setup
    - Create src/server.ts with Express initialization
    - Configure body parser middleware
    - Configure CORS middleware with FRONTEND_URL
    - Add request logging middleware
    - Create HTTP server instance
    - _Requirements: 11.1, 11.2, 11.3, 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [x] 4.2 Create authentication middleware
    - Implement JWT token validation
    - Extract user information from token
    - Attach user to request object
    - Handle authentication errors
    - _Requirements: 9.1, 9.2, 9.7_
  
  - [x] 4.3 Create error handling middleware
    - Implement global error handler
    - Format error responses consistently
    - Log errors with context
    - Sanitize errors in production
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 5. Implement Socket.io server
  - [x] 5.1 Create Socket.io initialization
    - Migrate backend/src/lib/socket.ts to backend-core/src/socket.ts
    - Remove Redis dependencies
    - Configure CORS for Socket.io
    - Handle connection and join-execution events
    - _Requirements: 5.1, 5.3, 5.6_
  
  - [x] 5.2 Create execution log emission helper
    - Implement emitExecutionLog function
    - Support different log event types (step_start, step_complete, step_error, workflow_complete)
    - Emit to execution-specific rooms
    - _Requirements: 5.2, 5.4, 5.5_

- [x] 6. Implement session management service
  - [x] 6.1 Create SessionService
    - Implement create() method with UUID generation
    - Implement get() method with expiration check
    - Implement update() method
    - Implement delete() method
    - Implement cleanup() method for expired sessions
    - _Requirements: 4.2, 4.4, 4.5_
  
  - [x] 6.2 Add session cleanup job
    - Create background job to run cleanup every hour
    - Log cleanup results
    - _Requirements: 4.5_

- [x] 7. Migrate AI providers
  - [x] 7.1 Migrate AI provider files
    - Copy backend/src/ai/providers/groqProvider.ts
    - Copy backend/src/ai/providers/openaiProvider.ts
    - Copy backend/src/ai/providers/geminiProvider.ts
    - Copy backend/src/ai/providers/huggingfaceProvider.ts
    - Remove Motia imports and update logger references
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 7.2 Migrate AI support files
    - Copy backend/src/ai/nodeCatalog.ts
    - Copy backend/src/ai/workflowSchema.ts
    - Copy backend/src/ai/prompts/ directory
    - Update imports and remove Motia dependencies
    - _Requirements: 6.6, 6.7_

- [x] 8. Migrate workflow engine
  - [x] 8.1 Migrate workflow engine core
    - Copy backend/src/engine/workflowEngine.ts to backend-core/src/services/workflowEngine.ts
    - Add executionId and socketServer parameters
    - Remove console logging
    - Add Socket.io log emission for each step
    - _Requirements: 7.1, 7.2_
  
  - [x] 8.2 Preserve step type handlers
    - Verify input step handler
    - Verify inputValidation step handler
    - Verify dbFind step handler
    - Verify dbInsert step handler
    - Verify dbUpdate step handler
    - Verify authMiddleware step handler
    - Verify jwtGenerate step handler
    - Verify emailSend step handler
    - Verify response step handler
    - _Requirements: 7.3, 7.4, 7.5, 7.6_

- [x] 9. Checkpoint - Core infrastructure complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Convert authentication routes
  - [x] 10.1 Create auth.routes.ts
    - Convert user registration step to POST /auth/register
    - Convert user login step to POST /auth/login
    - Add POST /auth/logout endpoint
    - Add GET /auth/me endpoint (protected)
    - _Requirements: 3.1, 3.2, 3.3, 9.3, 9.4, 9.5_
  
  - [ ]* 10.2 Write property test for authentication
    - **Property 2: Authentication Token Validation Consistency**
    - **Validates: Requirements 9.1, 9.2, 9.6, 9.7**

- [x] 11. Convert workflow routes
  - [x] 11.1 Create workflow.routes.ts
    - Convert workflow.get.step.ts to GET /workflows/:workflowId
    - Convert saveWorkflow.step.ts to POST /workflows and PUT /workflows/:workflowId
    - Add DELETE /workflows/:workflowId endpoint
    - Add GET /workflows endpoint (list user workflows)
    - _Requirements: 3.1, 3.2, 3.3, 3.6_
  
  - [ ]* 11.2 Write unit tests for workflow routes
    - Test workflow creation with valid data
    - Test workflow retrieval by ID
    - Test workflow update
    - Test workflow deletion
    - Test workflow not found scenarios
    - _Requirements: 3.7, 17.1, 17.2, 17.3, 17.4_

- [x] 12. Convert execution routes
  - [x] 12.1 Create execution.routes.ts
    - Convert executeWorkflow.step.ts to POST /workflows/:workflowId/execute
    - Convert runWorkflow.step.ts to POST /workflows/run
    - Convert workflow.run.step.ts to workflow execution logic
    - Convert workflow.start.step.ts to execution initialization
    - Integrate with workflow engine and Socket.io
    - _Requirements: 3.1, 3.2, 3.3, 7.6_
  
  - [ ]* 12.2 Write property test for workflow execution
    - **Property 5: Workflow Engine Step Execution Equivalence**
    - **Validates: Requirements 7.1, 7.3, 7.4, 7.5, 7.6, 7.7**
  
  - [ ]* 12.3 Write property test for execution log streaming
    - **Property 4: Execution Log Streaming Completeness**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**

- [x] 13. Convert AI routes
  - [x] 13.1 Create ai.routes.ts
    - Convert ai-intent.step.ts to POST /ai/intent
    - Convert generateWorkflowWithAi.step.ts to POST /ai/generate-workflow
    - Convert workflow-mutation.step.ts to POST /ai/mutate-workflow
    - Convert explain-workflow.step.ts to POST /ai/explain-workflow
    - _Requirements: 3.1, 3.2, 3.3, 6.8_
  
  - [ ]* 13.2 Write property test for AI provider consistency
    - **Property 6: AI Provider Response Consistency**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8**

- [x] 14. Convert collection routes
  - [x] 14.1 Create collection.routes.ts
    - Convert getDbSchemas.step.ts to GET /collections
    - Convert dbFind.step.ts patterns to GET /collections/:id/data
    - Convert dbInsert.step.ts patterns to POST /collections/:id/data
    - Add POST /collections, GET /collections/:id, PUT /collections/:id, DELETE /collections/:id
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 15. Convert remaining utility routes
  - [x] 15.1 Create remaining route handlers
    - Convert delay.step.ts to delay utility (if needed)
    - Convert emailSend.step.ts to email service integration
    - Convert input.step.ts and inputValidation.step.ts logic (already in workflow engine)
    - Convert execution.logs.api.step.ts to GET /executions/:executionId/logs
    - _Requirements: 3.1, 3.2, 3.3, 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 15.2 Write property test for route conversion
    - **Property 1: Route Conversion Preserves Behavior**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.7, 17.1, 17.2, 17.3, 17.4, 17.5**

- [x] 16. Checkpoint - All routes converted
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Create application entry point
  - [x] 17.1 Create src/index.ts
    - Import and initialize server
    - Import and initialize Socket.io
    - Connect to MongoDB
    - Register all route modules
    - Start HTTP server on port 4000
    - Add graceful shutdown handlers
    - Log startup messages
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_
  
  - [ ]* 17.2 Write property test for server startup
    - **Property 12: Server Startup Independence**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**

- [x] 18. Verify zero framework dependencies
  - [x] 18.1 Audit codebase for Motia/Redis imports
    - Search for "motia" in backend-core/src/
    - Search for "redis" in backend-core/src/
    - Search for "@motiadev" in backend-core/src/
    - Verify package.json has no Motia or Redis dependencies
    - _Requirements: 2.1, 2.2, 2.3, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_
  
  - [ ]* 18.2 Write property test for zero dependencies
    - **Property 8: Zero Framework Dependencies**
    - **Validates: Requirements 2.1, 2.2, 2.3, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6**

- [x] 19. Create documentation
  - [x] 19.1 Create README.md
    - Document installation steps
    - Document environment variable configuration
    - Document how to run in development
    - Document how to build and run in production
    - Document project structure
    - Document architectural decisions
    - Document differences from Motia backend
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8_
  
  - [x] 19.2 Create API documentation
    - Document all API endpoints with examples
    - Document authentication flow
    - Document WebSocket events
    - Document error response formats

- [x] 20. Integration testing and validation
  - [ ]* 20.1 Write integration tests
    - Test full authentication flow (register → login → protected route)
    - Test full workflow lifecycle (create → execute → get logs)
    - Test Socket.io connection and log streaming
    - Test database operations across models
    - Test error handling across request pipeline
    - _Requirements: 17.6, 17.7_
  
  - [ ]* 20.2 Write property test for database models
    - **Property 7: Database Model Schema Preservation**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8**
  
  - [ ]* 20.3 Write property test for session storage
    - **Property 3: Session Storage Round-Trip**
    - **Validates: Requirements 4.2, 4.3, 4.4**
  
  - [ ]* 20.4 Write property test for error handling
    - **Property 10: Error Response Format Consistency**
    - **Validates: Requirements 14.2, 14.3, 14.4, 14.5, 17.5**
  
  - [ ]* 20.5 Write property test for CORS configuration
    - **Property 11: CORS Configuration Allows Frontend**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**
  
  - [ ]* 20.6 Write property test for environment configuration
    - **Property 9: Environment Configuration Completeness**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8**

- [x] 21. Final checkpoint - Migration complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify backend-core runs independently with: bun run src/index.ts
  - Verify all API endpoints respond correctly
  - Verify Socket.io log streaming works
  - Verify frontend can connect and function normally

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- The original backend/ directory remains unchanged throughout migration
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
