# Backend Migration Fixes - Frontend to Backend-Core Connection

## Issue
After migrating from `backend` folder to `backend-core`, the execute route and other API endpoints were not working when clicking the Run button from the frontend.

## Root Causes
1. Frontend was calling `/workflow/execute` but backend-core expects `/workflows/run` or `/workflows/:workflowId/execute`
2. Payload structure mismatch: Frontend sent `{ steps, vars }` but backend expects `{ steps, input }`
3. Inconsistent default port numbers (3000 vs 4000) across frontend files
4. Endpoint naming changes:
   - `/workflow/generate` → `/ai/generate-workflow`
   - `/workflow/explain` → `/ai/explain-workflow`
   - `/workflows/save` → `/workflows` (POST)

## Changes Made

### 1. Execute Endpoint Fix
**File:** `frontend/app/builder/page.tsx`
- Changed endpoint from `/workflow/execute` to `/workflows/run`
- Transformed payload structure:
  ```typescript
  // Before
  const payload = buildForExecute(nodes, edges);
  // payload = { steps, vars: { input } }
  
  // After
  const backendPayload = {
    steps: payload.steps,
    input: payload.vars?.input || {},
  };
  ```
- Updated default port from 3000 to 4000

### 2. AI Endpoints Updates
**Files Updated:**
- `frontend/app/builder/page.tsx`
- `frontend/components/BackendExplainer.tsx`
- `frontend/scripts/test-real-integration.ts`
- `frontend/scripts/check-api-keys.ts`

**Changes:**
- `/workflow/generate` → `/ai/generate-workflow`
- `/workflow/explain` → `/ai/explain-workflow`
- `/workflows/save` → `/workflows` (POST)

### 3. Port Number Standardization
Updated all files to use port 4000 as default (matching backend-core):

**Files Updated:**
- `frontend/app/builder/page.tsx` (multiple occurrences)
- `frontend/components/ChatShell.tsx`
- `frontend/components/BackendExplainer.tsx`
- `frontend/components/MotiaClientProvider.tsx`
- `frontend/components/workflow/SaveWorkflowModal.tsx`
- `frontend/store/dbSchemasSlice.ts`
- `frontend/scripts/test-chat-flow.ts`
- `frontend/scripts/test-full-flow.ts`
- `frontend/scripts/test-explain-ui.ts`
- `frontend/scripts/test-real-integration.ts`
- `frontend/scripts/check-api-keys.ts`
- `frontend/scripts/validate-setup.ts`

## Backend-Core API Reference

### Execution Routes (mounted at `/workflows`)
- `POST /workflows/run` - Execute workflow with inline steps
  - Body: `{ steps: [], input: {} }`
  - Returns: `{ ok: true, executionId: string }`

- `POST /workflows/:workflowId/execute` - Execute saved workflow by ID
  - Body: `{ input: {}, ownerId: string }`
  - Returns: `{ ok: true, executionId: string }`

### Workflow Routes (mounted at `/workflows`)
- `GET /workflows/:workflowId` - Get workflow by ID
- `POST /workflows` - Create/update workflow
- `PUT /workflows/:workflowId` - Update workflow
- `DELETE /workflows/:workflowId` - Delete workflow
- `GET /workflows` - List user workflows

### AI Routes (mounted at `/ai`)
- `POST /ai/intent` - Analyze user intent
- `POST /ai/generate-workflow` - Generate workflow from prompt
- `POST /ai/mutate-workflow` - Mutate existing workflow
- `POST /ai/explain-workflow` - Explain workflow in natural language

### Collection Routes (mounted at `/collections` and aliased at `/db/schemas`)
- `GET /collections` - List all collection schemas
- `POST /collections` - Create collection
- `GET /collections/:id` - Get collection by name
- `PUT /collections/:id` - Update collection
- `DELETE /collections/:id` - Delete collection

## Environment Configuration

### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

### Backend-Core (.env)
```env
PORT=4000
FRONTEND_URL=http://localhost:5000
```

## Testing
After these changes:
1. Start backend-core: `cd backend-core && npm run dev` (port 4000)
2. Start frontend: `cd frontend && npm run dev` (port 5000)
3. Click "Run" button in workflow builder
4. Execution should start and logs should appear in sidebar

## Notes
- Backend-core has route aliases for backward compatibility:
  - `/workflow/*` → `/workflows/*`
  - `/db/schemas` → `/collections`
- Socket.io connection uses WebSocket protocol on same port (ws://localhost:4000)
- All execution is asynchronous - returns executionId immediately and streams logs via Socket.io
