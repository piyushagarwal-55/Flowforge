/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  useNodesState,
  useEdgesState,
  Connection,
  ReactFlow,
  Background,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { v4 as uuid } from "uuid";
import { Menu, Play, Save, Workflow, Sparkles, ArrowRight } from "lucide-react";

import { nodeTypes } from "@/components/nodes/NodesStore";
import NodeEditorSidebar from "@/components/Ui/NodesSidebar";
import { Sidebar } from "@/components/Ui/Sidebar";
import ExecutionLogsSidebar from "@/components/Ui/ExecutionLogsSidebar";
import SaveWorkflowModal from "@/components/workflow/SaveWorkflowModal";

import { createNode } from "@/components/workflow/nodes/addNode";
import { saveNodeChanges } from "@/components/workflow/nodes/saveNode";

import { buildForSave } from "@/components/workflow/build/buildForSave";
import { buildForExecute } from "@/components/workflow/build/buildForExecute";

import { handleOnConnect } from "@/components/workflow/nodes/onConnect";
import { getExecutionOrder } from "@/utils/topoOrder";
import { calcStepNumbers } from "@/utils/calcStepNumbers";
import { buildGraphMeta } from "@/components/workflow/validation/buildGraph";
import { validateGraph } from "@/components/workflow/validation/validateGraph";
import { RootDispatch, RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import AnimatedDashedEdge from "@/components/Ui/AnimatedDashedEdge";
import { fetchDbSchemas } from "@/store/dbSchemasSlice";
import { useExecutionStream } from "@/hooks/useExecutionStream";
import { ExecutionStreamProvider } from "@/components/ExecutionStreamProvider";
type ExecutionLog = {
  executionId: string;
  stepIndex?: number;
  stepType?: string;
  phase?: "step_started" | "info" | "data" | "success" | "step_finished" | "error" | "execution_failed" | "execution_finished";
  title?: string;
  data?: any;
  durationMs?: number;
  timestamp: number;
};

interface WorkflowPageProps {
  params?: any;
  searchParams?: any;
}

export default function WorkflowPage(_props: WorkflowPageProps) {
  // For client components, we don't use server props
  // These would come from URL or state if needed
  const autoGeneratePrompt: string | undefined = undefined;
  const workflowId: string | undefined = undefined;
  const ownerId: string = "user_default";
  const [graphMeta, setGraphMeta] = useState<any>(null);
  const dbSchemas = useSelector((state: RootState) => state.dbSchemas.schemas);
  const dispatch = useDispatch<RootDispatch>();
  const schemas = useSelector((state: RootState) => state.dbSchemas.schemas);
  console.log("DB Schemas in WorkflowPage:", schemas);
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const processedPromptsRef = useRef<Set<string>>(new Set()); // Track processed prompts to avoid infinite loops
  const [execution, setExecution] = useState<{
    executionId: string;
    logs: ExecutionLog[];
    finished: boolean;
  } | null>(null);
  // Modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedWorkflowData, setSavedWorkflowData] = useState<{
    workflowId: string;
    apiPath: string;
    apiName: string;
    inputVariables?: any;
  } | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  console.log("Rerendering WorkflowPage", savedWorkflowData);
  // STEP NUMBERS
  const stepNumbers = calcStepNumbers(nodes, edges) as Record<string, number>;

  const nodesWithSteps = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      _stepNumber: stepNumbers[n.id] ?? null,
    },
  }));

  useEffect(() => {
    dispatch(fetchDbSchemas());
  }, [dispatch]);

  // ✅ NEW: Load existing workflow when workflowId changes
  useEffect(() => {
    if (workflowId && !autoGeneratePrompt) {
      console.log(`[WorkflowPage] 📂 Loading existing workflow`, {
        workflowId,
      });

      setIsInitialLoadComplete(false);

      (async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"}/workflows/${workflowId}?ownerId=${ownerId}`
          );

          console.log(`[WorkflowPage] 📡 Fetch response`, {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            url: response.url,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[WorkflowPage] ❌ Failed to load workflow`, {
              status: response.status,
              errorPreview: errorText.substring(0, 200),
              isHTML: errorText.startsWith('<!'),
            });
            setIsInitialLoadComplete(true);
            
            // Show empty canvas if workflow not found
            if (response.status === 404) {
              console.log(`[WorkflowPage] 📭 Workflow not found, showing empty canvas`);
              setNodes([]);
              setEdges([]);
            }
            return;
          }

          const workflowData = await response.json();

          console.log(`[WorkflowPage] ✅ Workflow loaded`, {
            workflowId,
            nodeCount: workflowData.steps?.length || 0,
          });

          // Convert backend format to ReactFlow format
          const reactNodes = workflowData.steps.map((step: any, index: number) => ({
            id: step.id,
            type: step.type,
            position: step.position || {
              x: (index % 3) * 280,
              y: Math.floor(index / 3) * 180,
            },
            data: step.data,
          }));

          const reactEdges = (workflowData.edges || []).map((edge: any) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: "animated",
          }));

          console.log(`[WorkflowPage] 🎨 Loaded workflow`, {
            nodeCount: reactNodes.length,
            edgeCount: reactEdges.length,
            nodes: reactNodes.map((n: any) => ({ id: n.id, type: n.type })),
            edges: reactEdges.map((e: any) => ({ id: e.id, source: e.source, target: e.target })),
          });

          setNodes(reactNodes);
          setEdges(reactEdges);

          const meta = buildGraphMeta(reactNodes, reactEdges, dbSchemas);
          setGraphMeta(meta);
          
          setIsInitialLoadComplete(true);
        } catch (error) {
          console.error(`[WorkflowPage] ❌ Error loading workflow:`, error);
          setIsInitialLoadComplete(true);
          // Show empty canvas on error
          setNodes([]);
          setEdges([]);
        }
      })();
    }
  }, [workflowId, autoGeneratePrompt, ownerId, dbSchemas]);

  // ✅ NEW: Poll for workflow updates every 2 seconds when workflowId exists
  useEffect(() => {
    // Only poll if:
    // 1. workflowId exists
    // 2. Not in auto-generate mode
    // 3. Initial load is complete
    if (!workflowId || autoGeneratePrompt || !isInitialLoadComplete) {
      console.log(`[WorkflowPage] ⏸️ Polling disabled`, {
        workflowId: !!workflowId,
        autoGeneratePrompt: !!autoGeneratePrompt,
        isInitialLoadComplete,
      });
      return;
    }

    console.log(`[WorkflowPage] 🔄 Starting polling for workflow updates`, {
      workflowId,
      currentNodeCount: nodes.length,
    });

    const pollInterval = setInterval(async () => {
      try {
        console.log(`[WorkflowPage] 📡 Polling workflow...`, {
          workflowId,
          currentNodeCount: nodes.length,
        });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"}/workflows/${workflowId}?ownerId=${ownerId}`
        );

        if (!response.ok) {
          console.warn(`[WorkflowPage] ⚠️ Polling failed`, {
            status: response.status,
            statusText: response.statusText,
          });
          return;
        }

        const workflowData = await response.json();
        const newNodeCount = workflowData.steps?.length || 0;

        console.log(`[WorkflowPage] 📊 Polling result`, {
          currentNodeCount: nodes.length,
          newNodeCount,
          changed: newNodeCount !== nodes.length,
          steps: workflowData.steps?.map((s: any) => ({ id: s.id, type: s.type })),
        });

        // Only update if node count changed
        if (newNodeCount !== nodes.length) {
          const nodesAdded = newNodeCount - nodes.length;
          
          console.log(`[WorkflowPage] 🔄 Workflow updated, reloading`, {
            oldCount: nodes.length,
            newCount: newNodeCount,
            nodesAdded,
          });

          const reactNodes = workflowData.steps.map((step: any, index: number) => ({
            id: step.id,
            type: step.type,
            position: step.position || {
              x: (index % 3) * 280,
              y: Math.floor(index / 3) * 180,
            },
            data: step.data,
          }));

          const reactEdges = (workflowData.edges || []).map((edge: any) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: "animated",
          }));

          console.log(`[WorkflowPage] 🎨 Updating canvas`, {
            newNodes: reactNodes.map((n: any) => ({ id: n.id, type: n.type, isNew: n.data?._isNew })),
            newEdges: reactEdges.map((e: any) => ({ id: e.id, source: e.source, target: e.target })),
          });

          setNodes(reactNodes);
          setEdges(reactEdges);

          const meta = buildGraphMeta(reactNodes, reactEdges, dbSchemas);
          setGraphMeta(meta);
          
          // Show update notification
          if (nodesAdded > 0) {
            console.log(`[WorkflowPage] 🎉 Showing notification`, {
              nodesAdded,
            });

            // Create a temporary notification element
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-slide-in';
            notification.innerHTML = `
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="font-medium">Workflow updated! +${nodesAdded} node${nodesAdded > 1 ? 's' : ''} added</span>
            `;
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
              notification.style.opacity = '0';
              notification.style.transform = 'translateX(100%)';
              setTimeout(() => notification.remove(), 300);
            }, 3000);
          }
        }
      } catch (error) {
        console.error(`[WorkflowPage] ❌ Polling error:`, error);
      }
    }, 2000);

    return () => {
      console.log(`[WorkflowPage] ⏹️ Stopping polling`);
      clearInterval(pollInterval);
    };
  }, [workflowId, autoGeneratePrompt, ownerId, nodes.length, dbSchemas, isInitialLoadComplete]);

  // ORDER MAPPING
  function computeStepMapping(nodes: any[], edges: any[]) {
    const ordered = getExecutionOrder(nodes, edges);
    const map: Record<string, number> = {};
    let step = 1;
    ordered.forEach((n) => (map[n.id] = step++));
    return map;
  }

  // Add this after your other state declarations (around line 75)
  const handleLogsUpdate = useCallback((logs: ExecutionLog[]) => {
    setExecution((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        logs,
        finished: logs.some(
          (l) =>
            l.phase === "execution_finished" || l.phase === "execution_failed"
        ),
      };
    });
  }, []); // Empty deps since we use the functional form of setExecution

  // GRAPH META
  useEffect(() => {
    try {
      const meta = buildGraphMeta(nodes, edges, dbSchemas);
      setGraphMeta(meta);
    } catch {
      setGraphMeta(null);
    }
  }, [nodes, edges]);

  useEffect(() => {
    const aiWorkflow = sessionStorage.getItem("aiWorkflow");
    if (aiWorkflow) {
      const { nodes, edges } = JSON.parse(aiWorkflow);
      setNodes(nodes);
      setEdges(edges);
      sessionStorage.removeItem("aiWorkflow");

      const meta = buildGraphMeta(nodes, edges, dbSchemas);
      setGraphMeta(meta);
    }
  }, []);

  useEffect(() => {
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        type: e.type ?? "animated",
      }))
    );
  }, []);

  // ✅ AUTO-GENERATION: Trigger workflow generation when autoGeneratePrompt is provided
  useEffect(() => {
    if (!autoGeneratePrompt || isGenerating) return;
    
    // Create a unique key for this generation request (without nodes.length to prevent re-triggering)
    const promptKey = `${workflowId}-${autoGeneratePrompt}`;
    
    // Skip if we've already processed this exact prompt
    if (processedPromptsRef.current.has(promptKey)) {
      console.log(`[WorkflowPage] ⏭️ Skipping already processed prompt`, {
        promptKey,
        currentNodeCount: nodes.length,
      });
      return;
    }
    
    const isMutation = nodes.length > 0;
    
    console.log(`[WorkflowPage] 🤖 Auto-generating workflow`, {
      prompt: autoGeneratePrompt,
      workflowId,
      isMutation,
      existingNodeCount: nodes.length,
      promptKey,
    });
    
    // Mark this prompt as processed BEFORE making the request
    processedPromptsRef.current.add(promptKey);
    
    // Set the prompt and trigger generation
    setAiPrompt(autoGeneratePrompt);
    
    // Trigger generation automatically
    (async () => {
      setIsGenerating(true);
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"}/workflow/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              prompt: autoGeneratePrompt,
              workflowId,
              ownerId,
            }),
          });

          const ai = await res.json();

          console.log(`[WorkflowPage] 📦 AI response received`, {
            hasNodes: !!ai.nodes,
            hasEdges: !!ai.edges,
            nodeCount: ai.nodes?.length || 0,
            edgeCount: ai.edges?.length || 0,
            nodes: ai.nodes?.map((n: any) => ({ id: n.id, type: n.type, isNew: n.data?._isNew })),
            metadata: ai.metadata,
          });

          if (!ai.nodes || !ai.edges) {
            console.error("Invalid AI workflow returned");
            return;
          }

          const reactNodes = ai.nodes.map((n: any, index: number) => ({
            id: n.id,
            type: n.type,
            position: { x: (index % 3) * 280, y: Math.floor(index / 3) * 180 },
            data: n.data,
          }));

          const reactEdges = ai.edges.map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: "animated",
          }));

          setNodes(reactNodes);
          setEdges(reactEdges);

          const meta = buildGraphMeta(reactNodes, reactEdges, dbSchemas);
          setGraphMeta(meta);

          console.log(`[WorkflowPage] ✅ Auto-generation complete`, {
            nodeCount: reactNodes.length,
            edgeCount: reactEdges.length,
          });

          // Mark initial load as complete after generation
          setIsInitialLoadComplete(true);

          // ✅ AUTO-SAVE: Save workflow to database after generation
          console.log(`[WorkflowPage] 💾 Auto-saving workflow...`);
          
          try {
            const payload = buildForSave(reactNodes, reactEdges);
            const inputVariables = extractInputVariables(reactNodes);
            
            // Generate API name from prompt
            const promptText: string = autoGeneratePrompt ?? "workflow";
            const apiName = promptText
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, "")
              .trim()
              .split(/\s+/)
              .slice(0, 4)
              .join("-");

            const saveRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"}/workflows/save`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...payload,
                apiName,
                inputVariables,
                workflowId, // Include workflowId for updates
                ownerId,
              }),
            });

            const saveResult = await saveRes.json();
            
            if (saveResult.ok) {
              console.log(`[WorkflowPage] ✅ Workflow auto-saved`, {
                workflowId: saveResult.workflowId,
                apiName: saveResult.apiName,
              });
              
              // ✅ NEW: Add to history after successful save
              if ((window as any).__addWorkflowToHistory) {
                (window as any).__addWorkflowToHistory(
                  saveResult.workflowId,
                  autoGeneratePrompt || "workflow"
                );
              }
            }
          } catch (saveError) {
            console.error(`[WorkflowPage] ❌ Auto-save failed:`, saveError);
          }
      } catch (error) {
        console.error("[WorkflowPage] ❌ Auto-generation failed:", error);
      } finally {
        setIsGenerating(false);
      }
    })();
  }, [autoGeneratePrompt, workflowId, ownerId, dbSchemas, isGenerating]);

  useEffect(() => {
    const stepMap = computeStepMapping(nodes, edges);

    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: {
          ...n.data,
          _stepNumber: stepMap[n.id] || 0,
        },
      }))
    );
  }, [nodes.length, edges.length]);

  // CONNECTIONS
  const onConnect = (params: Connection) => {
    const edgeWithId = {
      ...params,
      id: uuid(),
      type: "animated", // ✅ IMPORTANT
    };

    const result = handleOnConnect(
      edgeWithId,
      rfInstance,
      nodes,
      edges,
      dbSchemas
    );

    try {
      validateGraph(result.nodes, result.edges, dbSchemas);
    } catch (err: any) {
      console.warn("Invalid connection:", err?.message);
      return;
    }

    setNodes(result.nodes);
    setEdges(result.edges);
    setGraphMeta(buildGraphMeta(result.nodes, result.edges, dbSchemas));
  };

  // AI WORKFLOW GENERATION
  const generateAIWorkflow = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) return;

    setIsGenerating(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"}/workflow/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const ai = await res.json();

      if (!ai.nodes || !ai.edges) {
        alert("Invalid AI workflow returned");
        return;
      }

      const reactNodes = ai.nodes.map((n: any, index: number) => ({
        id: n.id,
        type: n.type,
        position: { x: (index % 3) * 280, y: Math.floor(index / 3) * 180 },
        data: n.data,
      }));

      const reactEdges = ai.edges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "animated",
      }));

      setNodes(reactNodes);
      setEdges(reactEdges);

      const meta = buildGraphMeta(reactNodes, reactEdges, dbSchemas);
      setGraphMeta(meta);

      setAiPrompt("");
    } catch (error) {
      console.error("AI generation error:", error);
      alert("Failed to generate workflow");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generateAIWorkflow();
    }
  };

  // SAVE WORKFLOW - Opens modal
  const saveWorkflow = async () => {
    try {
      validateGraph(nodes, edges, dbSchemas);
      console.log("✅ Workflow valid, opening save modal");
      console.log("🧾 Nodes:", nodes);
      console.log("🧾 Edges:", edges);
    } catch (err: any) {
      return alert("Cannot save workflow: " + err.message);
    }

    // Reset saved data and open the modal
    setSavedWorkflowData(null);
    setSaveModalOpen(true);
  };
  function extractInputVariables(
    nodes: any[]
  ): Array<{ name: string; type?: string; default?: any }> {
    const inputNode = nodes.find((n) => n.type === "input");

    if (!inputNode?.data?.fields?.variables) {
      return [];
    }

    return inputNode.data.fields.variables.map((v: any) => ({
      name: v.name,
      type: v.type || "string",
      default: v.default,
    }));
  }

  // ACTUAL SAVE - Called from modal with apiName
  const handleSaveWithApiName = async (apiName: string) => {
    setIsSaving(true);

    try {
      const payload = buildForSave(nodes, edges);
      const inputVariables = extractInputVariables(nodes);

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"}/workflows/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          apiName,
          inputVariables, // Include input variables
        }),
      });

      const result = await res.json();
      console.log("💾 Workflow saved:", result);

      if (!result.ok) throw new Error("Save failed");

      // Set saved data to show success screen
      setSavedWorkflowData({
        workflowId: result.workflowId,
        apiPath: result.apiPath,
        apiName: result.apiName,
        inputVariables: result.inputVariables,
      });
      
      // ✅ NEW: Add to history after successful manual save
      if ((window as any).__addWorkflowToHistory) {
        (window as any).__addWorkflowToHistory(
          result.workflowId,
          apiName
        );
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save workflow");
    } finally {
      setIsSaving(false);
    }
  };

  const runWorkflow = async () => {
    try {
      validateGraph(nodes, edges, dbSchemas);
    } catch (err: any) {
      alert("Cannot run workflow: " + err.message);
      return;
    }

    const payload = buildForExecute(nodes, edges);

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"}/workflow/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const output = await res.json();
    console.log("🚀 Execution started:", output);

    if (!output.executionId) return;

    setExecution({
      executionId: output.executionId,
      logs: [],
      finished: false,
    });

    setLogsOpen(true);
  };

  // NODE SAVE HANDLER
  const handleSaveNode = (id: string, newData: any) => {
    setNodes((curr) => saveNodeChanges(id, newData, curr));
  };

  const edgeTypes = {
    animated: AnimatedDashedEdge,
  };
  return (
    <div className="w-full h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        addNode={(t, l) => setNodes((n) => [...n, createNode(t, l)])}
        clearNodes={() => {
          setNodes([]);
          setEdges([]);
        }}
        nodes={nodes}
        edges={edges}
      />

      <div className="flex-1 flex flex-col relative">
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

          <button
            onClick={saveWorkflow}
            className="px-4 py-2 text-[13px] font-medium text-white/70 hover:text-white bg-white/[0.03] 
                border border-white/[0.08] rounded-lg flex items-center gap-2 transition-all active:scale-95"
          >
            <Save size={14} />
            Save
          </button>

          <button
            onClick={runWorkflow}
            className="px-4 py-2 text-[13px] font-medium text-black bg-white hover:bg-white/90 rounded-lg 
                flex items-center gap-2 transition-all active:scale-95"
          >
            <Play size={14} fill="black" />
            Run
          </button>
        </div>

        {/* ReactFlow Canvas */}
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <ReactFlow
              nodes={nodesWithSteps}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(_, n) => setSelectedNode(n)}
              onInit={(inst) => setRfInstance(inst)}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
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

            {selectedNode && (
              <div className="absolute right-0 top-0 h-full z-40">
                <NodeEditorSidebar
                  selectedNode={selectedNode}
                  onClose={() => setSelectedNode(null)}
                  onSave={handleSaveNode}
                  allNodes={nodes}
                  allEdges={edges}
                  graphMeta={graphMeta}
                />
              </div>
            )}
          </div>

          {/* Empty State */}
          {nodes.length === 0 && (
            <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto">
                  <Workflow size={28} className="text-white/40" />
                </div>
                <p className="text-[15px] text-white/90 font-medium">
                  Start building your workflow
                </p>
                <p className="text-[13px] text-white/50">
                  Use the sidebar or describe what you need below
                </p>
              </div>
            </div>
          )}

          {/* AI Prompt Input */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
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
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Describe your API workflow... (e.g., Create a login API with email validation)"
                      disabled={isGenerating}
                      className="w-full bg-transparent text-[14px] text-white placeholder-white/40 
                          resize-none focus:outline-none leading-relaxed max-h-32 min-h-[24px]"
                      rows={1}
                      style={{
                        height: "auto",
                        minHeight: "24px",
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height = target.scrollHeight + "px";
                      }}
                    />
                  </div>

                  <div className="flex-shrink-0 mb-1">
                    <button
                      onClick={generateAIWorkflow}
                      disabled={!aiPrompt.trim() || isGenerating}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                            ${
                              aiPrompt.trim() && !isGenerating
                                ? "bg-white hover:bg-white/90 text-black active:scale-95"
                                : "bg-white/[0.08] text-white/30 cursor-not-allowed"
                            }`}
                    >
                      {isGenerating ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                      ) : (
                        <ArrowRight size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="px-4 pb-3 flex items-center justify-between text-[11px] text-white/40">
                  <span>
                    Press Enter to generate • Shift+Enter for new line
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={10} />
                    AI-powered
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Logs Sidebar */}
      <ExecutionLogsSidebar
        isOpen={logsOpen}
        onClose={() => setLogsOpen(false)}
        logs={execution?.logs || []}
        isPolling={execution ? !execution.finished : false}
        executionId={execution?.executionId || null}
      />

      {/* Save Workflow Modal */}
      <SaveWorkflowModal
        isOpen={saveModalOpen}
        onClose={() => {
          setSaveModalOpen(false);
          setSavedWorkflowData(null);
        }}
        onSave={handleSaveWithApiName}
        isSaving={isSaving}
        savedData={savedWorkflowData}
      />

      {/* Execution Stream Provider - conditionally rendered */}
      {/* Execution Stream Provider - conditionally rendered */}
      {execution?.executionId && (
        <ExecutionStreamProvider
          executionId={execution.executionId}
          onUpdate={handleLogsUpdate}
        />
      )}
    </div>
  );
}
