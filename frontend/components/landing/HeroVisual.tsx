"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Workflow, Database, Shield, Zap, Cloud, ArrowRight, Globe, Code, Mail, CreditCard, User } from "lucide-react";

interface HeroVisualProps {
  className?: string;
}

// Define different workflow examples
const workflowExamples = [
  {
    id: "auth",
    title: "User Authentication",
    nodes: [
      { icon: Globe, label: "API Request", x: 50, y: 15 },
      { icon: Shield, label: "Validate Token", x: 25, y: 45 },
      { icon: Database, label: "Fetch User", x: 75, y: 45 },
      { icon: Zap, label: "Return Session", x: 50, y: 78 },
    ],
    connections: [
      { from: { x: 50, y: 22 }, to: { x: 30, y: 40 } },
      { from: { x: 50, y: 22 }, to: { x: 70, y: 40 } },
      { from: { x: 30, y: 52 }, to: { x: 50, y: 72 } },
      { from: { x: 70, y: 52 }, to: { x: 50, y: 72 } },
    ],
    color: "emerald",
  },
  {
    id: "payment",
    title: "Payment Processing",
    nodes: [
      { icon: CreditCard, label: "Payment", x: 50, y: 15 },
      { icon: Shield, label: "Verify Card", x: 25, y: 45 },
      { icon: Cloud, label: "Process", x: 75, y: 45 },
      { icon: Mail, label: "Send Receipt", x: 50, y: 78 },
    ],
    connections: [
      { from: { x: 50, y: 22 }, to: { x: 30, y: 40 } },
      { from: { x: 50, y: 22 }, to: { x: 70, y: 40 } },
      { from: { x: 30, y: 52 }, to: { x: 50, y: 72 } },
      { from: { x: 70, y: 52 }, to: { x: 50, y: 72 } },
    ],
    color: "blue",
  },
  {
    id: "data",
    title: "Data Pipeline",
    nodes: [
      { icon: Code, label: "Ingest", x: 50, y: 15 },
      { icon: Zap, label: "Transform", x: 25, y: 45 },
      { icon: Shield, label: "Validate", x: 75, y: 45 },
      { icon: Database, label: "Store", x: 50, y: 78 },
    ],
    connections: [
      { from: { x: 50, y: 22 }, to: { x: 30, y: 40 } },
      { from: { x: 50, y: 22 }, to: { x: 70, y: 40 } },
      { from: { x: 30, y: 52 }, to: { x: 50, y: 72 } },
      { from: { x: 70, y: 52 }, to: { x: 50, y: 72 } },
    ],
    color: "purple",
  },
];

const colorMap = {
  emerald: { bg: "bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-400", glow: "rgba(16,185,129,0.5)" },
  blue: { bg: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-400", glow: "rgba(59,130,246,0.5)" },
  purple: { bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-400", glow: "rgba(139,92,246,0.5)" },
};

// Workflow node component
function WorkflowNode({ 
  icon: Icon, 
  label, 
  x,
  y,
  color,
  delay
}: { 
  icon: React.ElementType;
  label: string; 
  x: number;
  y: number;
  color: keyof typeof colorMap;
  delay: number;
}) {
  const colors = colorMap[color];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4, delay }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0f0f0f]/90 border ${colors.border} backdrop-blur-sm shadow-lg`}>
        <div className={`w-6 h-6 rounded ${colors.bg} border ${colors.border} flex items-center justify-center`}>
          <Icon size={12} className={colors.text} />
        </div>
        <span className="text-xs font-medium text-white/80">{label}</span>
      </div>
    </motion.div>
  );
}

// Connection line
function ConnectionLine({ from, to, color, delay }: { 
  from: { x: number; y: number }; 
  to: { x: number; y: number }; 
  color: keyof typeof colorMap;
  delay: number;
}) {
  const colors = colorMap[color];
  return (
    <motion.line
      x1={`${from.x}%`}
      y1={`${from.y}%`}
      x2={`${to.x}%`}
      y2={`${to.y}%`}
      stroke={colors.glow}
      strokeWidth="1"
      strokeDasharray="4 4"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.5 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, delay }}
    />
  );
}

export function HeroVisual({ className = "" }: HeroVisualProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentWorkflow = workflowExamples[currentIndex];
  const colors = colorMap[currentWorkflow.color as keyof typeof colorMap];

  // Auto-cycle through examples
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % workflowExamples.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Click handler to cycle
  const handleClick = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % workflowExamples.length);
  }, []);

  return (
    <div className={`relative w-full max-w-lg mx-auto ${className}`}>
      {/* Ambient glow behind - color changes with workflow */}
      <motion.div 
        className="absolute inset-0 rounded-3xl blur-3xl"
        animate={{
          background: `linear-gradient(135deg, ${colors.glow}15 0%, transparent 50%, ${colorMap.blue.glow}10 100%)`
        }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Main container - clickable */}
      <div 
        className="relative bg-[#0a0a0a]/80 border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl cursor-pointer group"
        onClick={handleClick}
      >
        {/* Terminal-style header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <AnimatePresence mode="wait">
              <motion.span 
                key={currentWorkflow.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[10px] font-mono text-white/30 ml-2"
              >
                {currentWorkflow.title.toLowerCase().replace(" ", "_")}.flow
              </motion.span>
            </AnimatePresence>
          </div>
          {/* Click indicator */}
          <div className="text-[9px] text-white/20 uppercase tracking-wider group-hover:text-white/40 transition-colors">
            Click to cycle
          </div>
        </div>

        {/* Animated workflow preview */}
        <div className="relative h-[260px] p-6">
          {/* Connection lines SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.glow} />
                <stop offset="100%" stopColor={colorMap.blue.glow} />
              </linearGradient>
            </defs>
            <AnimatePresence mode="wait">
              {currentWorkflow.connections.map((conn, i) => (
                <ConnectionLine 
                  key={`${currentWorkflow.id}-conn-${i}`}
                  from={conn.from} 
                  to={conn.to} 
                  color={currentWorkflow.color as keyof typeof colorMap}
                  delay={i * 0.1}
                />
              ))}
            </AnimatePresence>
          </svg>

          {/* Workflow nodes */}
          <AnimatePresence mode="wait">
            {currentWorkflow.nodes.map((node, i) => (
              <WorkflowNode 
                key={`${currentWorkflow.id}-node-${i}`}
                icon={node.icon}
                label={node.label}
                x={node.x}
                y={node.y}
                color={currentWorkflow.color as keyof typeof colorMap}
                delay={i * 0.1}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom status bar with pagination dots */}
        <div className="px-4 py-2.5 border-t border-white/10 bg-[#0f0f0f]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')} animate-pulse`} />
            <span className="text-[10px] font-mono text-white/40">{currentWorkflow.nodes.length} nodes • ready</span>
          </div>
          
          {/* Pagination dots */}
          <div className="flex items-center gap-1.5">
            {workflowExamples.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex 
                    ? `${colors.text.replace('text-', 'bg-')} w-4` 
                    : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <motion.div
        className="absolute -right-4 top-1/4 w-20 h-20 rounded-full blur-2xl"
        animate={{ 
          scale: [1, 1.2, 1], 
          opacity: [0.2, 0.4, 0.2],
          backgroundColor: colors.glow
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </div>
  );
}
