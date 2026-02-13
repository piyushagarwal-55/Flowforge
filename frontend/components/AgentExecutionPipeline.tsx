'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { CheckCircle2, XCircle, Loader2, Circle, ChevronDown, ChevronUp } from 'lucide-react';

interface StepResult {
  step: number;
  toolId: string;
  toolName: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  output?: any;
  error?: string;
  duration?: number;
}

interface AgentExecutionPipelineProps {
  executionId: string;
  executionOrder: string[];
  tools: Array<{ toolId: string; name: string }>;
  onComplete?: (results: StepResult[]) => void;
}

export default function AgentExecutionPipeline({
  executionId,
  executionOrder,
  tools,
  onComplete,
}: AgentExecutionPipelineProps) {
  const [steps, setSteps] = useState<StepResult[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    const initialSteps = executionOrder.map((toolId, index) => {
      const tool = tools.find(t => t.toolId === toolId);
      return {
        step: index + 1,
        toolId,
        toolName: tool?.name || toolId,
        status: 'pending' as const,
      };
    });
    setSteps(initialSteps);

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const newSocket = io(socketUrl);

    newSocket.on('connect', () => {
      console.log('Socket connected for execution:', executionId);
      newSocket.emit('join-room', executionId);
    });

    newSocket.on('agent:step:start', (data: any) => {
      setSteps(prev =>
        prev.map(step =>
          step.step === data.step ? { ...step, status: 'running' } : step
        )
      );
    });

    newSocket.on('agent:step:complete', (data: any) => {
      setSteps(prev => {
        const updated = prev.map(step =>
          step.step === data.step
            ? {
                ...step,
                status: data.status,
                output: data.output,
                error: data.error,
                duration: data.duration,
              }
            : step
        );

        const allComplete = updated.every(s => s.status === 'success' || s.status === 'failed');
        if (allComplete && onComplete) {
          onComplete(updated);
        }

        return updated;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [executionId, executionOrder, tools, onComplete]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Circle className="text-white/30" size={20} />;
      case 'running':
        return <Loader2 className="text-emerald-400 animate-spin" size={20} />;
      case 'success':
        return <CheckCircle2 className="text-emerald-400" size={20} />;
      case 'failed':
        return <XCircle className="text-red-400" size={20} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-white/[0.08] bg-[#0f0f0f]/40';
      case 'running':
        return 'border-emerald-500/30 bg-emerald-500/5';
      case 'success':
        return 'border-emerald-500/30 bg-emerald-500/10';
      case 'failed':
        return 'border-red-500/30 bg-red-500/10';
      default:
        return 'border-white/[0.08] bg-[#0f0f0f]/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white/95">Execution Pipeline</h3>
        <div className="text-sm text-white/50">
          {steps.filter(s => s.status === 'success').length} / {steps.length} completed
        </div>
      </div>

      {/* Timeline */}
      <div className="relative space-y-4">
        {/* Vertical line */}
        <div className="absolute left-[18px] top-8 bottom-8 w-px bg-gradient-to-b from-white/[0.08] via-emerald-500/20 to-white/[0.08]" />

        {steps.map((step, index) => (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {/* Glow effect for running step */}
            {step.status === 'running' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute -inset-2 bg-emerald-500/10 rounded-2xl blur-xl"
              />
            )}

            {/* Step Card */}
            <div
              className={`relative backdrop-blur-xl border-2 rounded-xl p-5 transition-all ${getStatusColor(
                step.status
              )}`}
            >
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className="relative flex-shrink-0 mt-0.5">
                  {step.status === 'running' && (
                    <motion.div
                      className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <div className="relative z-10">
                    {getStatusIcon(step.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-white/90">
                        Step {step.step}: {step.toolName}
                      </div>
                      <div className="text-xs text-white/40 mt-0.5 font-mono">{step.toolId}</div>
                    </div>
                    {step.duration && (
                      <div className="text-xs text-white/50 font-mono bg-white/[0.03] px-2 py-1 rounded">
                        {step.duration}ms
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      step.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : step.status === 'failed'
                        ? 'bg-red-500/10 text-red-400'
                        : step.status === 'running'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-white/[0.03] text-white/40'
                    }`}>
                      {step.status}
                    </span>
                  </div>

                  {/* Error Message */}
                  {step.error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                    >
                      <div className="flex items-start gap-2">
                        <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                        <div className="text-sm text-red-400">{step.error}</div>
                      </div>
                    </motion.div>
                  )}

                  {/* Output (Expandable) */}
                  {step.output && step.status === 'success' && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedStep(expandedStep === step.step ? null : step.step)}
                        className="flex items-center gap-2 text-xs text-white/60 hover:text-white/90 transition-colors"
                      >
                        {expandedStep === step.step ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        View Output
                      </button>
                      <AnimatePresence>
                        {expandedStep === step.step && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 p-3 bg-[#0f0f0f]/60 border border-white/[0.08] rounded-lg overflow-hidden"
                          >
                            <pre className="text-xs text-white/70 overflow-x-auto">
                              {JSON.stringify(step.output, null, 2)}
                            </pre>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex justify-center py-2">
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className="w-px h-6 bg-gradient-to-b from-emerald-500/20 to-white/[0.08]"
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
