"use client";

import { useState, useEffect } from "react";
import { TamboProvider, useTambo } from "@tambo-ai/react";
import { ChatShell } from "@/components/ChatShell";
import { WorkflowHistorySidebar } from "@/components/WorkflowHistorySidebar";
import dynamic from "next/dynamic";

// Dynamically import FlowForge components
const WorkflowGraph = dynamic(
  () => import("@/components/WorkflowBuilder"),
  { ssr: false }
);

const ExecutionLogsSidebar = dynamic(
  () => import("@/components/Ui/ExecutionLogsSidebar"),
  { ssr: false }
);

const BackendExplainer = dynamic(
  () => import("@/components/BackendExplainer").then((mod) => ({ default: mod.BackendExplainer })),
  { ssr: false }
);

interface IntentResponse {
  workflowPrompt?: string;
  components: string[];
  correlationId: string;
  workflowId?: string; // ✅ NEW
  isNewWorkflow?: boolean; // ✅ NEW
  existingNodeCount?: number; // ✅ NEW
}

function OrchetrixWorkspace() {
  const [intent, setIntent] = useState<IntentResponse | null>(null);
  const [mountedComponents, setMountedComponents] = useState<Set<string>>(
    new Set()
  );
  // ✅ NEW: Track active workflow across conversation
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | undefined>(
    () => {
      // Restore from sessionStorage on mount
      if (typeof window !== "undefined") {
        return sessionStorage.getItem("activeWorkflowId") || undefined;
      }
      return undefined;
    }
  );

  // ✅ NEW: Persist workflowId to sessionStorage
  useEffect(() => {
    if (activeWorkflowId) {
      sessionStorage.setItem("activeWorkflowId", activeWorkflowId);
      console.log(`[OrchetrixWorkspace] 💾 WorkflowId persisted to session`, {
        workflowId: activeWorkflowId,
      });
    }
  }, [activeWorkflowId]);

  const handleWorkflowIdChange = (newWorkflowId: string) => {
    console.log(`[OrchetrixWorkspace] 🔄 WorkflowId changed`, {
      old: activeWorkflowId,
      new: newWorkflowId,
    });
    setActiveWorkflowId(newWorkflowId);
  };

  const handleSelectWorkflow = async (workflowId: string) => {
    console.log(`[OrchetrixWorkspace] 📂 Loading workflow from history`, {
      workflowId,
    });
    
    // ✅ Don't clear intent - just update workflowId
    setActiveWorkflowId(workflowId);
    
    // ✅ Set intent immediately to show canvas
    const newIntent: IntentResponse = {
      components: ["WorkflowGraph"],
      correlationId: `history-${Date.now()}`,
      workflowId,
      isNewWorkflow: false,
      existingNodeCount: 0,
    };
    
    setIntent(newIntent);
    setMountedComponents(new Set(["WorkflowGraph"]));
    
    console.log(`[OrchetrixWorkspace] ✅ Canvas shown, workflow will load`, {
      workflowId,
    });
  };

  const handleNewWorkflow = () => {
    console.log(`[OrchetrixWorkspace] 🆕 Starting new workflow`);
    
    // Clear everything
    setActiveWorkflowId(undefined);
    setIntent(null);
    setMountedComponents(new Set());
    sessionStorage.removeItem("activeWorkflowId");
    
    console.log(`[OrchetrixWorkspace] ✅ Ready for new workflow`);
  };

  const handleBackToWorkflow = () => {
    console.log(`[OrchetrixWorkspace] ⬅️ Navigating back to workflow`, {
      workflowId: activeWorkflowId,
    });
    
    // Switch from BackendExplainer to WorkflowGraph
    const newIntent: IntentResponse = {
      components: ["WorkflowGraph"],
      correlationId: `back-${Date.now()}`,
      workflowId: activeWorkflowId,
      isNewWorkflow: false,
      existingNodeCount: 0,
    };
    
    setIntent(newIntent);
    setMountedComponents(new Set(["WorkflowGraph"]));
    
    console.log(`[OrchetrixWorkspace] ✅ Returned to workflow canvas`);
  };

  const handleIntentReceived = async (newIntent: IntentResponse) => {
    console.log(`[OrchetrixWorkspace] 🎯 Intent received`, {
      correlationId: newIntent.correlationId,
      components: newIntent.components,
      workflowPrompt: newIntent.workflowPrompt,
      workflowId: newIntent.workflowId,
    });

    setIntent(newIntent);

    // ✅ Store workflow prompt for history (use localStorage, not sessionStorage)
    if (newIntent.workflowId && newIntent.workflowPrompt) {
      // Store in localStorage so it persists across refreshes
      localStorage.setItem(
        `workflow_${newIntent.workflowId}_prompt`,
        newIntent.workflowPrompt
      );
    }

    // Track which components should be mounted
    const componentsSet = new Set(newIntent.components);
    setMountedComponents(componentsSet);

    console.log(`[OrchetrixWorkspace] 📦 Components to mount:`, {
      correlationId: newIntent.correlationId,
      components: Array.from(componentsSet),
    });

    // ✅ AUTO-TRIGGER: If workflowPrompt exists, automatically generate the workflow
    if (newIntent.workflowPrompt && newIntent.workflowId && componentsSet.has('WorkflowGraph')) {
      console.log(`[OrchetrixWorkspace] 🤖 Auto-triggering workflow generation`, {
        correlationId: newIntent.correlationId,
        workflowId: newIntent.workflowId,
        prompt: newIntent.workflowPrompt.substring(0, 100),
      });

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/ai/generate-workflow`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: newIntent.workflowPrompt,
              workflowId: newIntent.workflowId,
              ownerId: 'user_default',
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`[OrchetrixWorkspace] ✅ Workflow generated automatically`, {
            correlationId: newIntent.correlationId,
            workflowId: newIntent.workflowId,
            nodeCount: data.nodes?.length || 0,
          });
          // The polling mechanism in WorkflowPage will pick up the changes
        } else {
          const errorData = await response.json();
          console.error(`[OrchetrixWorkspace] ❌ Auto-generation failed`, {
            correlationId: newIntent.correlationId,
            status: response.status,
            error: errorData,
          });
        }
      } catch (error) {
        console.error(`[OrchetrixWorkspace] ❌ Auto-generation error`, {
          correlationId: newIntent.correlationId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  };

  useEffect(() => {
    if (intent) {
      console.log(`[OrchetrixWorkspace] 🔄 Intent state updated`, {
        correlationId: intent.correlationId,
        mountedComponents: Array.from(mountedComponents),
      });
    }
  }, [intent, mountedComponents]);

  // Component mount/unmount logging
  useEffect(() => {
    mountedComponents.forEach((component) => {
      console.log(`[OrchetrixWorkspace] ✅ Component mounted: ${component}`, {
        correlationId: intent?.correlationId,
        timestamp: new Date().toISOString(),
      });
    });

    return () => {
      mountedComponents.forEach((component) => {
        console.log(
          `[OrchetrixWorkspace] ❌ Component unmounted: ${component}`,
          {
            correlationId: intent?.correlationId,
            timestamp: new Date().toISOString(),
          }
        );
      });
    };
  }, [mountedComponents, intent?.correlationId]);

  return (
    <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex">
      {/* LEFT: Thin history sidebar (always visible) */}
      <WorkflowHistorySidebar
        activeWorkflowId={activeWorkflowId}
        onSelectWorkflow={handleSelectWorkflow}
        onNewWorkflow={handleNewWorkflow}
      />

      {/* RIGHT: Main content area */}
      <div className="flex-1 flex flex-col">
        {!intent ? (
          // Initial state: Welcome screen with chat input at bottom
          <div className="flex-1 flex flex-col">
            {/* Welcome content */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 px-6">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-white/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold text-white/90">
                  Welcome to FlowForge
                </h1>
                <p className="text-[15px] text-white/50 max-w-md">
                  Describe the backend you want to build, and I'll create it for you.
                </p>
              </div>
            </div>

            {/* Chat input at bottom (compact mode) */}
            <div className="border-t border-white/[0.06] bg-[#0F0F0F]/80 backdrop-blur-xl">
              <ChatShell
                onIntentReceived={handleIntentReceived}
                workflowId={activeWorkflowId}
                onWorkflowIdChange={handleWorkflowIdChange}
                compact={true}
              />
            </div>
          </div>
        ) : (
          // After intent: Canvas with chat at bottom
          <div className="flex-1 flex flex-col">
            {/* Canvas area */}
            <div className="flex-1 relative overflow-hidden">
              {mountedComponents.has("WorkflowGraph") && (
                <div className="absolute inset-0">
                  <WorkflowGraph workflowId={activeWorkflowId} />
                </div>
              )}

              {mountedComponents.has("ExecutionLogs") && (
                <ExecutionLogsSidebar
                  isOpen={true}
                  onClose={() => {
                    setMountedComponents((prev) => {
                      const next = new Set(prev);
                      next.delete("ExecutionLogs");
                      return next;
                    });
                  }}
                  logs={[]}
                  isPolling={false}
                  executionId={null}
                />
              )}

              {mountedComponents.has("DeployPanel") && (
                <div className="absolute top-4 right-4 bg-white/[0.05] border border-white/[0.08] rounded-xl p-6">
                  <h3 className="text-white/90 font-semibold mb-2">
                    Deploy Panel
                  </h3>
                  <p className="text-white/50 text-sm">
                    Deployment options will appear here
                  </p>
                </div>
              )}

              {mountedComponents.has("APIPlayground") && (
                <div className="absolute bottom-4 left-4 bg-white/[0.05] border border-white/[0.08] rounded-xl p-6">
                  <h3 className="text-white/90 font-semibold mb-2">
                    API Playground
                  </h3>
                  <p className="text-white/50 text-sm">
                    Test your API endpoints here
                  </p>
                </div>
              )}

              {mountedComponents.has("NodeInspector") && (
                <div className="absolute top-4 left-4 bg-white/[0.05] border border-white/[0.08] rounded-xl p-6">
                  <h3 className="text-white/90 font-semibold mb-2">
                    Node Inspector
                  </h3>
                  <p className="text-white/50 text-sm">
                    Inspect workflow nodes here
                  </p>
                </div>
              )}

              {mountedComponents.has("BackendExplainer") && (
                <div className="absolute inset-0">
                  <BackendExplainer
                    workflowId={activeWorkflowId}
                    ownerId="user_default"
                    onBack={handleBackToWorkflow}
                  />
                </div>
              )}
            </div>

            {/* Chat at bottom (compact) */}
            <div className="border-t border-white/[0.06] bg-[#0F0F0F]/80 backdrop-blur-xl">
              <ChatShell
                onIntentReceived={handleIntentReceived}
                workflowId={activeWorkflowId}
                onWorkflowIdChange={handleWorkflowIdChange}
                compact={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  console.log(`[Home] 🚀 FlowForge initializing`, {
    hasApiKey: !!apiKey,
    timestamp: new Date().toISOString(),
  });

  if (!apiKey) {
    console.error(
      `[Home] ❌ NEXT_PUBLIC_TAMBO_API_KEY not found in environment`
    );
    return (
      <div className="w-full h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white/90 mb-2">
            Configuration Error
          </h1>
          <p className="text-white/50">
            NEXT_PUBLIC_TAMBO_API_KEY not found in .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <TamboProvider apiKey={apiKey}>
      <OrchetrixWorkspace />
    </TamboProvider>
  );
}
