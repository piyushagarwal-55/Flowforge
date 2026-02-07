"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Shield,
  Database,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  ArrowLeft,
  Zap,
  User,
  ShieldCheck,
  Lock,
  LogIn,
  Search,
  Edit,
  Trash,
  Clock,
  Send,
  Circle,
} from "lucide-react";
import { PATTERNS, COLORS, TYPOGRAPHY, SPACING, EFFECTS, ICON_SIZES } from "@/internal/ui-map";

interface WorkflowStep {
  order: number;
  type: string;
  label: string;
  description: string;
  icon: string;
}

interface SecurityNote {
  type: "authentication" | "validation" | "database" | "email" | "security";
  message: string;
  severity: "info" | "warning" | "success";
}

interface ExplanationData {
  workflowId: string;
  summary: string;
  steps: WorkflowStep[];
  dataFlow: string[];
  securityNotes: SecurityNote[];
  nodeCount: number;
  correlationId: string;
}

interface BackendExplainerProps {
  workflowId?: string;
  ownerId?: string;
  onBack?: () => void;
}

const ICON_MAP: Record<string, any> = {
  user: User,
  "shield-check": ShieldCheck,
  lock: Lock,
  "log-in": LogIn,
  search: Search,
  database: Database,
  edit: Edit,
  trash: Trash,
  mail: Mail,
  clock: Clock,
  send: Send,
  zap: Zap,
  circle: Circle,
};

