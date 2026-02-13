'use client';

import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Server, Activity, AlertCircle, Sparkles } from 'lucide-react';
import AgentRunner from '@/components/AgentRunner';
import { listMCPServers, startRuntime } from '@/lib/mcpApi';

export default function AgentRunnerPage() {
  const searchParams = useSearchParams();
  const serverIdFromUrl = searchParams.get('serverId');
  
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(serverIdFromUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingRuntime, setStartingRuntime] = useState(false);

  const ownerId = process.env.NEXT_PUBLIC_OWNER_ID || 'user_default';

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (serverIdFromUrl && servers.length > 0) {
      const serverExists = servers.find(s => s.serverId === serverIdFromUrl);
      if (serverExists) {
        setSelectedServer(serverIdFromUrl);
      }
    }
  }, [serverIdFromUrl, servers]);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const data = await listMCPServers();
      setServers(data.servers || []);
      
      if (!serverIdFromUrl && data.servers && data.servers.length > 0) {
        setSelectedServer(data.servers[0].serverId);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRuntime = async (serverId: string) => {
    try {
      setStartingRuntime(true);
      await startRuntime(serverId);
      await fetchServers();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setStartingRuntime(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading servers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-400" size={24} />
            <h2 className="text-red-400 font-semibold text-lg">Error</h2>
          </div>
          <p className="text-red-400/80 mb-6">{error}</p>
          <button
            onClick={fetchServers}
            className="w-full bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl hover:bg-red-500/30 transition-all font-medium"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-6">
            <Server className="text-white/40" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white/90 mb-3">No Servers Available</h2>
          <p className="text-white/50 mb-6">
            Create an MCP server first to use the agent runner
          </p>
          <a
            href="/"
            className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-3 rounded-xl hover:bg-emerald-500/20 transition-all font-medium"
          >
            Go to Home
          </a>
        </motion.div>
      </div>
    );
  }

  const selectedServerData = servers.find(s => s.serverId === selectedServer);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.08),transparent_60%)]" />
      
      <div className="relative z-10 max-w-6xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="text-emerald-400" size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white/95">
                Agent Runner
              </h1>
              <p className="text-white/50 mt-1">
                Execute full agent workflows with dynamic forms - no JSON required
              </p>
            </div>
          </div>
        </motion.div>

        {/* Server Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 mb-6"
        >
          <label className="block text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
            <Server size={16} />
            Select MCP Server
          </label>
          <select
            value={selectedServer || ''}
            onChange={(e) => setSelectedServer(e.target.value)}
            className="w-full px-4 py-3 bg-[#0f0f0f]/60 border border-white/[0.08] rounded-xl text-white/90 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          >
            {servers.map((server) => (
              <option key={server.serverId} value={server.serverId}>
                {server.name} ({server.toolCount} tools) - {server.runtimeStatus}
              </option>
            ))}
          </select>

          {selectedServerData && selectedServerData.runtimeStatus !== 'running' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <Activity className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-yellow-400 text-sm mb-3">
                    Runtime is not running. Start it to execute agents.
                  </p>
                  <button
                    onClick={() => handleStartRuntime(selectedServerData.serverId)}
                    disabled={startingRuntime}
                    className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm flex items-center gap-2"
                  >
                    {startingRuntime ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-yellow-400/20 border-t-yellow-400 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Activity size={16} />
                        Start Runtime
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Agent Runner */}
        {selectedServer && selectedServerData?.runtimeStatus === 'running' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AgentRunner
              serverId={selectedServer}
              ownerId={ownerId}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
