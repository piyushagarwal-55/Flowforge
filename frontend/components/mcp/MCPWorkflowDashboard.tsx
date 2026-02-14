'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Send, Sparkles, Save, Play, Menu, Workflow, 
  Zap, Plus, ChevronRight, X, Terminal
} from 'lucide-react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  Connection,
  addEdge,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { io, Socket } from 'socket.io-client';
import NodeEditorModal from '@/components/Ui/NodesSidebar';
import { MCPToolNode } from '@/components/nodes/MCPToolNode';
import AnimatedDashedEdge from '@/components/Ui/AnimatedDashedEdge';
import RunWorkflowModal from './RunWorkflowModal';
import MCPLogsPanel, { LogEntry } from './MCPLogsPanel';

// Define custom node types for MCP
const nodeTypes = {
  mcpTool: MCPToolNode,
  input: MCPToolNode,
  inputValidation: MCPToolNode,
  dbInsert: MCPToolNode,
  dbUpdate: MCPToolNode,
  dbFind: MCPToolNode,
  dbDelete: MCPToolNode,
  jwtGenerate: MCPToolNode,
  authMiddleware: MCPToolNode,
  emailSend: MCPToolNode,
  response: MCPToolNode,
  default: MCPToolNode,
};

interface Tool {
  toolId: string;
  name: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
}

interface MCPWorkflowDashboardProps {
  serverId: string;
  serverName: string;
  agentId?: string;
  ownerId: string;
}

