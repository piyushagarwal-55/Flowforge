'use client';

import { MCPAgent } from '@/lib/mcpStore';

interface AgentListProps {
  agents: MCPAgent[];
}

export default function AgentList({ agents }: AgentListProps) {
  return (
    <div className="agent-list mt-6 p-4">
      <h3 className="text-lg font-semibold mb-4">Agents</h3>
      
      {agents.length === 0 ? (
        <p className="text-gray-500 text-sm">No agents yet</p>
      ) : (
        <div className="space-y-2">
          {agents.map((agent) => (
            <div key={agent.agentId} className="p-3 border border-gray-300 rounded-lg bg-white">
              <div className="font-medium text-sm">{agent.name}</div>
              <div className="text-xs text-gray-600 mt-1">{agent.description}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                  {agent.allowedTools.length} tools
                </span>
                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                  {agent.attachedServerCount} servers
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
