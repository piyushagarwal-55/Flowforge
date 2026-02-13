'use client';

import { MCPEvent } from '@/lib/mcpStore';

interface ActivityFeedProps {
  events: MCPEvent[];
}

export default function ActivityFeed({ events }: ActivityFeedProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'runtime_started':
        return '▶️';
      case 'runtime_stopped':
        return '⏹️';
      case 'tool_invoked':
        return '🔧';
      case 'tool_completed':
        return '✅';
      case 'permission_denied':
        return '🚫';
      case 'agent_attached':
        return '🔗';
      case 'agent_detached':
        return '🔓';
      default:
        return '📝';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="activity-feed p-4">
      <h3 className="text-lg font-semibold mb-4">Activity Feed</h3>
      
      {events.length === 0 ? (
        <p className="text-gray-500 text-sm">No activity yet</p>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {events.map((event) => (
            <div key={event.id} className="p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-2">
                <span className="text-xl flex-shrink-0">{getEventIcon(event.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{formatEventType(event.type)}</div>
                  
                  {event.toolId && (
                    <div className="text-xs text-gray-600 mt-1">
                      Tool: <span className="font-mono">{event.toolId}</span>
                    </div>
                  )}
                  
                  {event.agentId && (
                    <div className="text-xs text-gray-600">
                      Agent: <span className="font-mono text-xs">{event.agentId.slice(0, 20)}...</span>
                    </div>
                  )}
                  
                  {event.duration !== undefined && (
                    <div className="text-xs text-gray-600">
                      Duration: <span className="font-medium">{event.duration}ms</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-1">
                    {formatTimestamp(event.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
