"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { COLORS, TYPOGRAPHY, EFFECTS, ICON_SIZES } from "@/internal/ui-map";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4 }}
      className={`bg-white/[0.05] border ${COLORS.border_primary} ${EFFECTS.rounded_lg} p-6 hover:bg-white/[0.08] hover:${COLORS.border_hover} ${EFFECTS.transition_smooth} group`}
    >
      <motion.div
        whileHover={{ rotate: 5, scale: 1.1 }}
        transition={{ duration: 0.2 }}
        className={`w-12 h-12 ${EFFECTS.rounded_md} ${COLORS.accent_emerald_bg} ${COLORS.accent_emerald_border} border flex items-center justify-center mb-4`}
      >
        <Icon className={COLORS.accent_emerald} size={ICON_SIZES.xl} />
      </motion.div>
      <h3 className={`${TYPOGRAPHY.h3} mb-2`}>{title}</h3>
      <p className={`${TYPOGRAPHY.body_small} ${COLORS.text_tertiary}`}>{description}</p>
    </motion.div>
  );
}
