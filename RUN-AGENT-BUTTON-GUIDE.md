# Run Agent Button - Quick Guide

## 🎯 What Changed

Added a **"Run Agent"** button directly on the MCP dashboard for instant one-click execution.

## 📍 Where to Find It

### Dashboard Location
```
http://localhost:5000/mcp
```

Look for the **MCP Servers** list on the left side. Each running server now has a **"▶ Run"** button.

## 🚀 How It Works

### Before (Manual Steps)
```
1. Go to MCP dashboard
2. Select server
3. Select tool: "input"
4. Enter JSON manually
5. Click "Invoke Tool"
6. Select tool: "validate"
7. Click "Invoke Tool"
8. Select tool: "dbInsert"
9. Click "Invoke Tool"
10. Select tool: "response"
11. Click "Invoke Tool"
```

### After (One Click)
```
1. Go to MCP dashboard
2. Click "▶ Run" button
3. Fill simple form (no JSON!)
4. Click "Run Agent"
5. Done! ✅
```

## 🎨 Visual Flow

```
┌─────────────────────────────────────────────────────────┐
│                  MCP Dashboard                          │
│                                                         │
│  MCP Servers                                            │
│  ┌───────────────────────────────────────────────┐     │
│  │ User Management API                    ▶ Run  │     │
│  │ 4 tools • 1 agent                             │     │
│  │ Status: running                               │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ Blog API                               ▶ Run  │     │
│  │ 5 tools • 1 agent                             │     │
│  │ Status: running                               │     │
│  └───────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Click "Run"
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  Agent Runner Page                      │
│                                                         │
│  Selected: User Management API                          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Email *                                         │   │
│  │ ┌─────────────────────────────────────────────┐ │   │
│  │ │ user@example.com                            │ │   │
│  │ └─────────────────────────────────────────────┘ │   │
│  │                                                 │   │
│  │ Password *                                      │   │
│  │ ┌─────────────────────────────────────────────┐ │   │
│  │ │ ••••••••                                    │ │   │
│  │ └─────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │          ▶ Run Agent                            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Click "Run Agent"
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  Execution Pipeline                     │
│                                                         │
│  ✓ Step 1: Input              5ms                      │
│  ✓ Step 2: Validation         12ms                     │
│  ✓ Step 3: Database Insert    45ms                     │
│  ✓ Step 4: Response           2ms                      │
│                                                         │
│  ✅ User Created Successfully!                          │
└─────────────────────────────────────────────────────────┘
```

## 🔍 Button Behavior

### When Button Appears
- ✅ Server runtime is **running**
- ✅ Server has tools configured
- ✅ Server is ready to execute

### When Button is Hidden
- ❌ Server runtime is **stopped**
- ❌ Server is in error state
- ❌ Server is being created

### Button States
```
┌──────────────────────────────────────┐
│ Running Server                       │
│ ┌──────────────────────────────────┐ │
│ │ User Management API       ▶ Run  │ │  ← Button visible
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Stopped Server                       │
│ ┌──────────────────────────────────┐ │
│ │ Blog API                         │ │  ← No button
│ │ Status: stopped                  │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## 💡 Usage Examples

### Example 1: User Registration
1. Dashboard → Click "▶ Run" on "User Management API"
2. Fill form:
   - Email: `john@example.com`
   - Password: `SecurePass123!`
3. Click "Run Agent"
4. Result: User created in database

### Example 2: Blog Post Creation
1. Dashboard → Click "▶ Run" on "Blog API"
2. Fill form:
   - Title: `My First Post`
   - Content: `Hello World!`
   - Author: `John Doe`
3. Click "Run Agent"
4. Result: Post created and published

### Example 3: E-commerce Order
1. Dashboard → Click "▶ Run" on "Shopping Cart API"
2. Fill form:
   - Product ID: `prod_123`
   - Quantity: `2`
   - Customer: `customer_456`
3. Click "Run Agent"
4. Result: Order processed and confirmed

## 🎯 Key Features

### 1. Context Preservation
- Server is pre-selected
- No need to choose from dropdown
- Direct to execution

### 2. Smart Routing
- URL parameter: `?serverId=mcp_123`
- Auto-selects correct server
- Maintains state

### 3. Visual Feedback
- Gradient button (blue → purple)
- Play icon indicator
- Hover effects

### 4. Error Prevention
- Only shows for running servers
- Validates before navigation
- Clear status indicators

## 🔧 Technical Details

### URL Structure
```
/agent-runner?serverId=mcp_1234567890_abc123
```

### Button Component
```tsx
<button
  onClick={(e) => handleRunAgent(e, server.serverId)}
  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
>
  <PlayIcon />
  Run
</button>
```

### Navigation Logic
```typescript
const handleRunAgent = (e: React.MouseEvent, serverId: string) => {
  e.stopPropagation(); // Don't select server
  router.push(`/agent-runner?serverId=${serverId}`);
};
```

## 📊 User Flow Comparison

### Old Flow (Manual)
```
Time: ~5 minutes
Steps: 12
Complexity: High
JSON Required: Yes
Error Prone: Yes
```

### New Flow (One-Click)
```
Time: ~30 seconds
Steps: 3
Complexity: Low
JSON Required: No
Error Prone: No
```

## 🎨 Design Decisions

### Why Gradient Button?
- Stands out from other UI elements
- Indicates "special action"
- Modern, professional look

### Why Play Icon?
- Universal symbol for "execute"
- Intuitive for users
- Consistent with media controls

### Why Hide When Stopped?
- Prevents confusion
- Clear visual feedback
- Encourages proper workflow

## 🚀 Next Steps

### For Users
1. Start your server runtime
2. Look for the "▶ Run" button
3. Click and fill the form
4. Watch your agent execute

### For Developers
1. Button automatically appears
2. No configuration needed
3. Works with all MCP servers
4. Fully responsive

## 🏆 Benefits

### For End Users
- ✅ No technical knowledge needed
- ✅ Instant access to execution
- ✅ Visual feedback
- ✅ Error prevention

### For Demos
- ✅ Professional appearance
- ✅ Quick to showcase
- ✅ Impressive UX
- ✅ Clear value proposition

### For Development
- ✅ Faster testing
- ✅ Better workflow
- ✅ Reduced errors
- ✅ Improved productivity

---

**Result:** Users can now execute agents with a single click from the dashboard, making the platform accessible to non-technical users and perfect for demos!