export function BackendExplainer({ workflowId, ownerId = "user_default", onBack }: BackendExplainerProps) {
  const [explanation, setExplanation] = useState<ExplanationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workflowId) {
      setError("No workflow to explain");
      setIsLoading(false);
      return;
    }

    console.log(`[BackendExplainer] BackendExplainer mounted`, {
      workflowId,
      ownerId,
      timestamp: new Date().toISOString(),
    });

    console.log(`[BackendExplainer] 🔍 Explain triggered`, {
      workflowId,
      ownerId,
      timestamp: new Date().toISOString(),
    });

    fetchExplanation();
  }, [workflowId, ownerId]);

  const fetchExplanation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"}/workflow/explain`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflowId,
            ownerId,
            correlationId: `explain-${Date.now()}`,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch explanation: ${response.status}`);
      }

      const data: ExplanationData = await response.json();

      console.log(`[BackendExplainer] Explain payload:`, data);

      console.log(`[BackendExplainer] ✅ Explain rendered`, {
        workflowId: data.workflowId,
        stepCount: data.steps.length,
        securityNoteCount: data.securityNotes.length,
      });

      setExplanation(data);
    } catch (err: any) {
      console.error(`[BackendExplainer] ❌ Explain failed`, {
        error: err.message,
      });
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "success":
        return <CheckCircle2 size={ICON_SIZES.sm} className={COLORS.accent_emerald} />;
      case "warning":
        return <AlertTriangle size={ICON_SIZES.sm} className="text-yellow-400" />;
      case "info":
      default:
        return <Info size={ICON_SIZES.sm} className={COLORS.text_tertiary} />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "success":
        return PATTERNS.badge_success;
      case "warning":
        return "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-xl bg-yellow-500/5 border-yellow-500/20 border";
      case "info":
      default:
        return PATTERNS.badge_info;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className={`${PATTERNS.card} flex items-center ${SPACING.gap_md}`}>
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
          <span className={TYPOGRAPHY.body_small}>Analyzing workflow...</span>
        </div>
      </div>
    );
  }

  if (error || !explanation) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className={`${PATTERNS.card} max-w-md text-center ${SPACING.space_md}`}>
          <AlertTriangle size={ICON_SIZES.xxl} className="text-yellow-400 mx-auto mb-4" />
          <h3 className={TYPOGRAPHY.h3}>Unable to explain workflow</h3>
          <p className={TYPOGRAPHY.body_xs}>{error || "No workflow data available"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className={PATTERNS.section_header}>
          <div className="flex items-center gap-4 mb-4">
            {/* Back Button */}
            {onBack && (
              <button
                onClick={onBack}
                className={`w-11 h-11 ${EFFECTS.rounded_md} ${COLORS.card_bg} ${COLORS.border_primary} border flex items-center justify-center hover:bg-white/5 transition-colors`}
                title="Back to workflow"
              >
                <ArrowLeft size={ICON_SIZES.lg} className={COLORS.text_secondary} />
              </button>
            )}
            
            <div className={`w-11 h-11 ${EFFECTS.rounded_md} ${COLORS.card_bg} ${COLORS.border_primary} border flex items-center justify-center`}>
              <BookOpen size={ICON_SIZES.lg} className={COLORS.text_secondary} />
            </div>
            <div>
              <h2 className={TYPOGRAPHY.h2}>Backend Explanation</h2>
              <p className={TYPOGRAPHY.body_xxs}>
                {explanation.nodeCount} steps • {explanation.workflowId.slice(0, 16)}...
              </p>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className={PATTERNS.card}>
          <div className={`flex items-start ${SPACING.gap_md} mb-4`}>
            <div className={`w-9 h-9 ${EFFECTS.rounded_sm} ${COLORS.button_icon} ${COLORS.border_primary} border flex items-center justify-center flex-shrink-0`}>
              <Zap size={ICON_SIZES.md} className={COLORS.text_secondary} />
            </div>
            <div className="flex-1">
              <h3 className={`${TYPOGRAPHY.h3} mb-2`}>What This Backend Does</h3>
              <p className={TYPOGRAPHY.body_small}>{explanation.summary}</p>
            </div>
          </div>

          {/* Data Flow */}
          {explanation.dataFlow.length > 0 && (
            <div className={`mt-4 pt-4 ${COLORS.border_primary} border-t`}>
              <h4 className={`${TYPOGRAPHY.label} mb-3`}>DATA FLOW</h4>
              <div className={SPACING.space_sm}>
                {explanation.dataFlow.map((flow, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ArrowRight size={ICON_SIZES.xs} className={COLORS.text_muted} />
                    <span className={TYPOGRAPHY.body_xs}>{flow}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className={SPACING.space_md}>
          <h3 className={`${TYPOGRAPHY.h3} mb-4`}>Step-by-Step Execution</h3>
          <div className={SPACING.space_md}>
            {explanation.steps.map((step) => {
              const IconComponent = ICON_MAP[step.icon] || Circle;
              return (
                <div key={step.order} className={PATTERNS.card_hover}>
                  <div className="flex items-start gap-4">
                    {/* Step Number */}
                    <div className={`w-8 h-8 ${EFFECTS.rounded_sm} ${COLORS.accent_blue_bg} ${COLORS.accent_blue_border} border flex items-center justify-center flex-shrink-0`}>
                      <span className={`${TYPOGRAPHY.badge} ${COLORS.accent_blue}`}>
                        {step.order}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className={`w-9 h-9 ${EFFECTS.rounded_sm} ${COLORS.card_bg} ${COLORS.border_primary} border flex items-center justify-center flex-shrink-0`}>
                      <IconComponent size={ICON_SIZES.md} className={COLORS.text_secondary} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`${TYPOGRAPHY.h3} mb-1`}>{step.label}</h4>
                      <p className={TYPOGRAPHY.body_xs}>{step.description}</p>
                      <span className={`${TYPOGRAPHY.body_xxs} ${COLORS.text_muted} font-mono mt-1 inline-block`}>
                        {step.type}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Notes */}
        {explanation.securityNotes.length > 0 && (
          <div className={PATTERNS.card}>
            <div className={`flex items-center ${SPACING.gap_md} mb-4`}>
              <Shield size={ICON_SIZES.lg} className={COLORS.text_secondary} />
              <h3 className={TYPOGRAPHY.h3}>Security & Validation</h3>
            </div>
            <div className={SPACING.space_sm}>
              {explanation.securityNotes.map((note, index) => (
                <div key={index} className={getSeverityBadge(note.severity)}>
                  {getSeverityIcon(note.severity)}
                  <span className={TYPOGRAPHY.body_small}>{note.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
