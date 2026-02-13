'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useRef } from 'react';
import { X, Terminal, CheckCircle2, XCircle, AlertCircle, Zap, Clock } from 'lucide-react';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'warning' | 'execution';
  message: string;
  details?: any;
}

interface MCPLogsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
}

export default function MCPLogsPanel({ isOpen, onClose, logs }: MCPLogsPanelProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={14} className="text-emerald-400" />;
      case 'error':
        return <XCircle size={14} className="text-red-400" />;
      case 'warning':
        return <AlertCircle size={14} className="text-yellow-400" />;
      case 'execution':
        return <Zap size={14} className="text-blue-400" />;
      default:
        return <Terminal size={14} className="text-white/60" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-emerald-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'execution':
        return 'text-blue-400';
      default:
        return 'text-white/70';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl z-50 flex flex-col"
          >
            <div className="h-full bg-[#0a0a0a] border-l border-white/[0.08] flex flex-col shadow-[-8px_0_32px_rgba(0,0,0,0.6)]">
              {/* Header */}
              <div className="flex-shrink-0 px-6 py-5 border-b border-white/[0.06] bg-[#0f0f0f]/80 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/[0.09] to-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center border border-white/[0.06]">
                      <Terminal size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white/95 tracking-tight">
                        Execution Logs
                      </h2>
                      <p className="text-xs text-white/45 mt-0.5">
                        {logs.length} log {logs.length === 1 ? 'entry' : 'entries'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/[0.06] rounded-lg transition-all duration-200 active:scale-95"
                  >
                    <X size={18} className="text-white/60" />
                  </button>
                </div>
              </div>

              {/* Logs Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                      <Terminal size={28} className="text-white/30" />
                    </div>
                    <p className="text-[15px] text-white/60 font-medium mb-2">No logs yet</p>
                    <p className="text-[13px] text-white/40">
                      Run the workflow or send a chat message to see logs
                    </p>
                  </div>
                ) : (
                  <>
                    {logs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="bg-[#0f0f0f]/60 backdrop-blur-sm border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.1] transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getLogIcon(log.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                                <Clock size={10} />
                                {formatTime(log.timestamp)}
                              </span>
                              <span className={`text-[10px] font-semibold uppercase tracking-wider ${getLogColor(log.type)}`}>
                                {log.type}
                              </span>
                            </div>
                            <p className={`text-[13px] ${getLogColor(log.type)} leading-relaxed`}>
                              {log.message}
                            </p>
                            {log.details && (
                              <div className="mt-2 p-3 bg-black/40 border border-white/[0.06] rounded-lg">
                                <pre className="text-[11px] text-white/50 font-mono overflow-x-auto">
                                  {typeof log.details === 'string' 
                                    ? log.details 
                                    : JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={logsEndRef} />
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-6 py-4 border-t border-white/[0.06] bg-[#0f0f0f]/80 backdrop-blur-xl">
                <div className="flex items-center justify-between text-[11px] text-white/40">
                  <span>Real-time execution monitoring</span>
                  <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
