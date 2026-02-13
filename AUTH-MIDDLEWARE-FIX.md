# authMiddleware Usage Fix

## Problem
The AI was incorrectly adding `authMiddleware` to signup and login flows, causing workflows to fail with "Missing or invalid Authorization header" error.

## Root Cause
The system prompt didn't clearly explain when to use authMiddleware. The AI would add it to any workflow that involved authentication, even public endpoints like signup and login.

## Solution

### Updated System Prompt
Modified `backend-core/src/ai/prompts/systemPrompt.ts` to include:

1. **Updated INTENT LOCK section** with explicit rules:
   ```
   IMPORTANT: authMiddleware is ONLY for protected endpoints.
   - Signup/registration = NO authMiddleware
   - Login = NO authMiddleware
   - Password reset = NO authMiddleware
   - Get user profile = YES authMiddleware
   - Update user data = YES authMiddleware
   ```

2. **Added dedicated authMiddleware section** with clear usage rules:
   ```
   CRITICAL: authMiddleware USAGE RULES
   
   authMiddleware is ONLY for PROTECTED endpoints that require authentication.
   
   DO NOT use authMiddleware in these flows:
   ❌ Signup/Registration flows
   ❌ Login flows
   ❌ Password reset flows
   ❌ Public API endpoints
   ❌ Webhook receivers
   
   ONLY use authMiddleware when:
   ✔ User must be logged in to access the endpoint
   ✔ Endpoint requires valid JWT token in Authorization header
   ✔ Examples: "get user profile", "update settings", "delete account"
   ```

3. **Added flow pattern examples**:
   ```
   Signup Flow (NO authMiddleware):
   input → inputValidation → dbInsert → jwtGenerate → emailSend → response
   
   Login Flow (NO authMiddleware):
   input → inputValidation → dbFind → jwtGenerate → response
   
   Protected Endpoint (YES authMiddleware):
   input → authMiddleware → dbFind → response
   ```

## How It Works Now

### Before (Broken):
```
User: "create signup api"
AI generates:
  input → validation → dbInsert → jwtGenerate → authMiddleware ❌ → response
  
Result: Fails with "Missing or invalid Authorization header"
```

### After (Fixed):
```
User: "create signup api"
AI generates:
  input → validation → dbInsert → jwtGenerate → response ✅
  
Result: Works correctly - no authMiddleware in public endpoint
```

### Protected Endpoint Example:
```
User: "create endpoint to get user profile"
AI generates:
  input → authMiddleware ✅ → dbFind → response
  
Result: Works correctly - authMiddleware protects the endpoint
```

## When to Use authMiddleware

### ❌ DO NOT Use (Public Endpoints):
- Signup/Registration APIs
- Login APIs
- Password reset/forgot password
- Email verification
- Public data endpoints
- Webhook receivers
- Health check endpoints

### ✅ DO Use (Protected Endpoints):
- Get user profile
- Update user settings
- Delete user account
- User-specific data retrieval
- Admin-only endpoints
- Any endpoint requiring authentication

## Testing the Fix

### Test 1: Signup Flow (Should NOT have authMiddleware)
```bash
# Create signup API
curl -X POST http://localhost:4000/ai/generate-mcp-server \
  -H "Content-Type: application/json" \
  -d '{"prompt": "create signup api with JWT", "ownerId": "test"}'
```

Expected: No authMiddleware in the workflow

### Test 2: Protected Endpoint (Should HAVE authMiddleware)
```bash
# Create protected endpoint
curl -X POST http://localhost:4000/ai/generate-mcp-server \
  -H "Content-Type: application/json" \
  -d '{"prompt": "create endpoint to get user profile", "ownerId": "test"}'
```

Expected: authMiddleware as first step after input

## Benefits

1. **Correct authentication flow** - Public endpoints work without requiring tokens
2. **Better security** - Protected endpoints properly validate authentication
3. **Clear AI guidance** - Explicit rules prevent confusion
4. **Proper patterns** - AI follows standard authentication patterns

## Migration for Existing Workflows

If you have existing workflows with incorrect authMiddleware placement:

### Option 1: Regenerate (Recommended)
1. Delete the existing workflow
2. Create it again with the same prompt
3. The new workflow will have correct authentication flow

### Option 2: Manual Removal
1. Open the workflow in the dashboard
2. Delete the authMiddleware node
3. Reconnect the edges to bypass it
4. Click "Save"

## Files Modified

1. `backend-core/src/ai/prompts/systemPrompt.ts` - Added authMiddleware usage rules

## Summary

✅ **Root cause fixed** - AI now understands when to use authMiddleware
✅ **Clear rules** - Explicit DO/DON'T list for different endpoint types
✅ **Pattern examples** - Shows correct flow for signup, login, and protected endpoints
✅ **All future workflows** - Will have correct authentication patterns
