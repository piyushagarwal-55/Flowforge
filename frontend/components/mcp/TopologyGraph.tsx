'use client';

import { Topology } from '@/lib/mcpStore';

interface TopologyGraphProps {
  topology: Topology | null;
}

export default function TopologyGraph({ topology }: TopologyGraphProps) {
  if (!topology) {
    return (
      <div className="topology-graph border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Topology</h3>
        <p className="text-gray-500 text-sm">No topology data available</p>
      </div>
    );
  }

  const servers = topology.nodes.filter((n) => n.type === 'server');
  const agents = topology.nodes.filter((n) => n.type === 'agent');
  const tools = topology.nodes.filter((n) => n.type === 'tool');

  return (
    <div className="topology-graph border border-gray-300 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Topology</h3>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Agents Column */}
        <div>
          <h4 className="font-medium text-sm mb-2 text-gray-700">
            Agents ({agents.length})
          </h4>
          <div className="space-y-2">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="p-2 bg-blue-100 border border-blue-300 rounded text-sm"
              >
                <div className="font-medium text-blue-900">{agent.name}</div>
                {agent.metadata?.allowedTools && (
                  <div className="text-xs text-blue-700 mt-1">
                    {agent.metadata.allowedTools.length} tools
                  </div>
                )}
              </div>
            ))}
            {agents.length === 0 && (
              <div className="text-xs text-gray-500">No agents</div>
            )}
          </div>
        </div>

        {/* Servers Column */}
        <div>
          <h4 className="font-medium text-sm mb-2 text-gray-700">
            Servers ({servers.length})
          </h4>
          <div className="space-y-2">
            {servers.map((server) => (
              <div
                key={server.id}
                className="p-2 bg-green-100 border border-green-300 rounded text-sm"
              >
                <div className="font-medium text-green-900">{server.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-1.5 py-0.5 text-xs rounded ${
                      server.status === 'running'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {server.status}
                  </span>
                </div>
              </div>
            ))}
            {servers.length === 0 && (
              <div className="text-xs text-gray-500">No servers</div>
            )}
          </div>
        </div>

        {/* Tools Column */}
        <div>
          <h4 className="font-medium text-sm mb-2 text-gray-700">
            Tools ({tools.length})
          </h4>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="p-1.5 bg-purple-100 border border-purple-300 rounded text-xs"
              >
                <div className="font-medium text-purple-900">{tool.name}</div>
              </div>
            ))}
            {tools.length === 0 && (
              <div className="text-xs text-gray-500">No tools</div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{topology.stats.serverCount}</div>
            <div className="text-xs text-gray-600">Servers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{topology.stats.agentCount}</div>
            <div className="text-xs text-gray-600">Agents</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{topology.stats.toolCount}</div>
            <div className="text-xs text-gray-600">Tools</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{topology.stats.edgeCount}</div>
            <div className="text-xs text-gray-600">Connections</div>
          </div>
        </div>
      </div>
    </div>
  );
}
