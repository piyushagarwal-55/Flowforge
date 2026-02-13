'use client';

import { useState } from 'react';
import { startRuntime, stopRuntime } from '@/lib/mcpApi';

interface RuntimeControlsProps {
  serverId: string;
  runtimeStatus: string;
  onRuntimeChange: () => void;
}

export default function RuntimeControls({ serverId, runtimeStatus, onRuntimeChange }: RuntimeControlsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartRuntime = async () => {
    setLoading(true);
    setError(null);
    try {
      await startRuntime(serverId);
      onRuntimeChange();
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to start runtime:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStopRuntime = async () => {
    setLoading(true);
    setError(null);
    try {
      await stopRuntime(serverId);
      onRuntimeChange();
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to stop runtime:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="runtime-controls mb-4 p-4 border border-gray-300 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Runtime Control</h3>
      
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleStartRuntime}
          disabled={loading || runtimeStatus === 'running'}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Starting...' : 'Start Runtime'}
        </button>
        <button
          onClick={handleStopRuntime}
          disabled={loading || runtimeStatus !== 'running'}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Stopping...' : 'Stop Runtime'}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          Error: {error}
        </div>
      )}

      <div className="text-sm text-gray-600">
        Status:{' '}
        <span
          className={`font-medium ${
            runtimeStatus === 'running'
              ? 'text-green-600'
              : runtimeStatus === 'stopped'
              ? 'text-red-600'
              : 'text-gray-600'
          }`}
        >
          {runtimeStatus}
        </span>
      </div>
    </div>
  );
}
