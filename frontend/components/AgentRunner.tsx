'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { Play, Sparkles, CheckCircle2, TrendingUp, Database, Shield, Zap } from 'lucide-react';
import SimpleInputForm from './SimpleInputForm';
import AgentExecutionPipeline from './AgentExecutionPipeline';

interface Tool {
  toolId: string;
  name: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
}

interface AgentRunnerProps {
  serverId: string;
  agentId?: string;
  ownerId: string;
}

export default function AgentRunner({ serverId, agentId, ownerId }: AgentRunnerProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [executionOrder, setExecutionOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [inputData, setInputData] = useState<Record<string, any> | null>(null);
  const [results, setResults] = useState<any>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    fetchTools();
  }, [serverId]);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${apiUrl}/mcp/servers/${serverId}/tools?ownerId=${ownerId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tools');
      }

      const data = await response.json();
      setTools(data.tools);
      setExecutionOrder(data.executionOrder || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputSubmit = (values: Record<string, any>) => {
    setInputData(values);
  };

  const handleRunAgent = async () => {
    if (!inputData) {
      return;
    }

    try {
      setIsRunning(true);
      setError(null);
      const newExecutionId = `agent-run-${Date.now()}`;
      setExecutionId(newExecutionId);

      const response = await fetch(`${apiUrl}/mcp/servers/${serverId}/run-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          input: inputData,
          ownerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run agent');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError((err as Error).message);
      setIsRunning(false);
    }
  };

  const handleExecutionComplete = (stepResults: any[]) => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setInputData(null);
    setExecutionId(null);
    setResults(null);
    setIsRunning(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error && !isRunning) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-xl">
        <p className="text-red-400 mb-4">Error: {error}</p>
        <button
          onClick={fetchTools}
          className="text-sm text-red-400 hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl backdrop-blur-xl">
        <p className="text-yellow-400">No tools available for this server</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <AnimatePresence mode="wait">
        {!executionId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8"
          >
            <SimpleInputForm
              onSubmit={handleInputSubmit}
              isSubmitting={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run Agent Button */}
      <AnimatePresence>
        {inputData && !executionId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-60" />
            
            <div className="relative bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white/95 mb-2">Ready to Execute</h3>
                <p className="text-white/50">Click below to run your agent workflow</p>
              </div>
              
              <motion.button
                onClick={handleRunAgent}
                disabled={isRunning}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-5 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-lg font-bold hover:from-emerald-600 hover:to-blue-600 disabled:from-white/10 disabled:to-white/10 disabled:cursor-not-allowed transition-all shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] flex items-center justify-center gap-3"
              >
                <Play size={24} fill="white" />
                Run Agent
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Execution Pipeline */}
      <AnimatePresence>
        {executionId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8"
          >
            <AgentExecutionPipeline
              executionId={executionId}
              executionOrder={executionOrder}
              tools={tools}
              onComplete={handleExecutionComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Results */}
      <AnimatePresence>
        {results && !isRunning && results.summary.failedCount === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Success Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden"
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-emerald-500/20 animate-pulse" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.2),transparent_70%)]" />
              
              <div className="relative bg-[#0f0f0f]/80 backdrop-blur-xl border-2 border-emerald-500/30 rounded-2xl p-8">
                <div className="flex items-center gap-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="flex-shrink-0"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center">
                      <CheckCircle2 className="text-emerald-400" size={40} />
                    </div>
                  </motion.div>
                  <div className="flex-1">
                    <motion.h3
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-3xl font-bold text-emerald-400 mb-2"
                    >
                      🎉 MCP Agent Executed Successfully!
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-white/70"
                    >
                      All {results.summary.totalSteps} steps completed in {results.summary.duration}ms. Your MCP server is working perfectly!
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Steps", value: results.summary.totalSteps, icon: TrendingUp, color: "blue" },
                { label: "Successful", value: results.summary.successCount, icon: CheckCircle2, color: "emerald" },
                { label: "Failed", value: results.summary.failedCount, icon: Shield, color: "red" },
                { label: "Duration", value: `${results.summary.duration}ms`, icon: Zap, color: "purple" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="relative group"
                >
                  <div className="absolute -inset-px bg-gradient-to-r from-white/[0.08] to-white/[0.04] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/[0.08] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <stat.icon className={`text-${stat.color}-400`} size={20} />
                      <div className={`text-3xl font-bold text-${stat.color}-400`}>{stat.value}</div>
                    </div>
                    <div className="text-sm text-white/60">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* User Data Display */}
            {inputData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8"
              >
                <h4 className="text-lg font-semibold text-white/95 mb-6 flex items-center gap-2">
                  <Database size={20} className="text-emerald-400" />
                  User Created Successfully
                </h4>
                <div className="space-y-3">
                  {[
                    { label: "Email", value: inputData.email, mono: true },
                    { label: "Name", value: inputData.name || 'N/A', mono: false },
                    { label: "Password", value: "✓ Hashed & Secured", mono: false, success: true },
                    { label: "Database", value: "✓ Saved to MongoDB", mono: false, success: true },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + i * 0.1 }}
                      className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0"
                    >
                      <span className="text-sm font-medium text-white/60">{item.label}:</span>
                      <span className={`text-sm ${item.success ? 'text-emerald-400 font-semibold' : 'text-white/90'} ${item.mono ? 'font-mono' : ''}`}>
                        {item.value}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Reset Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              onClick={handleReset}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 text-emerald-400 font-semibold hover:from-emerald-500/20 hover:to-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              Create Another User
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
