"use client";

import { motion, useReducedMotion } from "framer-motion";

interface WorkflowOrbProps {
  className?: string;
  size?: number;
  isActive?: boolean;
}

export function WorkflowOrb({ className = "", size = 200, isActive = true }: WorkflowOrbProps) {
  const prefersReducedMotion = useReducedMotion();

  // Static version for reduced motion
  if (prefersReducedMotion) {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <div 
          className="absolute inset-0 rounded-full"
          style={{ border: "1px solid rgba(16,185,129,0.2)" }}
        />
        <div 
          className="absolute rounded-full bg-emerald-500/20"
          style={{ inset: size * 0.35 }}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer ring - CSS animation for performance */}
      <div 
        className="absolute inset-0 rounded-full animate-spin-slow"
        style={{
          border: "1px solid rgba(16,185,129,0.2)",
          boxShadow: "0 0 30px rgba(16,185,129,0.08)",
          animationDuration: "20s",
        }}
      />

      {/* Secondary ring - static dashed */}
      <div
        className="absolute rounded-full"
        style={{
          inset: size * 0.1,
          border: "1px dashed rgba(59,130,246,0.12)",
        }}
      />

      {/* Inner ring - subtle scale animation */}
      <motion.div
        animate={isActive ? { scale: [1, 1.03, 1] } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute rounded-full"
        style={{
          inset: size * 0.2,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      />

      {/* Core glow - CSS animation */}
      <div
        className={`absolute rounded-full bg-emerald-500/15 blur-lg ${isActive ? "animate-pulse" : ""}`}
        style={{
          inset: size * 0.3,
          animationDuration: "3s",
        }}
      />

      {/* Core center */}
      <div
        className={`absolute rounded-full bg-[#0a0a0a] border border-emerald-500/25 ${isActive ? "shadow-[0_0_25px_rgba(16,185,129,0.3)]" : ""}`}
        style={{ inset: size * 0.35 }}
      >
        {/* Inner symbol - simplified SVG */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={isActive ? { rotate: 360 } : {}}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5"
          >
            <svg viewBox="0 0 24 24" className="w-full h-full text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Single emission ring - CSS animation */}
      {isActive && (
        <div 
          className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping"
          style={{ animationDuration: "3s" }}
        />
      )}
    </div>
  );
}

// Mini workflow node - simplified
export function MiniWorkflowNode({
  label,
  color = "emerald",
  isActive = false,
}: {
  label: string;
  color?: "emerald" | "blue" | "red";
  isActive?: boolean;
}) {
  const colors = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    blue: "border-blue-400/30 bg-blue-500/10 text-blue-300",
    red: "border-red-500/30 bg-red-500/10 text-red-400",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colors[color]} text-xs font-medium backdrop-blur-sm transition-transform hover:scale-105`}
    >
      <div className={`w-1.5 h-1.5 rounded-full bg-current ${isActive ? "animate-pulse" : "opacity-50"}`} />
      {label}
    </div>
  );
}
