# Archestra Deployment - Live Demo Script

## Demo Scenario: Deploying a Signup API

This demo shows the complete journey from natural language to production-hosted API.

---

## 🎬 Demo Flow

### Scene 1: Creating the Workflow (30 seconds)

**Narrator**: "Meet Sarah, a non-technical founder building a mobile app. She needs a user registration API but doesn't know how to code."

**Action**:
1. Open Orchestrix dashboard
2. Type in chat: "create a sign up api with email validation and JWT authentication"
3. Press Enter

**Result**:
- AI generates workflow in 3 seconds
- Visual nodes appear on canvas:
  - Input (collects email, password, name)
  - Validation (checks email format, password strength)
  - Database Insert (creates user with hashed password)
  - JWT Generate (creates authentication token)
  - Response (returns success + token)

**Narrator**: "In just 3 seconds, Sarah has a complete, production-ready signup API."

---

### Scene 2: Testing Locally (20 seconds)

**Narrator**: "Before deploying, Sarah wants to test it."

**Action**:
1. Click "Start Runtime" button
2. Click "Run" button
3. Fill in test data:
   - Email: sarah@example.com
   - Password: SecurePass123
   - Name: Sarah Johnson
4. Click "Execute"

**Result**:
- Execution Logs panel shows real-time updates:
  ```
  🧠 SupervisorAgent received task
  🏗 BuilderAgent generating workflow
  🔧 MCPRuntime initializing tool graph
  ✅ Input received
  ✅ Validation passed
  ✅ User created in database
  ✅ JWT token generated
  ✅ Response sent
  ```
