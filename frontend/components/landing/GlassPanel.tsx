"use client";

import { ReactNode } from "react";
import { PATTERNS } from "@/internal/ui-map";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

export function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return (
    <div className={`${PATTERNS.glass} ${className}`}>
      {children}
    </div>
  );
}
