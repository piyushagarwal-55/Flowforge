"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  Workflow,
  MessageSquare,
  Zap,
  BookOpen,
  Terminal,
  Layers,
  Shield,
  Code2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

// Feature data with more detailed descriptions
const FEATURES = [
  {
    icon: Workflow,
    title: "Generative Workflows",
    subtitle: "Natural Language → Production API",
    description: "Describe what you want in plain English. Watch as FlowForge transforms your words into fully-functional, documented API endpoints in seconds.",
    visual: "workflow",
  },
  {
    icon: Layers,
    title: "Visual Node Builder",
    subtitle: "See Your Logic Flow",
    description: "Every workflow becomes an interactive node graph. Drag, connect, and modify—no more hidden black-box logic.",
    visual: "nodes",
  },
  {
    icon: Zap,
    title: "Real-time Execution",
    subtitle: "Watch It Run",
    description: "Stream execution logs as your workflow runs. See exactly what happens at each step with full debugging visibility.",
    visual: "execution",
  },
  {
    icon: MessageSquare,
    title: "Conversational Mutation",
    subtitle: "Iterate Through Chat",
    description: "Made a mistake? Need a tweak? Just tell FlowForge what to change in natural language. Your workflow updates instantly.",
    visual: "chat",
  },
];

// Animated visual for each feature
function FeatureVisual({ type, isActive }: { type: string; isActive: boolean }) {
  const baseClasses = "absolute inset-0 flex items-center justify-center";
  
  return (
    <div className={`${baseClasses} transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
      {type === "workflow" && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Animated code typing effect */}
          <motion.div 
            className="font-mono text-sm leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: isActive ? 1 : 0 }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: isActive ? "100%" : 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="overflow-hidden whitespace-nowrap"
            >
              <span className="text-blue-400">describe</span>
              <span className="text-white/60">(</span>
              <span className="text-emerald-400">"Create user auth API"</span>
              <span className="text-white/60">)</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="mt-4 text-white/40"
            >
              ↓
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="mt-4 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400/80">Generating workflow...</span>
            </motion.div>
          </motion.div>
        </div>
      )}
      
      {type === "nodes" && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Animated node graph */}
          <svg viewBox="0 0 200 120" className="w-full max-w-[280px]">
            {/* Connections */}
            <motion.path
              d="M 40 60 Q 80 30 120 60"
              stroke="rgba(16, 185, 129, 0.4)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: isActive ? 1 : 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
            <motion.path
              d="M 120 60 L 160 40"
              stroke="rgba(16, 185, 129, 0.4)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: isActive ? 1 : 0 }}
              transition={{ duration: 0.5, delay: 1.5 }}
            />
            <motion.path
              d="M 120 60 L 160 80"
              stroke="rgba(16, 185, 129, 0.4)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: isActive ? 1 : 0 }}
              transition={{ duration: 0.5, delay: 1.8 }}
            />
            
            {/* Nodes */}
            <motion.circle
              cx="40" cy="60" r="16"
              fill="rgba(16, 185, 129, 0.15)"
              stroke="rgba(16, 185, 129, 0.5)"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: isActive ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
            <motion.circle
              cx="120" cy="60" r="20"
              fill="rgba(16, 185, 129, 0.2)"
              stroke="rgba(16, 185, 129, 0.6)"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: isActive ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 1 }}
            />
            <motion.circle
              cx="160" cy="40" r="12"
              fill="rgba(59, 130, 246, 0.15)"
              stroke="rgba(59, 130, 246, 0.5)"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: isActive ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 1.8 }}
            />
            <motion.circle
              cx="160" cy="80" r="12"
              fill="rgba(168, 85, 247, 0.15)"
              stroke="rgba(168, 85, 247, 0.5)"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: isActive ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 2 }}
            />
          </svg>
        </div>
      )}
      
      {type === "execution" && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Streaming log lines */}
          <div className="font-mono text-xs space-y-2 w-full px-4">
            {[
              { color: "text-white/40", text: "[00:00:01] Initializing..." },
              { color: "text-emerald-400", text: "[00:00:02] ✓ Auth validated" },
              { color: "text-blue-400", text: "[00:00:03] → Calling API..." },
              { color: "text-emerald-400", text: "[00:00:04] ✓ Response 200" },
            ].map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : -20 }}
                transition={{ delay: i * 0.5, duration: 0.3 }}
                className={line.color}
              >
                {line.text}
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {type === "chat" && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Chat bubbles */}
          <div className="space-y-3 w-full px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
              transition={{ delay: 0.2 }}
              className="flex justify-end"
            >
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white/80 max-w-[80%]">
                Add rate limiting to /api/users
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
              transition={{ delay: 0.8 }}
              className="flex justify-start"
            >
              <div className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white/70 max-w-[80%]">
                <span className="flex items-center gap-1">
                  <Sparkles size={10} className="text-emerald-400" />
                  Done! Added 100 req/min limit
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureRow({ 
  feature, 
  index, 
  isActive, 
  onClick 
}: { 
  feature: typeof FEATURES[0]; 
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = feature.icon;
  const isEven = index % 2 === 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
        !isEven ? "lg:flex-row-reverse" : ""
      }`}
    >
      {/* Visual preview area */}
      <div 
        className="relative w-full lg:w-1/2 aspect-video rounded-2xl overflow-hidden cursor-pointer group"
        onClick={onClick}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
        <div className="absolute inset-0 border border-white/[0.08] rounded-2xl" />
        
        {/* Animated Visual */}
        <FeatureVisual type={feature.visual} isActive={isActive} />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Play indicator */}
        {!isActive && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: isActive ? 0 : 1 }}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-emerald-400 border-b-[6px] border-b-transparent ml-1" />
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Content */}
      <div className="w-full lg:w-1/2 text-center lg:text-left">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Icon size={20} className="text-emerald-400" />
          </div>
          <span className="text-xs font-medium text-emerald-400/80 uppercase tracking-wider">
            {feature.subtitle}
          </span>
        </div>
        
        <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
          {feature.title}
        </h3>
        
        <p className="text-white/50 text-base lg:text-lg leading-relaxed mb-6">
          {feature.description}
        </p>
        
        <Link href="/">
          <button className="inline-flex items-center gap-2 text-emerald-400 font-medium hover:gap-3 transition-all">
            Learn more
            <ChevronRight size={16} />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