- Response shows:
  ```json
  {
    "success": true,
    "user": {
      "_id": "698ec3bed3d4bcaca71f3ad4",
      "email": "sarah@example.com",
      "name": "Sarah Johnson"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

**Narrator**: "Perfect! The API works. Now let's deploy it to production."

---

### Scene 3: Deploying to Archestra (15 seconds)

**Narrator**: "With one click, Sarah can deploy this to Archestra and get a public endpoint."

**Action**:
1. Click "Deploy to Archestra" button (purple button)
2. Watch the button change to "Deploying..." with spinner

**Result** (after 2-3 seconds):
- Success modal appears:
  ```
  ✅ Deployed Successfully!
  
  Agent ID: agent_abc123
  Endpoint: https://api.archestra.ai/agents/agent_abc123
  
  Click OK to copy endpoint to clipboard.
  ```
- Click OK
- Endpoint copied to clipboard

**Narrator**: "That's it! Sarah now has a production API endpoint."

---

### Scene 4: Post-Deployment UI (10 seconds)

**Narrator**: "The UI updates to show the deployment status."

**Action**:
- Purple banner appears at top of canvas:
  ```
  ⚡ Deployed to Archestra
  Agent ID: agent_abc123
  [Copy Endpoint] [Open Dashboard]
  ```
- "Deploy to Archestra" button changes to "Deployed" (disabled)
- Execution logs show:
  ```
  🚀 Deploying to Archestra...
  ✅ Deployed to Archestra successfully!
  ```

**Narrator**: "Sarah can copy the endpoint anytime or open the Archestra dashboard to monitor usage."

---

### Scene 5: Using the API (20 seconds)

**Narrator**: "Now Sarah's mobile app can call this endpoint directly. The workflow executes on Archestra's platform."

**Action**:
1. Open terminal/Postman
2. Show API call:
   ```bash
   curl -X POST https://api.archestra.ai/agents/agent_abc123 \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john@example.com",
       "password": "SecurePass456",
       "name": "John Doe"
     }'
   ```

**Result**:
```json
{
  "success": true,
  "user": {
    "_id": "698ec3bed3d4bcaca71f3ad5",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Narrator**: "The API is live and working! Archestra's MCP runtime executes the tool graph directly - input, validation, database insert, JWT generation, and response. Sarah's mobile app can now register users."

**Technical Note**: The SupervisorAgent and BuilderAgent that generated this workflow are NOT running in production. They only exist in Orchestrix for workflow creation and testing. Archestra uses its own MCP runtime to execute the deployed tool graph.

---

### Scene 6: Iterating (15 seconds)

**Narrator**: "Later, Sarah wants to add email verification."

**Action**:
1. Type in chat: "send verification email after signup"
2. AI adds email node to workflow
3. Click "Save"

**Result**:
- Workflow updated with new email node
- Local testing shows email being sent
- Note: "To update the deployed version, you would redeploy (future feature)"

**Narrator**: "Sarah can continue iterating on her API, testing locally before deploying updates."

---

## 🎯 Key Takeaways

### For Non-Technical Users
- ✅ No coding required
- ✅ Natural language to working API in under 60 seconds
- ✅ Visual understanding of what the API does
- ✅ Test before deploying
- ✅ One-click deployment to production
- ✅ Public endpoint ready to use

### For Technical Users
- ✅ Rapid prototyping and validation
- ✅ Visual workflow editing
- ✅ Complete execution observability
- ✅ Production-ready infrastructure
- ✅ Extensible and customizable

### For Businesses
- ✅ 100x faster than traditional development
- ✅ 90% cost reduction
- ✅ No DevOps overhead
- ✅ Instant scalability
- ✅ Built-in monitoring

---

## 📊 Demo Metrics

| Metric | Traditional Dev | Orchestrix |
|--------|----------------|------------|
| Time to working API | 4-8 hours | 60 seconds |
| Lines of code written | 200-500 | 0 |
| Infrastructure setup | 1-2 hours | 0 |
| Deployment time | 30-60 minutes | 3 seconds |
| Cost (developer time) | $200-800 | $0 |
| Technical knowledge required | High | None |

---

## 🎤 Demo Script (Verbatim)

### Opening (5 seconds)
"Today I'm going to show you how to go from a natural language description to a production-hosted API in under 60 seconds, with zero coding."

### Workflow Creation (30 seconds)
"Let's say I want to build a user signup API with email validation and JWT authentication. I just type that into Orchestrix... and in 3 seconds, I have a complete workflow. You can see each step: collecting input, validating the email and password, creating the user in the database with a hashed password, generating a JWT token, and returning the response."

### Testing (20 seconds)
"Before deploying, let me test it. I'll start the runtime, click Run, and enter some test data. Watch the execution logs - you can see each step executing in real-time. And there's my response with the user data and JWT token. Perfect!"

### Deployment (15 seconds)
"Now, to deploy this to production, I just click 'Deploy to Archestra'. Watch... and done! I now have a public API endpoint that I can call from my mobile app, website, or anywhere else."

### Post-Deployment (10 seconds)
"The UI shows me the deployment status, the agent ID, and gives me quick access to copy the endpoint or open the Archestra dashboard. The deploy button is now disabled since this workflow is already deployed."

### Using the API (20 seconds)
"Let me show you the API in action. I'll make a POST request with a new user's data... and there's the response! The API is live and working. My mobile app can now register users using this endpoint."

### Closing (10 seconds)
"That's it! From natural language to production API in under 60 seconds. No coding, no infrastructure setup, no deployment configuration. Just describe what you want and start using it."

---

## 🎥 Camera Angles & Focus

### Angle 1: Full Screen (Workflow Creation)
- Show entire Orchestrix dashboard
- Focus on chat input and node generation
- Highlight the visual workflow appearing

### Angle 2: Close-up (Node Details)
- Zoom into individual nodes
- Show configuration details
- Highlight data flow between nodes

### Angle 3: Split Screen (Testing)
- Left: Workflow canvas
- Right: Execution logs panel
- Show real-time execution

### Angle 4: Button Focus (Deployment)
- Close-up on "Deploy to Archestra" button
- Show button state changes
- Highlight success modal

### Angle 5: Banner View (Post-Deployment)
- Show purple deployment banner
- Highlight copy and dashboard buttons
- Show disabled deploy button

### Angle 6: Terminal (API Usage)
- Show curl command or Postman
- Highlight request and response
- Emphasize the public endpoint

---

## 🎨 Visual Highlights

### Color Coding
- **Purple**: Deployment-related UI (button, banner, logs)
- **Green**: Success states (checkmarks, success logs)
- **Blue**: Information (agent ID, endpoint)
- **Red**: Errors (if any)

### Animations
- Node appearance (fade in + slide)
- Edge connections (animated dashes)
- Button state transitions (smooth)
- Modal appearance (scale + fade)
- Log entries (slide up)

### Key Moments to Capture
1. ⚡ Nodes appearing on canvas (3 seconds)
2. ✅ Execution logs scrolling (real-time)
3. 🚀 Deploy button click (instant feedback)
4. 🎉 Success modal (celebration moment)
5. 📋 Endpoint copy (clipboard animation)
6. 🌐 API call response (live data)

---

## 🎯 Demo Success Criteria

The demo is successful if viewers understand:

1. ✅ How easy it is to create APIs (natural language)
2. ✅ What the API does (visual workflow)
3. ✅ How to test it (run button + logs)
4. ✅ How to deploy it (one click)
5. ✅ How to use it (public endpoint)
6. ✅ The value proposition (speed + simplicity)

---

## 💡 Demo Tips

### Do's
- ✅ Keep it fast-paced (under 2 minutes total)
- ✅ Show real data and real responses
- ✅ Highlight the speed (3 seconds, 60 seconds)
- ✅ Emphasize "no coding required"
- ✅ Show the complete journey (create → test → deploy → use)

### Don'ts
- ❌ Don't explain technical details (keep it simple)
- ❌ Don't show errors (unless demonstrating error handling)
- ❌ Don't pause or hesitate (practice beforehand)
- ❌ Don't use technical jargon (speak plainly)
- ❌ Don't skip the "wow" moments (deployment success)

---

## 🎬 Ready to Demo!

This script provides everything needed for a compelling demo of the Archestra deployment feature. The demo showcases the complete value proposition: from natural language to production API in under 60 seconds, with zero coding required.
