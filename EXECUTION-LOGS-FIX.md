# Execution Logs Fix - Socket.io Integration

## Problem
The workflow execution was working correctly (backend logs showed successful execution and database insertion), but the frontend was stuck on "Initializing workflow..." and not showing the execution steps.

## Root Cause
The frontend wasn't connected to Socket.io to receive execution logs from the backend. The backend was emitting logs via Socket.io, but the frontend had no Socket.io client connection established.

## Solution

### 1. Created Socket.io Hook
**File:** `frontend/hooks/useSocketExecutionLogs.ts`

This hook:
- Establishes Socket.io connection to backend
- Joins the execution room for a specific executionId
- Listens for `execution-log` events
- Transforms backend log format to frontend format
- Manages connection lifecycle (connect, disconnect, cleanup)

Key features:
- Auto-reconnection on disconnect
- Proper cleanup on unmount
- Type-safe log handling
- Phase mapping (backend `type` → frontend `phase`)

### 2. Updated Builder Page
**File:** `frontend/app/builder/page.tsx`

Changes:
- Imported `useSocketExecutionLogs` hook
- Added Socket.io connection: `const { logs: socketLogs, isConnected } = useSocketExecutionLogs(execution?.executionId || null)`
- Updated `ExecutionLogsSidebar` to use `socketLogs` instead of `execution?.logs`
- Updated polling status to check Socket.io connection state

### 3. Log Format Mapping

Backend emits:
```typescript
{
  type: 'step_start' | 'step_complete' | 'step_error' | 'workflow_complete',
  stepIndex: number,
  stepType: string,
  stepName: string,
  data: any,
  error?: string,
  timestamp: string,
  durationMs?: number
}
```

Frontend expects:
```typescript
{
  phase: 'step_started' | 'step_finished' | 'error' | 'execution_finished',
  stepIndex: number,
  stepType: string,
  title: string,
  message: string,
  data: any,
  error?: string,
  timestamp: number,
  durationMs?: number
}
```

The hook handles this transformation automatically.

## How It Works

1. User clicks "Run" button
2. Frontend calls `POST /workflows/run` with workflow steps
3. Backend returns `{ ok: true, executionId: "..." }`
4. Frontend sets execution state with executionId
5. `useSocketExecutionLogs` hook detects executionId and:
   - Connects to Socket.io server
   - Joins execution room
   - Starts listening for logs
6. Backend executes workflow and emits logs via Socket.io
7. Frontend receives logs and updates UI in real-time
8. ExecutionLogsSidebar displays logs grouped by step

## Socket.io Events

### Client → Server
- `join-execution` - Join execution room to receive logs
- `leave-execution` - Leave execution room

### Server → Client
- `joined-execution` - Confirmation of joining room
- `execution-log` - Real-time execution log entry

## Testing

After these changes:
1. Start backend-core: `cd backend-core && npm run dev` (port 4000)
2. Start frontend: `cd frontend && npm run dev` (port 5000)
3. Create a workflow in the builder
4. Click "Run" button
5. Execution logs sidebar should open and show:
   - "Running" status badge
   - Step-by-step execution progress
   - Real-time log updates
   - Completion status when done

## Dependencies

- `socket.io-client@4.8.3` - Already installed in frontend
- `socket.io` - Already installed in backend-core

## Backend Socket.io Setup

The backend Socket.io server is initialized in `backend-core/src/index.ts`:
```typescript
const socketServer = initSocket(httpServer);
app.use('/workflows', initExecutionRoutes(socketServer));
```

The workflow engine emits logs via:
```typescript
socketServer.emitExecutionLog(executionId, logData);
```

## Frontend URL Configuration

Ensure `.env.local` has correct backend URL:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

Socket.io will automatically convert this to WebSocket URL: `ws://localhost:4000`
