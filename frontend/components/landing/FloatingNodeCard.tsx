"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FloatingNodeCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  accentColor?: "emerald" | "blue" | "red" | "purple";
  delay?: number;
  className?: string;
}

const accentStyles = {
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconBorder: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    glowFrom: "from-emerald-500/20",
    hoverBorder: "group-hover:border-emerald-500/30",
    hoverShadow: "group-hover:shadow-[0_16px_48px_rgba(16,185,129,0.15)]",
  },
  blue: {
    iconBg: "bg-blue-500/10",
    iconBorder: "border-blue-400/20",
    iconColor: "text-blue-300",
    glowFrom: "from-blue-500/20",
    hoverBorder: "group-hover:border-blue-400/30",
    hoverShadow: "group-hover:shadow-[0_16px_48px_rgba(59,130,246,0.15)]",
  },
  red: {
    iconBg: "bg-red-500/10",
    iconBorder: "border-red-500/20",
    iconColor: "text-red-400",
    glowFrom: "from-red-500/20",
    hoverBorder: "group-hover:border-red-500/30",
    hoverShadow: "group-hover:shadow-[0_16px_48px_rgba(239,68,68,0.15)]",
  },
  purple: {
    iconBg: "bg-purple-500/10",
    iconBorder: "border-purple-500/20",
    iconColor: "text-purple-400",
    glowFrom: "from-purple-500/20",
    hoverBorder: "group-hover:border-purple-500/30",
    hoverShadow: "group-hover:shadow-[0_16px_48px_rgba(139,92,246,0.15)]",
  },
};

export function FloatingNodeCard({
  icon,
  title,
  description,
  accentColor = "emerald",
  delay = 0,
  className = "",
}: FloatingNodeCardProps) {
  const styles = accentStyles[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className={`relative group ${className}`}
    >
      {/* Gradient border effect on hover */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${styles.glowFrom} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      {/* Card body */}
      <div
        className={`relative bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/[0.06] ${styles.hoverBorder} rounded-2xl p-8 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${styles.hoverShadow}`}
      >
        {/* Icon container with tilt on hover */}
        <motion.div
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ duration: 0.2 }}
          className={`w-14 h-14 rounded-xl ${styles.iconBg} ${styles.iconBorder} border flex items-center justify-center mb-6`}
        >
          <span className={styles.iconColor}>{icon}</span>
        </motion.div>

        {/* Content */}
        <h3 className="text-xl font-semibold text-white/95 mb-3">{title}</h3>
        <p className="text-[15px] text-white/60 leading-relaxed">{description}</p>
      </div>

      {/* Magnetic glow effect - follows cursor conceptually */}
      <motion.div
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${
            accentColor === "emerald"
              ? "rgba(16,185,129,0.06)"
              : accentColor === "blue"
              ? "rgba(59,130,246,0.06)"
              : accentColor === "red"
              ? "rgba(239,68,68,0.06)"
              : "rgba(139,92,246,0.06)"
          }, transparent 40%)`,
        }}
      />
    </motion.div>
  );
}

// Connection line between cards (for visual flow)
export function ConnectionLine({
  className = "",
  animated = true,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`h-px bg-gradient-to-r from-transparent via-white/20 to-transparent origin-left ${className}`}
    >
      {animated && (
        <motion.div
          animate={{ x: ["0%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-full bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
        />
      )}
    </motion.div>
  );
}
