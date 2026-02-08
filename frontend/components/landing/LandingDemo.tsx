"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { Sparkles, Play, ArrowRight, Database, Zap, Shield, Code, CheckCircle } from "lucide-react";
import { COLORS, TYPOGRAPHY, EFFECTS } from "@/internal/ui-map";

// Static demo preview that doesn't capture scroll
export function LandingDemo() {
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  
  const prompts = [
    { text: "Create a user signup API with email validation", nodes: 4 },
    { text: "Build a login endpoint with JWT authentication", nodes: 5 },
    { text: "Create a CRUD API for blog posts", nodes: 6 },
  ];

  const workflowNodes = [
    { icon: Code, label: "API Endpoint", status: "complete" },
    { icon: Shield, label: "Validation", status: "complete" },
    { icon: Database, label: "Database", status: "complete" },
    { icon: Zap, label: "Response", status: "active" },
  ];

  return (
    <div id="landing-demo" className="w-full">
      <div className="bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] rounded-2xl overflow-hidden border border-white/[0.08]">
        {/* Demo Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-[#0f0f0f]/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Sparkles size={16} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">FlowForge Studio</h4>
                <p className="text-xs text-white/40">Interactive Preview</p>
              </div>
            </div>
            <Link 
              href="/workflow" 
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-lg transition-colors"
            >
              <Play size={14} />
              Try Full Demo
            </Link>
          </div>
        </div>

        {/* Demo Content */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Prompt Selection */}
            <div className="space-y-4">
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Select a prompt</p>
              <div className="space-y-2">
                {prompts.map((prompt, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setSelectedPrompt(i)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      selectedPrompt === i 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-white' 
                        : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:border-white/20'
                    }`}
                  >
                    <p className="text-sm">{prompt.text}</p>
                    <p className="text-xs text-white/40 mt-1">{prompt.nodes} workflow nodes</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Right: Workflow Preview */}
            <div className="space-y-4">
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Generated workflow</p>
              <div className="bg-[#0a0a0a] rounded-xl border border-white/[0.06] p-4">
                <div className="space-y-3">
                  {workflowNodes.map((node, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        node.status === 'complete' 
                          ? 'bg-emerald-500/20 border border-emerald-500/30' 
                          : 'bg-blue-500/20 border border-blue-500/30 animate-pulse'
                      }`}>
                        <node.icon size={14} className={node.status === 'complete' ? 'text-emerald-400' : 'text-blue-400'} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white/80">{node.label}</p>
                      </div>
                      {node.status === 'complete' && (
                        <CheckCircle size={14} className="text-emerald-400" />
                      )}
                    </motion.div>
                  ))}
                </div>
                
                {/* Connection lines */}
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Execution time</span>
                    <span className="text-emerald-400 font-mono">~1.2s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Row */}
          <div className="mt-6 pt-6 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-sm text-white/50">
              Want to build your own? Try the full interactive experience.
            </p>
            <Link 
              href="/workflow"
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
            >
              Open Studio
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
