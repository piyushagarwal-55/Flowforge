'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import MCPWorkflowDashboard from '@/components/mcp/MCPWorkflowDashboard';
import { getMCPServer, startRuntime } from '@/lib/mcpApi';

export default function MCPWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.serverId as string;
  const [serverData, setServerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ownerId = process.env.NEXT_PUBLIC_OWNER_ID || 'user_default';

  useEffect(() => {
    if (serverId) {
      initializeServer();
    }
  }, [serverId]);

  const initializeServer = async () => {
    try {
      setLoading(true);
      
      // Fetch server details
      const server = await getMCPServer(serverId);
      setServerData(server);

      // Start runtime if not running
      if (server.runtimeStatus !== 'running') {
        await startRuntime(serverId);
        // Refresh server data
        const updatedServer = await getMCPServer(serverId);
        setServerData(updatedServer);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-white/60">Loading workflow dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !serverData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#0f0f0f]/90 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-400" size={24} />
            <h2 className="text-xl font-bold text-white/90">Error Loading Server</h2>
          </div>
          <p className="text-white/60 mb-6">{error || 'Server not found'}</p>
          <button
            onClick={() => router.push('/mcp')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 text-emerald-400 font-semibold hover:from-emerald-500/20 hover:to-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to MCP Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <MCPWorkflowDashboard
      serverId={serverId}
      serverName={serverData.name}
      agentId={serverData.agentId}
      ownerId={ownerId}
    />
  );
}
