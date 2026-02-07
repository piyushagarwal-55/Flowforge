import { useState, useEffect } from "react";
import { History, Sparkles, ChevronRight, Clock } from "lucide-react";

interface WorkflowHistoryItem {
  workflowId: string;
  prompt: string;
  timestamp: number;
  nodeCount: number;
}

interface WorkflowHistorySidebarProps {
  activeWorkflowId?: string;
  onSelectWorkflow: (workflowId: string) => void;
  onNewWorkflow: () => void;
  onWorkflowSaved?: (workflowId: string, prompt: string) => void; // ✅ NEW: Callback when workflow is saved
}

export function WorkflowHistorySidebar({
  activeWorkflowId,
  onSelectWorkflow,
  onNewWorkflow,
  onWorkflowSaved,
}: WorkflowHistorySidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<WorkflowHistoryItem[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("workflowHistory");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse workflow history:", e);
      }
    }
  }, []);

  // ✅ REMOVED: Don't automatically add to history when workflowId changes
  // Only add when explicitly saved via addToHistory function

  // ✅ NEW: Function to add workflow to history (called after save)
  const addToHistory = (workflowId: string, prompt: string) => {
    setHistory((prev) => {
      // Check if already exists
      const exists = prev.find((item) => item.workflowId === workflowId);
      if (exists) return prev;

      const newItem: WorkflowHistoryItem = {
        workflowId,
        prompt: prompt.slice(0, 50),
        timestamp: Date.now(),
        nodeCount: 0,
      };

      const updated = [newItem, ...prev].slice(0, 20); // Keep last 20
      localStorage.setItem("workflowHistory", JSON.stringify(updated));
      return updated;
    });
  };

  // ✅ NEW: Expose addToHistory via callback
  useEffect(() => {
    if (onWorkflowSaved) {
      // This is a bit hacky, but we need to expose addToHistory to parent
      // In a real app, you'd use a ref or context
      (window as any).__addWorkflowToHistory = addToHistory;
    }
  }, [onWorkflowSaved]);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      {/* Collapsed sidebar */}
      <div
        className={`h-full bg-[#0F0F0F] border-r border-white/[0.06] flex flex-col items-center py-4 transition-all ${
          isExpanded ? "w-0 opacity-0" : "w-[60px] opacity-100"
        }`}
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="w-10 h-10 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] 
            flex items-center justify-center transition-all active:scale-95 group"
          title="Workflow History"
        >
          <History size={18} className="text-white/60 group-hover:text-white/90" />
        </button>

        {/* Active indicator */}
        {history.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {history.slice(0, 5).map((item) => (
              <div
                key={item.workflowId}
                className={`w-2 h-2 rounded-full transition-all ${
                  item.workflowId === activeWorkflowId
                    ? "bg-white/90"
                    : "bg-white/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Expanded sidebar */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setIsExpanded(false)}
          />

          {/* Sidebar panel */}
          <div className="fixed left-0 top-0 bottom-0 w-[320px] bg-[#0F0F0F] border-r border-white/[0.08] z-50 flex flex-col">
            {/* Header */}
            <div className="h-[60px] border-b border-white/[0.06] flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <History size={18} className="text-white/60" />
                <h2 className="text-[14px] font-medium text-white/90">
                  Workflow History
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onNewWorkflow();
                    setIsExpanded(false);
                  }}
                  className="px-3 py-1.5 text-[12px] font-medium text-white bg-white/[0.08] hover:bg-white/[0.12] 
                    rounded-lg transition-all active:scale-95"
                  title="Start new workflow"
                >
                  New
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/[0.04] flex items-center justify-center transition-all"
                >
                  <ChevronRight size={16} className="text-white/60" />
                </button>
              </div>
            </div>

            {/* History list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                    <Sparkles size={20} className="text-white/40" />
                  </div>
                  <p className="text-[13px] text-white/50">
                    No workflows yet
                  </p>
                  <p className="text-[12px] text-white/30 mt-1">
                    Create your first workflow to see history
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <button
                    key={item.workflowId}
                    onClick={() => {
                      onSelectWorkflow(item.workflowId);
                      setIsExpanded(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all group ${
                      item.workflowId === activeWorkflowId
                        ? "bg-white/[0.08] border-white/[0.12]"
                        : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.08]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-[13px] text-white/90 font-medium line-clamp-2 flex-1">
                        {item.prompt}
                      </p>
                      {item.workflowId === activeWorkflowId && (
                        <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-white/40">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {formatTime(item.timestamp)}
                      </span>
                      <span className="text-white/30">•</span>
                      <span>{item.nodeCount || 0} nodes</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="h-[50px] border-t border-white/[0.06] flex items-center justify-center">
              <button
                onClick={() => {
                  if (confirm("Clear all workflow history?")) {
                    setHistory([]);
                    localStorage.removeItem("workflowHistory");
                  }
                }}
                className="text-[12px] text-white/40 hover:text-white/60 transition-colors"
              >
                Clear History
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
