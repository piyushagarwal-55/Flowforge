"use client";

import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Server, Play, Zap, Shield, Activity, Plus, ArrowRight, ExternalLink, Copy, Check, TestTube } from "lucide-react";
import { listMCPServers, startRuntime } from "@/lib/mcpApi";
import ApiTester from "@/components/mcp/ApiTester";

interface MCPServer {
  serverId: string;
  name: string;
  description: string;
  toolCount: number;
  resourceCount: number;
  agentCount: number;
  status: string;
  runtimeStatus: string;
  createdAt: string;
}

function MCPDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingRuntime, setStartingRuntime] = useState<string | null>(null);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [apiMetadata, setApiMetadata] = useState<any>(null);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedFetch, setCopiedFetch] = useState(false);
  const [showApiTester, setShowApiTester] = useState(false);

  useEffect(() => {
    fetchServers();
    
    // Check if serverId in URL (from chat redirect)
    const serverId = searchParams.get('serverId');
    if (serverId) {
      setSelectedServerId(serverId);
      
      // Load API metadata from localStorage
      const metadata = localStorage.getItem(`mcp_api_${serverId}`);
      if (metadata) {
        setApiMetadata(JSON.parse(metadata));
      }
    }
  }, [searchParams]);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const data = await listMCPServers();
      setServers(data.servers || []);
    } catch (error) {
      console.error("Failed to fetch servers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRuntime = async (serverId: string) => {
    try {
      setStartingRuntime(serverId);
      await startRuntime(serverId);
      await fetchServers(); // Refresh to get updated status
    } catch (error) {
      console.error("Failed to start runtime:", error);
    } finally {
      setStartingRuntime(null);
    }
  };

  const handleOpenDashboard = (serverId: string) => {
    router.push(`/mcp/workflow/${serverId}`);
  };

  const handleCopy = async (text: string, type: 'endpoint' | 'curl' | 'fetch') => {
    await navigator.clipboard.writeText(text);
    
    if (type === 'endpoint') {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    } else if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else {
      setCopiedFetch(true);
      setTimeout(() => setCopiedFetch(false), 2000);
    }
  };

  const handleViewApi = (serverId: string) => {
    setSelectedServerId(serverId);
    
    // Load API metadata
    const metadata = localStorage.getItem(`mcp_api_${serverId}`);
    if (metadata) {
      setApiMetadata(JSON.parse(metadata));
    } else {
      // Generate default metadata
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      setApiMetadata({
        apiEndpoint: `${apiUrl}/mcp/api/${serverId}`,
        exampleCurl: `curl -X POST ${apiUrl}/mcp/api/${serverId} \\\n  -H "Content-Type: application/json" \\\n  -d '{"key": "value"}'`,
        exampleFetch: `fetch("${apiUrl}/mcp/api/${serverId}", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ key: "value" })\n})\n  .then(res => res.json())\n  .then(data => console.log(data));`
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.08),transparent_60%)]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Server className="text-emerald-400" size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white/95">MCP Control Plane</h1>
              <p className="text-white/50 mt-1">Manage your Model Context Protocol servers</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Total Servers", value: servers.length, icon: Server, color: "blue" },
            { label: "Running", value: servers.filter(s => s.runtimeStatus === "running").length, icon: Activity, color: "emerald" },
            { label: "Total Tools", value: servers.reduce((sum, s) => sum + s.toolCount, 0), icon: Zap, color: "purple" },
            { label: "Total Agents", value: servers.reduce((sum, s) => sum + s.agentCount, 0), icon: Shield, color: "cyan" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -2 }}
              className="relative group"
            >
              <div className="absolute -inset-px bg-gradient-to-r from-white/[0.08] to-white/[0.04] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/[0.08] rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`text-${stat.color}-400`} size={20} />
                  <div className={`text-3xl font-bold text-${stat.color}-400`}>{stat.value}</div>
                </div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* API Panel - Show when server selected */}
        {selectedServerId && apiMetadata && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-50" />
              <div className="relative bg-[#0f0f0f]/90 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                      <ExternalLink className="text-emerald-400" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white/90">Your Live API</h3>
                      <p className="text-sm text-white/50">Ready to use from any frontend or curl</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedServerId(null)}
                    className="text-white/40 hover:text-white/70 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* API Endpoint */}
                <div className="mb-6">
                  <label className="text-xs font-medium text-white/60 mb-2 block">API Endpoint</label>
                  <div className="relative group/endpoint">
                    <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-lg opacity-0 group-hover/endpoint:opacity-100 transition-opacity blur-sm" />
                    <div className="relative bg-[#1a1a1a] border border-white/[0.08] rounded-lg p-3 flex items-center justify-between">
                      <code className="text-sm text-emerald-400 font-mono flex-1 truncate">{apiMetadata.apiEndpoint}</code>
                      <button
                        onClick={() => handleCopy(apiMetadata.apiEndpoint, 'endpoint')}
                        className="ml-3 p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                      >
                        {copiedEndpoint ? (
                          <Check className="text-emerald-400" size={16} />
                        ) : (
                          <Copy className="text-white/40" size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Examples */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* cURL */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-white/60">cURL Example</label>
                      <button
                        onClick={() => handleCopy(apiMetadata.exampleCurl, 'curl')}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                      >
                        {copiedCurl ? (
                          <>
                            <Check size={12} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="bg-[#1a1a1a] border border-white/[0.08] rounded-lg p-4 overflow-x-auto">
                      <code className="text-xs text-white/70 font-mono">{apiMetadata.exampleCurl}</code>
                    </pre>
                  </div>

                  {/* Fetch */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-white/60">JavaScript Fetch</label>
                      <button
                        onClick={() => handleCopy(apiMetadata.exampleFetch, 'fetch')}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                      >
                        {copiedFetch ? (
                          <>
                            <Check size={12} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="bg-[#1a1a1a] border border-white/[0.08] rounded-lg p-4 overflow-x-auto">
                      <code className="text-xs text-white/70 font-mono">{apiMetadata.exampleFetch}</code>
                    </pre>
                  </div>
                </div>

                {/* Info */}
                <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg flex items-center justify-between">
                  <p className="text-xs text-blue-400/80">
                    💡 This API is live and ready to use. No manual deployment needed.
                  </p>
                  <button
                    onClick={() => setShowApiTester(true)}
                    className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-all flex items-center gap-2"
                  >
                    <TestTube size={14} />
                    Test API
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Servers Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : servers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-6">
              <Server className="text-white/40" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white/90 mb-2">No MCP Servers Yet</h3>
            <p className="text-white/50 mb-6">Create your first server to get started</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium hover:bg-emerald-500/20 transition-all inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Create Server
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server, index) => (
              <motion.div
                key={server.serverId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="relative group"
              >
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Card */}
                <div className="relative bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white/95 mb-1">{server.name}</h3>
                      <p className="text-sm text-white/50 line-clamp-2">{server.description}</p>
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                      server.runtimeStatus === "running"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : "bg-white/[0.03] border border-white/[0.08] text-white/40"
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        server.runtimeStatus === "running" ? "bg-emerald-400 animate-pulse" : "bg-white/40"
                      }`} />
                      {server.runtimeStatus}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Tools", value: server.toolCount, icon: Zap },
                      { label: "Agents", value: server.agentCount, icon: Shield },
                      { label: "Resources", value: server.resourceCount, icon: Activity },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <stat.icon className="text-white/40" size={14} />
                          <span className="text-xs text-white/40">{stat.label}</span>
                        </div>
                        <div className="text-lg font-semibold text-white/90">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenDashboard(server.serverId)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 text-emerald-400 font-medium hover:from-emerald-500/20 hover:to-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Play size={16} />
                      Open Dashboard
                    </button>
                    {server.runtimeStatus !== "running" && (
                      <button
                        onClick={() => handleStartRuntime(server.serverId)}
                        disabled={startingRuntime === server.serverId}
                        className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/70 font-medium hover:bg-white/[0.06] hover:border-white/[0.12] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {startingRuntime === server.serverId ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Activity size={16} />
                            Start
                          </>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleViewApi(server.serverId)}
                      className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/70 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
                      title="View API"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* API Tester Modal */}
      {showApiTester && apiMetadata && selectedServerId && (
        <ApiTester
          serverId={selectedServerId}
          apiEndpoint={apiMetadata.apiEndpoint}
          onClose={() => setShowApiTester(false)}
        />
      )}
    </div>
  );
}

export default function MCPDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    }>
      <MCPDashboardContent />
    </Suspense>
  );
}
