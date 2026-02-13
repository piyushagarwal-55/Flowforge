# JWT Payload - Permanent Fix

## Problem
The AI was generating `jwtGenerate` nodes without the required `payload` field, causing workflows to fail with "payload is required" error.

## Root Cause
The system prompt didn't explicitly instruct the AI to include the payload field when generating JWT nodes. The AI would create the node structure but leave the payload empty.

## Permanent Solution

### Updated System Prompt
Modified `backend-core/src/ai/prompts/systemPrompt.ts` to include:

1. **Added jwtGenerate to allowed node types**
2. **Added dedicated JWT section** with explicit requirements:
   ```
   CRITICAL: JWT PAYLOAD REQUIREMENT
   
   When using jwtGenerate node, you MUST include a payload field:
   
   ✔ CORRECT:
   {
     "type": "jwtGenerate",
     "data": {
       "label": "Generate JWT",
       "fields": {
         "payload": {
           "userId": "{{created._id}}",
           "email": "{{email}}"
         },
         "expiresIn": "7d",
         "output": "token"
       }
     }
   }
   ```

3. **Added validation rules**:
   - payload field is REQUIRED
   - payload MUST be an object with at least one property
   - payload properties SHOULD reference variables from previous steps
   - Common pattern: Use {{created._id}} from dbInsert output

4. **Updated label guidelines** to include jwtGenerate → "Generate JWT"

## How It Works Now

### Before (Broken):
```json
{
  "type": "jwtGenerate",
  "data": {
    "label": "Generate JWT",
    "fields": {
      "expiresIn": "7d"
    }
  }
}
// ❌ Missing payload - will fail at runtime
```

### After (Fixed):
```json
{
  "type": "jwtGenerate",
  "data": {
    "label": "Generate JWT",
    "fields": {
      "payload": {
        "userId": "{{created._id}}",
        "email": "{{email}}"
      },
      "expiresIn": "7d",
      "output": "token"
    }
  }
}
// ✅ Includes payload - will work correctly
```

## Testing the Fix

### Test 1: New Workflow Generation
1. Clear your database (optional)
2. Create a new workflow: "create signup api with JWT"
3. The AI should now generate JWT node WITH payload
4. Run the workflow - JWT step should succeed

### Test 2: Workflow Mutation
1. Create: "create signup api"
2. Mutate: "add JWT token generation"
3. The AI should add JWT node WITH payload
4. Run the workflow - JWT step should succeed

## Benefits

1. **No more manual fixes** - AI generates correct JWT configuration automatically
2. **Consistent behavior** - All new workflows will have proper JWT setup
3. **Better AI guidance** - Clear examples in the prompt help AI understand requirements
4. **Future-proof** - Works for all future workflow generations

## Migration for Existing Workflows

If you have existing workflows with broken JWT nodes, you have two options:

### Option 1: Regenerate (Recommended)
1. Delete the existing workflow
2. Create it again with the same prompt
3. The new workflow will have correct JWT configuration

### Option 2: Manual Fix (One-time)
1. Run the fix script: `bun run scripts/fix-jwt-payload.ts`
2. Restart backend or refresh dashboard
3. The JWT configuration will be corrected

## Files Modified

1. `backend-core/src/ai/prompts/systemPrompt.ts` - Added JWT payload requirements
2. `backend-core/scripts/fix-jwt-payload.ts` - Created migration script for existing workflows

## Verification

After restarting the backend, test with:
```bash
# Create a new signup API
curl -X POST http://localhost:4000/ai/generate-mcp-server \
  -H "Content-Type: application/json" \
  -d '{"prompt": "create signup api with JWT authentication", "ownerId": "test"}'
```

Check the response - the JWT tool should include:
```json
{
  "toolId": "jwtGenerate",
  "inputSchema": {
    "payload": {
      "userId": "{{created._id}}",
      "email": "{{email}}"
    },
    "expiresIn": "7d",
    "output": "token"
  }
}
```

## Summary

✅ **Root cause fixed** - AI now knows to include JWT payload
✅ **No more temporary fixes** - Problem solved at the source
✅ **All future workflows** - Will have correct JWT configuration
✅ **Clear documentation** - AI has explicit examples and rules