export function BuiltForProduction() {
  const [activeFeature, setActiveFeature] = useState<number>(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: "-20%" });

  // Auto-cycle through features when in view
  // useEffect(() => {
  //   if (!isInView) return;
  //   const interval = setInterval(() => {
  //     setActiveFeature((prev) => (prev + 1) % FEATURES.length);
  //   }, 5000);
  //   return () => clearInterval(interval);
  // }, [isInView]);

  return (
    <section ref={sectionRef} className="relative py-32 px-6 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.03),transparent_50%)]" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
              Enterprise Ready
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Built for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Production
            </span>
          </h2>
          
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            See FlowForge in action. Each feature designed to take you from idea to production.
          </p>
        </motion.div>

        {/* Feature rows */}
        <div className="space-y-24 lg:space-y-32">
          {FEATURES.map((feature, index) => (
            <FeatureRow
              key={feature.title}
              feature={feature}
              index={index}
              isActive={activeFeature === index}
              onClick={() => setActiveFeature(index)}
            />
          ))}
        </div>

        {/* Bottom section - Additional capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-32 text-center"
        >
          <p className="text-sm text-white/40 mb-6">Also included</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { icon: BookOpen, label: "AI Docs" },
              { icon: Terminal, label: "CLI Tools" },
              { icon: Shield, label: "Security" },
              { icon: Code2, label: "Export" },
            ].map((item) => (
              <motion.div
                key={item.label}
                whileHover={{ y: -4, scale: 1.05 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white/60"
              >
                <item.icon size={16} className="text-emerald-400/60" />
                <span className="text-sm">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
