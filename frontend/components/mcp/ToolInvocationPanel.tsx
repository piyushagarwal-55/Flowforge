'use client';

import { useState } from 'react';
import { invokeTool } from '@/lib/mcpApi';

interface Tool {
  toolId: string;
  name: string;
  description: string;
  inputSchema: any;
}

interface ToolInvocationPanelProps {
  serverId: string;
  agentId: string;
  tools: Tool[];
  runtimeStatus: string;
}

export default function ToolInvocationPanel({ serverId, agentId, tools, runtimeStatus }: ToolInvocationPanelProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolInput, setToolInput] = useState<string>('{}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedToolData = tools.find(t => t.toolId === selectedTool);

  const getDefaultInput = (toolId: string) => {
    const defaults: Record<string, any> = {
      input: { variables: [{ name: 'email' }, { name: 'password' }] },
      inputValidation: { 
        rules: [
          { field: 'input.email', required: true, type: 'string' },
          { field: 'input.password', required: true, type: 'string' }
        ]
      },
      dbFind: { 
        collection: 'users', 
        filters: { email: 'user@example.com' },
        findType: 'one'
      },
      dbInsert: { 
        collection: 'users', 
        data: { 
          email: 'newuser@example.com',
          name: 'New User',
          createdAt: new Date().toISOString()
        }
      },
      dbUpdate: {
        collection: 'users',
        filter: { email: 'user@example.com' },
        data: { lastLogin: new Date().toISOString() }
      },
      response: { 
        status: 200, 
        body: { success: true, message: 'Operation completed' }
      },
      emailSend: {
        to: 'user@example.com',
        subject: 'Welcome!',
        body: 'Thank you for signing up.'
      },
      authMiddleware: {},
      jwtGenerate: {
        payload: { userId: '123', email: 'user@example.com' },
        expiresIn: '24h'
      }
    };

    return defaults[toolId] || {};
  };

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    setToolInput(JSON.stringify(getDefaultInput(toolId), null, 2));
    setResult(null);
    setError(null);
  };

  const handleInvoke = async () => {
    if (!selectedTool) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const input = JSON.parse(toolInput);
      const response = await invokeTool(serverId, selectedTool, input, agentId);
      setResult(response);
    } catch (err: any) {
      setError(err.message);
      console.error('Tool invocation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (runtimeStatus !== 'running') {
    return (
      <div className="tool-invocation-panel border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Tool Invocation</h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="text-sm">Runtime must be running to invoke tools</div>
          <div className="text-xs mt-1">Click "Start Runtime" above</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tool-invocation-panel border border-gray-300 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3">Tool Invocation</h3>

      {/* Tool Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Tool
        </label>
        <select
          value={selectedTool || ''}
          onChange={(e) => handleToolSelect(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Choose a tool --</option>
          {tools.map((tool) => (
            <option key={tool.toolId} value={tool.toolId}>
              {tool.name} ({tool.toolId})
            </option>
          ))}
        </select>
      </div>

      {selectedToolData && (
        <>
          {/* Tool Description */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm font-medium text-blue-900">{selectedToolData.name}</div>
            <div className="text-xs text-blue-700 mt-1">{selectedToolData.description}</div>
          </div>

          {/* Input Editor */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input (JSON)
            </label>
            <textarea
              value={toolInput}
              onChange={(e) => setToolInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={8}
              placeholder='{"key": "value"}'
            />
          </div>

          {/* Invoke Button */}
          <button
            onClick={handleInvoke}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Invoking...' : 'Invoke Tool'}
          </button>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="text-sm font-medium text-red-900">Error</div>
              <div className="text-xs text-red-700 mt-1 font-mono">{error}</div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Result</div>
              
              {/* Metadata */}
              <div className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-600">Invocation ID:</span>
                    <span className="ml-1 font-mono">{result.invocationId?.slice(0, 8)}...</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-1 font-medium">{result.duration}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-1 text-green-600 font-medium">
                      {result.success ? '✓ Success' : '✗ Failed'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Invoked At:</span>
                    <span className="ml-1">{new Date(result.invokedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Output */}
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="text-xs font-medium text-green-900 mb-1">Output:</div>
                <pre className="text-xs font-mono text-green-900 overflow-x-auto max-h-64 overflow-y-auto">
                  {JSON.stringify(result.output, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </>
      )}

      {!selectedTool && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔧</div>
          <div className="text-sm">Select a tool to invoke</div>
        </div>
      )}
    </div>
  );
}
