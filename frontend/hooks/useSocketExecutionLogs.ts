import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ExecutionLog {
  executionId: string;
  stepIndex?: number;
  stepType?: string;
  stepName?: string;
  type?: 'step_start' | 'step_complete' | 'step_error' | 'workflow_complete';
  phase?: 'step_started' | 'info' | 'data' | 'success' | 'step_finished' | 'error' | 'execution_failed' | 'execution_finished';
  title?: string;
  message?: string;
  data?: any;
  error?: string;
  timestamp: number;
  output?: any;
  input?: any;
  durationMs?: number;
}

export function useSocketExecutionLogs(executionId: string | null) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!executionId) {
      setLogs([]);
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

    // Create Socket.io connection
    const socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket.io connected', { socketId: socket.id });
      setIsConnected(true);

      // Join execution room
      socket.emit('join-execution', executionId);
    });

    socket.on('joined-execution', (data: { executionId: string }) => {
      console.log('📡 Joined execution room', data);
    });

    socket.on('execution-log', (logData: any) => {
      console.log('📨 Received execution log', logData);

      // Transform backend log format to frontend format
      const log: ExecutionLog = {
        executionId,
        stepIndex: logData.stepIndex,
        stepType: logData.stepType,
        stepName: logData.stepName,
        type: logData.type,
        // Map type to phase for UI compatibility
        phase: mapTypeToPhase(logData.type),
        title: generateTitle(logData),
        message: generateMessage(logData),
        data: logData.data,
        error: logData.error,
        timestamp: Date.now(),
        output: logData.output,
        input: logData.input,
        durationMs: logData.durationMs,
      };

      console.log('✅ Transformed log', log);
      setLogs((prev) => {
        const newLogs = [...prev, log];
        console.log('📊 Total logs now:', newLogs.length);
        return newLogs;
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.io disconnected', { reason });
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket.io error', error);
    });

    // Cleanup on unmount or executionId change
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-execution', executionId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [executionId]);

  return { logs, isConnected };
}

// Helper functions
function mapTypeToPhase(type: string): ExecutionLog['phase'] {
  switch (type) {
    case 'step_start':
      return 'step_started';
    case 'step_complete':
      return 'step_finished';
    case 'step_error':
      return 'error';
    case 'workflow_complete':
      return 'execution_finished';
    default:
      return 'info';
  }
}

function generateTitle(logData: any): string {
  if (logData.type === 'step_start') {
    return `Step ${(logData.stepIndex ?? 0) + 1}: ${logData.stepType || 'Unknown'}`;
  }
  if (logData.type === 'step_complete') {
    return `Step ${(logData.stepIndex ?? 0) + 1} completed`;
  }
  if (logData.type === 'step_error') {
    return `Step ${(logData.stepIndex ?? 0) + 1} failed`;
  }
  if (logData.type === 'workflow_complete') {
    return 'Workflow completed';
  }
  return logData.stepType || 'Log';
}

function generateMessage(logData: any): string {
  if (logData.error) {
    return logData.error;
  }
  if (logData.type === 'step_start') {
    return `Executing ${logData.stepType || 'step'}...`;
  }
  if (logData.type === 'step_complete') {
    return `Completed in ${logData.durationMs || 0}ms`;
  }
  if (logData.type === 'workflow_complete') {
    return `All steps completed successfully`;
  }
  return '';
}
