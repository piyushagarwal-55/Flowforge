# Workflow Generation Fix

## Issue

The frontend successfully connects to backend-core and receives intent responses, but no workflow is displayed on the canvas. The workflow generation is not being triggered automatically.

## Root Cause

The workflow generation flow requires two API calls:
1. `/ai/intent` - Detects user intent and returns `workflowPrompt`
2. `/ai/generate-workflow` - Actually generates the workflow nodes

The frontend is making the first call but not the second. The polling mechanism is disabled because `autoGeneratePrompt` is not set.

## Current Behavior

```
User types: "create sign up api"
  ↓
Frontend calls: POST /ai/intent
  ↓
Backend returns: { workflowPrompt: "create sign up api", components: ["WorkflowGraph"], workflowId: "..." }
  ↓
Frontend mounts WorkflowGraph component
  ↓
❌ No workflow generation call made
  ↓
Canvas shows: "Start building your workflow" (empty)
```

## Expected Behavior

```
User types: "create sign up api"
  ↓
Frontend calls: POST /ai/intent
  ↓
Backend returns: { workflowPrompt: "create sign up api", ... }
  ↓
Frontend automatically calls: POST /ai/generate-workflow
  ↓
Backend generates workflow with AI
  ↓
Frontend polls and displays workflow nodes
```

## Solution Options

### Option 1: Frontend Fix (Recommended)

Add automatic workflow generation trigger in the frontend when `workflowPrompt` is received.

**File:** `frontend/app/page.tsx` or `frontend/app/builder/page.tsx`

```typescript
const handleIntentReceived = async (newIntent: IntentResponse) => {
  console.log(`[OrchetrixWorkspace] 🎯 Intent received`, newIntent);
  
  setIntent(newIntent);
  setMountedComponents(new Set(newIntent.components));
  
  // ✅ AUTO-TRIGGER: If workflowPrompt exists, generate workflow
  if (newIntent.workflowPrompt && newIntent.workflowId) {
    console.log(`[OrchetrixWorkspace] 🤖 Auto-triggering workflow generation`);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/ai/generate-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: newIntent.workflowPrompt,
          workflowId: newIntent.workflowId,
          ownerId: 'user_default',
        }),
      });
      
      if (response.ok) {
        console.log(`[OrchetrixWorkspace] ✅ Workflow generated automatically`);
        // The polling mechanism will pick up the changes
      }
    } catch (error) {
      console.error(`[OrchetrixWorkspace] ❌ Auto-generation failed:`, error);
    }
  }
};
```

### Option 2: Backend Fix (Quick Workaround)

Make the `/ai/intent` endpoint automatically generate the workflow when `workflowPrompt` is present.

**File:** `backend-core/src/routes/ai.routes.ts`

This would require calling the generation logic from within the intent handler, but it's more complex and couples the two operations.

### Option 3: Combined Endpoint (Alternative)

Create a new endpoint `/ai/intent-and-generate` that does both operations in one call.

## Recommended Implementation

**Option 1** is recommended because:
1. It maintains separation of concerns
2. It's easier to debug
3. It matches the original Motia behavior
4. It allows the frontend to control when generation happens

## Testing the Fix

After implementing Option 1:

```bash
# 1. Start backend
cd backend-core
bun run dev

# 2. Start frontend
cd frontend
npm run dev

# 3. Open browser
http://localhost:5000

# 4. Type in chat
"create sign up api"

# 5. Expected result
- Intent detected ✅
- Workflow generation triggered automatically ✅
- Workflow nodes appear on canvas ✅
- Polling updates the workflow ✅
```

## Verification

Check browser console for these logs:
```
[ChatShell] ✅ Backend intent received
[OrchetrixWorkspace] 🎯 Intent received
[OrchetrixWorkspace] 🤖 Auto-triggering workflow generation  ← NEW
[OrchetrixWorkspace] ✅ Workflow generated automatically      ← NEW
[WorkflowPage] 🔄 Starting polling for workflow updates
[WorkflowPage] 📊 Polling result - newNodeCount: 4          ← Should show nodes
```

## Alternative Quick Test

If you don't want to modify the frontend, you can manually trigger generation:

```bash
# After sending "create sign up api" in the chat, run this:
curl -X POST http://localhost:4000/ai/generate-workflow \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "create sign up api",
    "workflowId": "workflow_1770819879350_17f751d0",
    "ownerId": "user_default"
  }'
```

Then the polling should pick up the workflow and display it.

## Current Status

- ✅ Backend migration complete
- ✅ All API endpoints working
- ✅ Frontend connects successfully
- ✅ Intent detection working
- ❌ Automatic workflow generation missing (needs frontend fix)
- ✅ Polling mechanism ready (will work once workflow is generated)

## Next Steps

1. Implement Option 1 in the frontend
2. Test the complete flow
3. Verify workflow appears on canvas
4. Test workflow mutation ("add JWT token")
5. Test workflow execution

---

**Note:** The backend is fully functional. This is purely a frontend integration issue where the automatic workflow generation trigger is missing.
