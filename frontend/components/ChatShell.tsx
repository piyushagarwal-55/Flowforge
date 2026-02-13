"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { generateMCPServer, createAndAttachAgent } from "@/lib/mcpApi";
import { useMCPStore } from "@/lib/mcpStore";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  correlationId?: string;
}

interface IntentResponse {
  workflowPrompt?: string;
  components: string[];
  correlationId: string;
  workflowId?: string;
  isNewWorkflow?: boolean;
  existingNodeCount?: number;
}

interface ChatShellProps {
  onIntentReceived?: (intent: IntentResponse) => void;
  workflowId?: string;
  onWorkflowIdChange?: (workflowId: string) => void;
  compact?: boolean;
}

export function ChatShell({ onIntentReceived, workflowId, onWorkflowIdChange, compact = false }: ChatShellProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { setCurrentServerId, setCurrentAgentId } = useMCPStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const correlationId = uuidv4();
    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
      correlationId,
    };

    console.log(`[ChatShell] 🚀 User message submitted`, {
      correlationId,
      message: userMessage.content,
      timestamp: new Date(userMessage.timestamp).toISOString(),
    });

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      console.log(`[ChatShell] 📡 Generating MCP server`, {
        correlationId,
        prompt: userMessage.content,
      });

      // Generate MCP server
      const mcpServer = await generateMCPServer(userMessage.content);

      console.log(`[ChatShell] ✅ MCP server generated`, {
        correlationId,
        serverId: mcpServer.serverId,
        name: mcpServer.name,
        toolCount: mcpServer.tools.length,
        apiEndpoint: mcpServer.apiEndpoint,
      });

      // Store serverId and API metadata
      setCurrentServerId(mcpServer.serverId);
      
      // Store API metadata in localStorage for display
      if (typeof window !== 'undefined') {
        localStorage.setItem(`mcp_api_${mcpServer.serverId}`, JSON.stringify({
          apiEndpoint: mcpServer.apiEndpoint,
          exampleCurl: mcpServer.exampleCurl,
          exampleFetch: mcpServer.exampleFetch,
        }));
      }

      // Auto-create and attach agent
      console.log(`[ChatShell] 🤖 Creating and attaching agent`, {
        correlationId,
        serverId: mcpServer.serverId,
      });

      const agentId = await createAndAttachAgent(mcpServer.serverId, mcpServer.tools);

      console.log(`[ChatShell] ✅ Agent created and attached`, {
        correlationId,
        agentId,
      });

      // Store agentId
      setCurrentAgentId(agentId);

      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: `Created MCP server "${mcpServer.name}" with ${mcpServer.tools.length} tools. Redirecting to dashboard...`,
        timestamp: Date.now(),
        correlationId,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Navigate to MCP dashboard
      setTimeout(() => {
        router.push(`/mcp?serverId=${mcpServer.serverId}`);
      }, 1000);

      // Call legacy callback if provided
      if (onIntentReceived) {
        onIntentReceived({
          workflowPrompt: userMessage.content,
          components: ['MCPDashboard'],
          correlationId,
          workflowId: mcpServer.serverId,
          isNewWorkflow: true,
          existingNodeCount: 0,
        });
      }
    } catch (error) {
      console.error(`[ChatShell] ❌ Error processing request`, {
        correlationId,
        error: error instanceof Error ? error.message : String(error),
      });

      const errorMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
        correlationId,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`w-full ${compact ? 'h-auto' : 'h-screen'} bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex flex-col`}>
      {/* Messages Area - Only show in full mode */}
      {!compact && (
        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
                <div className="w-20 h-20 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-6">
                  <Sparkles size={32} className="text-white/40" />
                </div>
                <h1 className="text-2xl font-semibold text-white/90 mb-2">
                  Welcome to FlowForge
                </h1>
                <p className="text-white/50 text-center max-w-md">
                  Describe the backend you want to build, and I'll create it for you.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                      message.role === "user"
                        ? "bg-white text-black"
                        : "bg-white/[0.05] border border-white/[0.08] text-white/90"
                    }`}
                  >
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    {message.correlationId && (
                      <p className="text-[10px] opacity-40 mt-2 font-mono">
                        {message.correlationId.slice(0, 8)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse delay-75" />
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse delay-150" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className={`${compact ? '' : 'border-t border-white/[0.06]'} p-6`}>
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="bg-[#191919]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="flex items-end gap-3 p-4">
              <div className="flex-shrink-0 mb-1">
                <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.1] flex items-center justify-center">
                  <Sparkles size={16} className="text-white/70" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your backend... (e.g., Create a signup API with email validation)"
                  disabled={isLoading}
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
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                        ${
                          input.trim() && !isLoading
                            ? "bg-white hover:bg-white/90 text-black active:scale-95"
                            : "bg-white/[0.08] text-white/30 cursor-not-allowed"
                        }`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>

            <div className="px-4 pb-3 flex items-center justify-between text-[11px] text-white/40">
              <span>Press Enter to send • Shift+Enter for new line</span>
              <span className="flex items-center gap-1">
                <Sparkles size={10} />
                AI-powered
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