export default function MCPWorkflowDashboard({ 
  serverId, 
  serverName,
  agentId, 
  ownerId 
}: MCPWorkflowDashboardProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionCount, setExecutionCount] = useState(0);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [runtimeStatus, setRuntimeStatus] = useState<'running' | 'stopped' | 'not_loaded'>('not_loaded');
  const [isTogglingRuntime, setIsTogglingRuntime] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentInfo, setDeploymentInfo] = useState<{
    agentId: string;
    endpoint: string;
    dashboardUrl: string;
  } | null>(null);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

  const addLog = (type: LogEntry['type'], message: string, details?: any) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type,
      message,
      details,
    };
    setLogs(prev => [...prev, newLog]);
  };

  useEffect(() => {
    fetchTools();
    loadExecutionCount();
    loadExistingWorkflow();
    fetchRuntimeStatus();
    fetchHistoricalLogs();

    // Setup socket.io connection for execution logs
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[MCPWorkflow] Socket connected, joining room:', serverId);
      newSocket.emit('join-execution', serverId);
    });

    // Listen for execution-log events
    newSocket.on('execution-log', (logData: any) => {
      console.log('[MCPWorkflow] Received execution-log:', logData);
      
      // Map execution-log types to LogEntry types
      let logType: LogEntry['type'] = 'info';
      let message = logData.data?.message || logData.stepName || 'Execution event';
      
      if (logData.type === 'step_complete' || logData.type === 'tool_complete' || logData.type === 'workflow_complete') {
        logType = 'success';
      } else if (logData.type === 'step_error' || logData.type === 'tool_error') {
        logType = 'error';
      } else if (logData.stepType === 'agent' || logData.type === 'agent_activity') {
        logType = 'execution';
      } else if (logData.type === 'tool_start' || logData.type === 'step_start') {
        logType = 'info';
      }
      
      addLog(logType, message, logData);
    });

    newSocket.on('disconnect', () => {
      console.log('[MCPWorkflow] Socket disconnected');
    });

    return () => {
      newSocket.emit('leave-execution', serverId);
      newSocket.close();
    };
  }, [serverId]);

  const fetchHistoricalLogs = async () => {
    try {
      console.log('[MCPWorkflow] Fetching historical logs for:', serverId);
      
      const response = await fetch(
        `${apiUrl}/mcp/servers/${serverId}/logs?ownerId=${ownerId}&limit=100`
      );

      if (!response.ok) {
        console.warn('[MCPWorkflow] Failed to fetch historical logs');
        return;
      }

      const data = await response.json();
      console.log('[MCPWorkflow] Historical logs loaded:', data.logs.length);

      // Convert historical logs to LogEntry format
      const historicalLogs: LogEntry[] = data.logs.map((log: any) => {
        let logType: LogEntry['type'] = 'info';
        
        if (log.type === 'step_complete' || log.type === 'tool_complete' || log.type === 'workflow_complete') {
          logType = 'success';
        } else if (log.type === 'step_error' || log.type === 'tool_error') {
          logType = 'error';
        } else if (log.stepType === 'agent' || log.type === 'agent_activity') {
          logType = 'execution';
        }

        return {
          id: log.id || `log-${Date.now()}-${Math.random()}`,
          timestamp: new Date(log.timestamp).getTime(),
          type: logType,
          message: log.message || log.stepName || 'Execution event',
          details: log.data,
        };
      });

      setLogs(historicalLogs);
    } catch (err) {
      console.error('[MCPWorkflow] Error fetching historical logs:', err);
    }
  };

  const fetchRuntimeStatus = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/mcp/servers/${serverId}?ownerId=${ownerId}`
      );

      if (!response.ok) {
        console.warn('[MCPWorkflow] Failed to fetch runtime status');
        return;
      }

      const data = await response.json();
      setRuntimeStatus(data.runtimeStatus || 'not_loaded');
      console.log('[MCPWorkflow] Runtime status:', data.runtimeStatus);
      
      // Check if already deployed to Archestra
      if (data.archestraAgentId) {
        setDeploymentInfo({
          agentId: data.archestraAgentId,
          endpoint: data.archestraEndpoint,
          dashboardUrl: data.archestraDashboardUrl,
        });
        console.log('[MCPWorkflow] Archestra deployment info loaded:', {
          agentId: data.archestraAgentId,
          endpoint: data.archestraEndpoint,
        });
      }
    } catch (err) {
      console.error('[MCPWorkflow] Error fetching runtime status:', err);
    }
  };

  const loadExecutionCount = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`mcp_history_${serverId}`);
      if (saved) {
        const history = JSON.parse(saved);
        setExecutionCount(history.length);
      }
    }
  };

  const fetchTools = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/mcp/servers/${serverId}/tools?ownerId=${ownerId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tools');
      }

      const data = await response.json();
      setTools(data.tools);
    } catch (err) {
      console.error('Error fetching tools:', err);
    }
  };

  const loadExistingWorkflow = async () => {
    try {
      console.log('[MCPWorkflow] Loading workflow from MCP server:', serverId);
      
      const response = await fetch(
        `${apiUrl}/mcp/servers/${serverId}?ownerId=${ownerId}`
      );

      if (!response.ok) {
        console.warn('[MCPWorkflow] Failed to fetch server details');
        return;
      }

      const serverData = await response.json();
      console.log('[MCPWorkflow] Server data:', serverData);

      // Generate workflow from MCP server tools
      if (serverData.tools && serverData.tools.length > 0) {
          const autoNodes = serverData.tools.map((tool: any, index: number) => {
            // Extract clean fields from inputSchema
            let fields: any = {};
            
            if (tool.inputSchema) {
              // Check if fields are nested under 'fields' key (from mutation save)
              const source = tool.inputSchema.fields || tool.inputSchema;
              
              // For input node, extract variables
              if (tool.toolId === 'input' && source.variables) {
                fields.variables = source.variables;
              }
              // For inputValidation, extract rules
              else if (tool.toolId === 'inputValidation' && source.rules) {
                fields.rules = source.rules;
              }
              // For dbInsert, extract collection, data, output
              else if (tool.toolId === 'dbInsert') {
                if (source.collection) fields.collection = source.collection;
                if (source.data || source.document) fields.data = source.data || source.document;
                if (source.output || source.outputVar) fields.output = source.output || source.outputVar;
              }
              // For jwtGenerate, extract payload, expiresIn, output
              else if (tool.toolId === 'jwtGenerate') {
                if (source.payload) fields.payload = source.payload;
                if (source.expiresIn) fields.expiresIn = source.expiresIn;
                if (source.output) fields.output = source.output;
              }
              // For authMiddleware, extract output
              else if (tool.toolId === 'authMiddleware') {
                if (source.output) fields.output = source.output;
              }
              // For response, extract status and body
              else if (tool.toolId === 'response') {
                if (source.status || source.statusCode) fields.status = source.status || source.statusCode;
                if (source.body) fields.body = source.body;
              }
              // For other nodes, try to extract fields from source directly
              else if (typeof source === 'object') {
                // Use the source directly, excluding metadata fields
                const schemaKeys = Object.keys(source).filter(
                  key => !['type', 'properties', 'required', 'fields'].includes(key)
                );
                if (schemaKeys.length > 0) {
                  schemaKeys.forEach(key => {
                    fields[key] = source[key];
                  });
                } else if (source.properties) {
                  fields = { ...source.properties };
                }
              }
            }

            return {
              id: `${tool.toolId || tool.name}-${index}`,
              type: tool.toolId || 'mcpTool',
              position: {
                x: (index + 1) * 280, // Start from 280 instead of 100 to avoid edge
                y: 100,
              },
              data: {
                label: tool.name,
                fields: Object.keys(fields).length > 0 ? fields : undefined,
                description: tool.description,
                toolId: tool.toolId,
                inputSchema: tool.inputSchema,
                outputSchema: tool.outputSchema,
                _stepNumber: index + 1,
              },
            };
          });

          // Auto-connect nodes in sequence (left to right)
          const autoEdges = autoNodes.slice(0, -1).map((node: any, index: number) => ({
            id: `edge-${index}`,
            source: node.id,
            target: autoNodes[index + 1].id,
            type: 'animated',
          }));

          console.log('[MCPWorkflow] Auto-generated nodes:', autoNodes);
          console.log('[MCPWorkflow] Auto-generated edges:', autoEdges);

          setNodes(autoNodes);
          setEdges(autoEdges);
      }
    } catch (err) {
      console.error('[MCPWorkflow] Error loading workflow:', err);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNodeToCanvas = (tool: Tool) => {
    const newNode: Node = {
      id: `${tool.toolId}-${Date.now()}`,
      type: 'mcpTool',
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: { 
        label: tool.name,
        fields: {
          description: tool.description,
        },
        toolId: tool.toolId,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        _isNew: true, // Mark as new for animation
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleToggleRuntime = async () => {
    setIsTogglingRuntime(true);
    
    try {
      const endpoint = runtimeStatus === 'running' 
        ? `${apiUrl}/mcp/servers/${serverId}/runtime/stop`
        : `${apiUrl}/mcp/servers/${serverId}/runtime/start`;
      
      const action = runtimeStatus === 'running' ? 'Stopping' : 'Starting';
      addLog('info', `⚙️ ${action} runtime...`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ownerId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action.toLowerCase()} runtime`);
      }

      const result = await response.json();
      setRuntimeStatus(result.status);
      
      addLog('success', `✅ Runtime ${result.status}!`);
      console.log('[MCPWorkflow] Runtime toggled:', result);
    } catch (err) {
      console.error('[MCPWorkflow] Error toggling runtime:', err);
      addLog('error', '❌ Failed to toggle runtime', (err as Error).message);
      alert('❌ Failed to toggle runtime: ' + (err as Error).message);
    } finally {
      setIsTogglingRuntime(false);
    }
  };

  const handleSave = async () => {
    try {
      console.log('[MCPWorkflow] Saving workflow...', { nodes, edges });
      addLog('info', '💾 Saving workflow...');
      
      // Update MCP server with new tools based on current nodes
      const updatedTools = nodes.map((node) => {
        const toolId = node.data.toolId || node.id;
        
        // Prefer inputSchema if it exists, otherwise use fields directly
        // This ensures consistency: fields are stored at the top level of inputSchema
        let inputSchema = {};
        if (node.data.inputSchema) {
          inputSchema = node.data.inputSchema;
        } else if (node.data.fields) {
          // Flatten fields to top level (not nested under 'fields' key)
          inputSchema = { ...node.data.fields };
        }
        
        return {
          toolId: toolId,
          name: node.data.label,
          description: node.data.description || `${node.type} operation`,
          inputSchema: inputSchema,
          outputSchema: node.data.outputSchema || {},
        };
      });

      // Update execution order based on edges
      const executionOrder = nodes.map((node) => node.data.toolId || node.id);

      const payload = {
        ownerId,
        tools: updatedTools,
        executionOrder,
      };

      // Update MCP server
      const response = await fetch(`${apiUrl}/mcp/servers/${serverId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }

      const result = await response.json();
      console.log('[MCPWorkflow] MCP server updated:', result);
      addLog('success', '✅ Workflow saved successfully!', result);
      
      // Refresh runtime status after save
      await fetchRuntimeStatus();
      
      alert('✅ Workflow saved successfully!');
    } catch (err) {
      console.error('[MCPWorkflow] Save error:', err);
      addLog('error', '❌ Failed to save workflow', (err as Error).message);
      alert('❌ Failed to save workflow: ' + (err as Error).message);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    addLog('info', '🚀 Deploying to Archestra...');
    
    try {
      console.log('[MCPWorkflow] Deploying to Archestra...', { serverId });
      
      const response = await fetch(`${apiUrl}/mcp/servers/${serverId}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ownerId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deploy to Archestra');
      }

      const result = await response.json();
      console.log('[MCPWorkflow] Deployment successful:', result);
      
      setDeploymentInfo({
        agentId: result.agentId,
        endpoint: result.endpoint,
        dashboardUrl: result.dashboardUrl,
      });
      
      addLog('success', '✅ Deployed to Archestra successfully!', result);
      
      // Show success modal with deployment info
      alert(`✅ Deployed Successfully!\n\nAgent ID: ${result.agentId}\nEndpoint: ${result.endpoint}\n\nClick OK to copy endpoint to clipboard.`);
      
      // Copy endpoint to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(result.endpoint);
      }
    } catch (err) {
      console.error('[MCPWorkflow] Deployment error:', err);
      addLog('error', '❌ Failed to deploy to Archestra', (err as Error).message);
      alert('❌ Failed to deploy: ' + (err as Error).message);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRun = async () => {
    // Validate we have nodes
    if (nodes.length === 0) {
      alert('⚠️ No nodes to execute. Add some tools first!');
      return;
    }

    // Open the input modal
    setRunModalOpen(true);
  };

  const handleRunWithInput = async (input: Record<string, any>) => {
    setIsRunning(true);
    addLog('execution', '🚀 Starting workflow execution...', { input });
    
    try {
      console.log('[MCPWorkflow] Running workflow with input...', { nodes, edges, input });
      
      // Build execution payload
      const payload = {
        serverId,
        agentId,
        ownerId,
        input,
      };

      addLog('info', '📡 Sending request to MCP server...');

      // Execute via MCP run-agent endpoint
      const response = await fetch(`${apiUrl}/mcp/servers/${serverId}/run-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to execute workflow');
      }

      const result = await response.json();
      console.log('[MCPWorkflow] Execution result:', result);
      
      addLog('success', '✅ Workflow executed successfully!', result);
      
      // Increment execution count
      setExecutionCount(prev => prev + 1);
      
      // Save to history
      if (typeof window !== 'undefined') {
        const history = JSON.parse(localStorage.getItem(`mcp_history_${serverId}`) || '[]');
        history.unshift({
          id: `exec-${Date.now()}`,
          timestamp: Date.now(),
          prompt: 'Manual execution',
          status: 'success',
          result,
          input,
        });
        localStorage.setItem(`mcp_history_${serverId}`, JSON.stringify(history));
      }
      
      // Close modal and show success
      setRunModalOpen(false);
      alert('✅ Workflow executed successfully!\n\nCheck the logs panel for details.');
    } catch (err) {
      console.error('[MCPWorkflow] Execution error:', err);
      addLog('error', '❌ Execution failed', (err as Error).message);
      alert('❌ Failed to execute workflow: ' + (err as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isProcessing) return;

    const prompt = chatInput.trim();
    setChatInput('');
    setIsProcessing(true);

    addLog('info', `💬 Processing prompt: "${prompt}"`);

    try {
      console.log('[MCPWorkflow] Sending mutation prompt:', prompt);
      
      // Get or create workflowId for this MCP server
      let workflowId = localStorage.getItem(`mcp_workflow_id_${serverId}`);
      if (!workflowId) {
        workflowId = `mcp_workflow_${serverId}_${Date.now()}`;
        localStorage.setItem(`mcp_workflow_id_${serverId}`, workflowId);
      }

      console.log('[MCPWorkflow] Using workflowId:', workflowId);
      addLog('info', `📋 Using workflow ID: ${workflowId.substring(0, 20)}...`);

      const payload = {
        prompt,
        workflowId,
        ownerId,
        correlationId: `mcp-mut-${Date.now()}`,
      };

      console.log('[MCPWorkflow] Sending payload:', payload);

      const response = await fetch(`${apiUrl}/ai/mutate-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[MCPWorkflow] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MCPWorkflow] Error response:', errorText);
        throw new Error(errorText || `HTTP ${response.status}: Failed to mutate workflow`);
      }

      const result = await response.json();
      console.log('[MCPWorkflow] Mutation result:', result);
      
      // Display supervisor logs if available
      if (result.supervisorLogs && Array.isArray(result.supervisorLogs)) {
        result.supervisorLogs.forEach((log: string) => {
          addLog('info', log);
        });
      }
      
      if (result.nodes) {
        const nodesAdded = result.nodes.length - nodes.length;
        
        // Ensure all nodes have valid positions and proper data structure
        const nodesWithPositions = result.nodes.map((node: any, index: number) => {
          // Extract description from fields if it exists
          const description = node.data?.fields?.description || node.data?.description || '';
          
          // Clean up fields - remove description if it's there as a field
          const fields = { ...node.data?.fields };
          if (fields.description) {
            delete fields.description;
          }
          
          return {
            ...node,
            type: node.type || 'mcpTool',
            position: node.position || {
              x: index * 280 + 100, // Horizontal spacing
              y: 100, // Same Y position
            },
            data: {
              ...node.data,
              label: node.data?.label || node.type,
              fields: Object.keys(fields).length > 0 ? fields : undefined,
              description: description || undefined,
            },
          };
        });
        
        setNodes(nodesWithPositions);
        
        if (nodesAdded > 0) {
          addLog('success', `✅ Added ${nodesAdded} new node(s)`, {
            nodesAdded,
            totalNodes: nodesWithPositions.length,
            newNodes: nodesWithPositions.slice(-nodesAdded).map((n: any) => ({
              id: n.id,
              type: n.type,
              label: n.data?.label,
              fields: n.data?.fields,
            })),
          });
        } else {
          addLog('success', `✅ Workflow updated`, {
            totalNodes: nodesWithPositions.length,
          });
        }
      }
      if (result.edges) {
        setEdges(result.edges);
      }

      setExecutionCount(prev => prev + 1);

    } catch (err) {
      console.error('[MCPWorkflow] Error mutating workflow:', err);
      addLog('error', '❌ Failed to process prompt', (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveNode = (id: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: newData };
        }
        return node;
      })
    );
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex overflow-hidden">
      {/* Left Sidebar - Tools */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } transition-all duration-300 ease-out bg-[#191919]/80 backdrop-blur-xl border-r border-white/[0.08] overflow-hidden flex flex-col shadow-[4px_0_24px_-8px_rgba(0,0,0,0.5)]`}
      >
        {/* Sidebar Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.08] backdrop-blur-sm flex items-center justify-center shadow-sm">
              <Workflow size={15} className="text-white/70" strokeWidth={2} />
            </div>
            <span className="text-[15px] font-semibold text-white/90 tracking-tight">
              Available Tools
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 hover:bg-white/[0.04] rounded-lg transition-all duration-200 active:scale-95"
          >
            <X size={16} className="text-white/40" strokeWidth={2} />
          </button>
        </div>

        {/* Tools List */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-2 mb-4">
            Add to workflow
          </div>
          {tools.map((tool) => (
            <button
              key={tool.toolId}
              onClick={() => addNodeToCanvas(tool)}
              className="w-full px-3.5 py-3 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-sm border border-white/[0.06] hover:border-white/[0.12] rounded-xl text-left transition-all duration-200 group shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.4)] active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.08] group-hover:from-white/[0.08] group-hover:to-white/[0.12] backdrop-blur-sm flex items-center justify-center transition-all duration-200 shadow-sm">
                  <Zap size={16} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[14px] text-white/90 mb-0.5 truncate">
                    {tool.name}
                  </div>
                  <div className="text-[12px] text-white/50 truncate leading-tight">
                    {tool.description}
                  </div>
                </div>
                <Plus
                  size={16}
                  className="text-white/30 group-hover:text-white/60 transition-colors duration-200 flex-shrink-0"
                  strokeWidth={2}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/[0.06] space-y-3 bg-[#191919]/60 backdrop-blur-xl">
          <div className="flex items-center justify-center gap-4 text-[12px] text-white/40 font-medium">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white/30 shadow-sm"></div>
              {nodes.length} nodes
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white/30 shadow-sm"></div>
              {edges.length} edges
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Nav Bar */}
        <div className="h-[60px] bg-[#191919]/60 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-5 gap-3">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-white/[0.04] rounded-lg transition-all active:scale-95"
            >
              <Menu size={18} className="text-white/60" />
            </button>
          )}

          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/[0.09] to-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center border border-white/[0.06]">
              <Workflow size={18} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-white/95 tracking-tight">{serverName}</h1>
              <p className="text-[11px] text-white/45">Interactive Workflow Builder</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <span className="text-[11px] text-emerald-400 font-semibold">{tools.length} Tools</span>
            </div>
            <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="text-[11px] text-blue-400 font-semibold">{executionCount} Executions</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {runtimeStatus === 'running' ? (
              <button
                onClick={handleToggleRuntime}
                disabled={isTogglingRuntime}
                className="px-4 py-2 text-[13px] font-medium text-red-400 hover:text-red-300 bg-red-500/10 
                    border border-red-500/20 hover:border-red-500/30 rounded-lg flex items-center gap-2 transition-all active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTogglingRuntime ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin" />
                    <span>Stopping...</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <span>Stop Runtime</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleToggleRuntime}
                disabled={isTogglingRuntime}
                className="px-4 py-2 text-[13px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 
                    border border-emerald-500/20 hover:border-emerald-500/30 rounded-lg flex items-center gap-2 transition-all active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTogglingRuntime ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>Start Runtime</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => setLogsOpen(true)}
              className="px-4 py-2 text-[13px] font-medium text-white/70 hover:text-white bg-white/[0.03] 
                  border border-white/[0.08] rounded-lg flex items-center gap-2 transition-all active:scale-95"
            >
              <Terminal size={14} />
              Logs
              {logs.length > 0 && (
                <span className="px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-[10px] font-semibold text-emerald-400">
                  {logs.length}
                </span>
              )}
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 text-[13px] font-medium text-white/70 hover:text-white bg-white/[0.03] 
                  border border-white/[0.08] rounded-lg flex items-center gap-2 transition-all active:scale-95"
            >
              <Save size={14} />
              Save
            </button>

            <button
              onClick={handleDeploy}
              disabled={isDeploying || !!deploymentInfo}
              className="px-4 py-2 text-[13px] font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 
                  border border-purple-500/20 hover:border-purple-500/30 rounded-lg flex items-center gap-2 transition-all active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeploying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-purple-400/20 border-t-purple-400 rounded-full animate-spin" />
                  <span>Deploying...</span>
                </>
              ) : deploymentInfo ? (
                <>
                  <Zap size={14} />
                  <span>Deployed</span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>Deploy to Archestra</span>
                </>
              )}
            </button>

            <button
              onClick={handleRun}
              className="px-4 py-2 text-[13px] font-medium text-black bg-white hover:bg-white/90 rounded-lg 
                  flex items-center gap-2 transition-all active:scale-95"
            >
              <Play size={14} fill="black" />
              Run
            </button>
          </div>
        </div>

        {/* Deployment Info Banner */}
        {deploymentInfo && (
          <div className="px-6 py-3 bg-purple-500/10 border-b border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Zap size={16} className="text-purple-400" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-purple-400">
                    Deployed to Archestra
                  </div>
                  <div className="text-[11px] text-white/50">
                    Agent ID: {deploymentInfo.agentId}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(deploymentInfo.endpoint);
                      addLog('info', '📋 Endpoint copied to clipboard');
                    }
                  }}
                  className="px-3 py-1.5 text-[11px] font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 
                      border border-purple-500/20 hover:border-purple-500/30 rounded-lg transition-all active:scale-95"
                >
                  Copy Endpoint
                </button>
                {deploymentInfo.dashboardUrl && (
                  <a
                    href={deploymentInfo.dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-[11px] font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 
                        border border-purple-500/20 hover:border-purple-500/30 rounded-lg transition-all active:scale-95"
                  >
                    Open Dashboard
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node)}
            onInit={setRfInstance}
            nodeTypes={nodeTypes}
            edgeTypes={{ animated: AnimatedDashedEdge }}
            fitView
            className="bg-[#0F0F0F]"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={36}
              size={0.6}
              color="rgba(255,255,255,0.06)"
            />
          </ReactFlow>

          {/* Empty State */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto">
                  <Workflow size={28} className="text-white/40" />
                </div>
                <p className="text-[15px] text-white/90 font-medium">Start building your workflow</p>
                <p className="text-[13px] text-white/50">Add tools from the sidebar or describe what you need below</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input - Bottom */}
        <div className="p-6 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <div className="bg-[#191919]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex items-end gap-3 p-4">
                <div className="flex-shrink-0 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.1] flex items-center justify-center">
                    <Sparkles size={16} className="text-white/70" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your workflow... (e.g., 'create a sign up api' or 'add JWT authentication')"
                    disabled={isProcessing}
                    className="w-full bg-transparent text-[14px] text-white placeholder-white/40 
                        resize-none focus:outline-none disabled:opacity-50"
                    rows={2}
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isProcessing}
                  className="px-4 py-2.5 text-[13px] font-medium text-black bg-white hover:bg-white/90 rounded-lg 
                      flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      <span>Processing</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>

              <div className="px-4 pb-3">
                <p className="text-[10px] text-white/30">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Node Editor Modal */}
      {selectedNode && (
        <NodeEditorModal
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
          onSave={handleSaveNode}
          allNodes={nodes}
          allEdges={edges}
          graphMeta={null}
        />
      )}

      {/* Run Workflow Modal */}
      <RunWorkflowModal
        isOpen={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        onRun={handleRunWithInput}
        isRunning={isRunning}
      />

      {/* Logs Panel */}
      <MCPLogsPanel
        isOpen={logsOpen}
        onClose={() => setLogsOpen(false)}
        logs={logs}
      />
    </div>
  );
}
