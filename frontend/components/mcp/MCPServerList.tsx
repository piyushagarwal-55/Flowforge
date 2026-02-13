'use client';

import { motion } from 'framer-motion';
import { MCPServer } from '@/lib/mcpStore';
import { useRouter } from 'next/navigation';
import { Play, Server, Zap, Shield } from 'lucide-react';

interface MCPServerListProps {
  servers: MCPServer[];
  selectedServerId: string | null;
  onSelectServer: (serverId: string) => void;
}

export default function MCPServerList({ servers, selectedServerId, onSelectServer }: MCPServerListProps) {
  const router = useRouter();

  const handleOpenDashboard = (e: React.MouseEvent, serverId: string) => {
    e.stopPropagation();
    router.push(`/mcp/workflow/${serverId}`);
  };

  if (servers.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
          <Server size={20} className="text-emerald-400" />
          MCP Servers
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
            <Server className="text-white/40" size={24} />
          </div>
          <p className="text-sm text-white/50">No servers yet. Create one from chat!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
        <Server size={20} className="text-emerald-400" />
        MCP Servers
      </h3>
      <div className="space-y-3">
        {servers.map((server, index) => (
          <motion.div
            key={server.serverId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ x: 2 }}
            className="relative group"
          >
            {/* Glow effect on hover */}
            <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
            
            {/* Card */}
            <div
              className={`relative cursor-pointer transition-all rounded-xl p-4 ${
                selectedServerId === server.serverId
                  ? 'bg-emerald-500/10 border-2 border-emerald-500/30'
                  : 'bg-[#0f0f0f]/60 backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/20'
              }`}
              onClick={() => onSelectServer(server.serverId)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-white/90 truncate">{server.name}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Zap size={12} />
                      {server.toolCount} tools
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield size={12} />
                      {server.agentCount} agents
                    </span>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className={`px-2 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 ${
                  server.runtimeStatus === 'running'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-white/[0.03] border border-white/[0.08] text-white/40'
                }`}>
                  <div className={`w-1 h-1 rounded-full ${
                    server.runtimeStatus === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'
                  }`} />
                  {server.runtimeStatus}
                </div>
              </div>
              
              {/* Open Dashboard Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => handleOpenDashboard(e, server.serverId)}
                className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:from-emerald-500/20 hover:to-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Play size={12} />
                Open Dashboard
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
