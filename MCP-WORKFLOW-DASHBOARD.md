# MCP Workflow Dashboard

## Overview

The MCP Workflow Dashboard is an interactive interface for executing and monitoring MCP server workflows. It provides a chat-based interface for iterative development and a comprehensive execution history view.

## Features

### 1. Interactive Chat Interface
- Natural language prompts for workflow execution
- Real-time processing feedback
- Automatic input parsing from prompts
- Support for iterative refinement (e.g., "add JWT" after creating signup API)

### 2. Execution History
- Complete history of all workflow executions
- Expandable execution details
- Step-by-step execution logs
- Success/failure indicators
- Execution duration tracking

### 3. Detailed Workflow View
- Real-time execution status
- Step-by-step progress tracking
- Result data display
- Error handling and reporting

### 4. Persistent Storage
- Execution history saved to localStorage
- Survives page refreshes
- Per-server history tracking

## Usage

### Accessing the Dashboard

1. **From MCP Server List**: Click "Open Dashboard" on any server card
2. **Direct URL**: Navigate to `/mcp/workflow/[serverId]`

### Sending Prompts

The dashboard accepts natural language prompts. Examples:

```
create user with email john@example.com password secret123 name John Doe
```

```
add JWT authentication to the signup flow
```

```
create user with email test@example.com and password mypassword
```

### Prompt Parsing

The system automatically extracts:
- **Email**: Looks for `email: value` or `email value@domain.com`
- **Password**: Looks for `password: value` or `password value`
- **Name**: Looks for `name: value` or `name Value Name`

If values aren't found, defaults are used:
- Email: `user{timestamp}@example.com`
- Password: `defaultPassword123`
- Name: `User`

## Architecture

### Components

#### MCPWorkflowDashboard
Main dashboard component with:
- Chat interface at the bottom
- Scrollable execution history
- Real-time execution display
- Server statistics header

**Props:**
- `serverId`: MCP server identifier
- `serverName`: Display name of the server
- `agentId`: Optional agent identifier
- `ownerId`: Owner identifier for API calls

#### Workflow Page
Next.js page component that:
- Fetches server details
- Starts runtime if needed
- Renders the dashboard

**Route:** `/mcp/workflow/[serverId]`

### Data Flow

1. User enters prompt in chat input
2. Prompt is parsed to extract input data
3. API call is made to `/mcp/servers/{serverId}/run-agent`
4. Execution is tracked in real-time
5. Results are displayed and saved to history
6. History is persisted to localStorage

### State Management

```typescript
interface ExecutionLog {
  id: string;
  timestamp: number;
  prompt: string;
  status: 'running' | 'success' | 'failed';
  duration?: number;
  steps: StepLog[];
  result?: any;
}

interface StepLog {
  toolId: string;
  toolName: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startTime?: number;
  endTime?: number;
  input?: any;
  output?: any;
  error?: string;
}
```

## Navigation Updates

### MCPServerList Component
- Changed "Run Agent" button to "Open Dashboard"
- Updated navigation from `/agent-runner` to `/mcp/workflow/[serverId]`

### MCP Page
- Updated server cards to use "Open Dashboard" button
- All servers now navigate to the workflow dashboard
- Removed dependency on runtime status for dashboard access

## Styling

The dashboard follows the existing design system:

- **Background**: Dark gradient (`#0a0a0a` → `#111` → `#0a0a0a`)
- **Cards**: `bg-[#0f0f0f]/90` with backdrop blur
- **Borders**: `border-white/[0.08]` with emerald accents on hover
- **Success**: Emerald color scheme (`#10b981`)
- **Error**: Red color scheme (`#ef4444`)
- **Animations**: Framer Motion for smooth transitions

## API Integration

### Endpoints Used

1. **Get Tools**: `GET /mcp/servers/{serverId}/tools?ownerId={ownerId}`
2. **Run Agent**: `POST /mcp/servers/{serverId}/run-agent`
   ```json
   {
     "agentId": "optional-agent-id",
     "input": {
       "email": "user@example.com",
       "password": "password123",
       "name": "User Name"
     },
     "ownerId": "user_default"
   }
   ```

### Response Format

```json
{
  "summary": {
    "totalSteps": 4,
    "successCount": 4,
    "failedCount": 0,
    "duration": 1234
  },
  "steps": [
    {
      "toolId": "tool-1",
      "status": "success",
      "output": {...}
    }
  ]
}
```

## Example HTML

An example HTML file is provided at `examples/use-mcp-api.html` that demonstrates:
- Natural language prompt input
- Execution history tracking
- Success/failure handling
- Duration tracking

## Future Enhancements

### Planned Features
1. **AI-Powered Prompt Parsing**: Use LLM to better understand user intent
2. **Workflow Templates**: Pre-built prompts for common tasks
3. **Export History**: Download execution history as JSON/CSV
4. **Collaboration**: Share execution history with team members
5. **Advanced Filtering**: Filter history by status, date, duration
6. **Real-time Streaming**: WebSocket support for live execution updates
7. **Workflow Visualization**: Visual representation of execution flow
8. **Performance Metrics**: Detailed analytics and performance tracking

### Potential Improvements
- Add syntax highlighting for JSON results
- Implement search in execution history
- Add keyboard shortcuts (Cmd+K for quick actions)
- Support for file uploads in prompts
- Multi-step workflow builder
- Conditional execution based on previous results

## Troubleshooting

### Dashboard Not Loading
- Verify server ID is correct
- Check that server exists in the database
- Ensure API endpoint is accessible

### Execution Failing
- Check server runtime status
- Verify input data format
- Review API endpoint configuration
- Check browser console for errors

### History Not Persisting
- Verify localStorage is enabled
- Check browser storage limits
- Clear localStorage if corrupted: `localStorage.removeItem('mcp_history_{serverId}')`

## Development

### Running Locally

```bash
# Start the development server
npm run dev

# Navigate to dashboard
http://localhost:3000/mcp/workflow/[your-server-id]
```

### Testing

```bash
# Run tests
npm test

# Test specific component
npm test MCPWorkflowDashboard
```

### Building

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Contributing

When contributing to the workflow dashboard:

1. Follow the existing design system
2. Maintain TypeScript type safety
3. Add proper error handling
4. Update documentation
5. Test on multiple browsers
6. Ensure mobile responsiveness

## License

Same as the main project license.
