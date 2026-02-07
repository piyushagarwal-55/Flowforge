/**
 * FlowFoge UI DESIGN SYSTEM MAP
 * 
 * This file documents the complete design system extracted from existing components.
 * ALL new features MUST use these exact tokens to maintain visual consistency.
 * 
 * DO NOT invent new colors, spacing, or styles.
 * DO NOT create custom design patterns.
 * REUSE existing component patterns.
 */

/* ============================================================================
 * COLOR PALETTE
 * ============================================================================ */

export const COLORS = {
  // BACKGROUNDS
  primary_bg: "bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]", // Main app background
  panel_bg: "bg-[#0f0f0f]/95", // Modal/panel background
  card_bg: "bg-white/[0.05]", // Card background
  card_bg_hover: "bg-white/[0.08]", // Card hover state
  input_bg: "bg-white/[0.03]", // Input field background
  input_bg_focus: "bg-white/[0.04]", // Input focus background
  glass_bg: "bg-[#191919]/95", // Glass morphism background
  subtle_bg: "bg-white/[0.02]", // Very subtle background
  
  // BORDERS
  border_primary: "border-white/[0.06]", // Primary border
  border_secondary: "border-white/[0.08]", // Secondary border
  border_hover: "border-white/[0.12]", // Hover border
  border_focus: "border-white/[0.15]", // Focus border
  
  // TEXT
  text_primary: "text-white/90", // Primary text
  text_secondary: "text-white/70", // Secondary text
  text_tertiary: "text-white/50", // Tertiary text
  text_muted: "text-white/40", // Muted text
  text_disabled: "text-white/30", // Disabled text
  
  // ACCENTS
  accent_emerald: "text-emerald-400", // Success/complete
  accent_emerald_bg: "bg-emerald-500/5", // Success background
  accent_emerald_border: "border-emerald-500/20", // Success border
  
  accent_red: "text-red-400", // Error/failed
  accent_red_bg: "bg-red-500/5", // Error background
  accent_red_border: "border-red-500/20", // Error border
  
  accent_blue: "text-blue-200", // Info/link
  accent_blue_bg: "bg-blue-500/[0.08]", // Info background
  accent_blue_border: "border-blue-400/[0.15]", // Info border
  
  // BUTTONS
  button_primary: "bg-white text-black", // Primary button
  button_primary_hover: "hover:bg-white/90", // Primary hover
  button_secondary: "bg-white/[0.03] text-white/60", // Secondary button
  button_secondary_hover: "hover:bg-white/[0.06]", // Secondary hover
  button_icon: "bg-white/[0.08]", // Icon button
  button_icon_hover: "hover:bg-white/[0.08]", // Icon hover
} as const;

/* ============================================================================
 * TYPOGRAPHY
 * ============================================================================ */

export const TYPOGRAPHY = {
  // HEADINGS
  h1: "text-2xl font-semibold text-white/90 tracking-tight",
  h2: "text-lg font-semibold text-white/95 tracking-tight",
  h3: "text-sm font-medium text-white/90",
  
  // BODY
  body_base: "text-[14px] text-white/90 leading-relaxed",
  body_small: "text-sm text-white/80",
  body_xs: "text-xs text-white/70",
  body_xxs: "text-[10px] text-white/50",
  
  // SPECIAL
  label: "text-xs font-medium text-white/70",
  code: "font-mono text-xs text-emerald-400",
  badge: "text-[10px] font-semibold",
} as const;

/* ============================================================================
 * SPACING
 * ============================================================================ */

export const SPACING = {
  // PADDING
  card_padding: "p-6", // Standard card padding
  card_padding_sm: "p-4", // Small card padding
  card_padding_xs: "p-3", // Extra small card padding
  
  section_padding: "px-6 py-5", // Section padding
  section_padding_sm: "px-4 py-3", // Small section padding
  
  input_padding: "px-3 py-2.5", // Input padding
  button_padding: "px-3 py-2.5", // Button padding
  
  // GAPS
  gap_sm: "gap-2", // Small gap
  gap_md: "gap-3", // Medium gap
  gap_lg: "gap-4", // Large gap
  
  // SPACING
  space_sm: "space-y-2", // Small vertical spacing
  space_md: "space-y-3", // Medium vertical spacing
  space_lg: "space-y-4", // Large vertical spacing
} as const;

/* ============================================================================
 * BORDERS & SHADOWS
 * ============================================================================ */

export const EFFECTS = {
  // BORDER RADIUS
  rounded_sm: "rounded-lg", // Small radius (8px)
  rounded_md: "rounded-xl", // Medium radius (12px)
  rounded_lg: "rounded-2xl", // Large radius (16px)
  
  // SHADOWS
  shadow_card: "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
  shadow_modal: "shadow-2xl",
  shadow_inner: "shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]",
  shadow_glow: "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]",
  
  // BACKDROP
  backdrop_blur: "backdrop-blur-xl",
  backdrop_blur_strong: "backdrop-blur-[40px]",
  
  // TRANSITIONS
  transition_smooth: "transition-all duration-200",
  transition_fast: "transition-all duration-150",
  transition_slow: "transition-all duration-300",
} as const;

/* ============================================================================
 * COMPONENT PATTERNS
 * ============================================================================ */

export const PATTERNS = {
  // CARD
  card: `${COLORS.card_bg} ${COLORS.border_primary} border ${EFFECTS.rounded_md} ${SPACING.card_padding}`,
  card_hover: `${COLORS.card_bg} ${COLORS.border_primary} border ${EFFECTS.rounded_md} ${SPACING.card_padding} hover:${COLORS.card_bg_hover} ${EFFECTS.transition_smooth}`,
  
  // PANEL
  panel: `${COLORS.panel_bg} ${EFFECTS.backdrop_blur} ${EFFECTS.rounded_lg} ${EFFECTS.shadow_modal} ${COLORS.border_primary} border ${EFFECTS.shadow_inner}`,
  
  // GLASS CONTAINER
  glass: `${COLORS.glass_bg} ${EFFECTS.backdrop_blur} ${COLORS.border_secondary} border ${EFFECTS.rounded_lg} ${EFFECTS.shadow_card}`,
  
  // INPUT
  input: `w-full ${SPACING.input_padding} ${COLORS.input_bg} ${COLORS.border_secondary} border ${EFFECTS.rounded_md} ${TYPOGRAPHY.body_small} ${COLORS.text_primary} placeholder-white/30 focus:outline-none focus:${COLORS.border_focus} focus:${COLORS.input_bg_focus} ${EFFECTS.transition_smooth}`,
  
  // BUTTON PRIMARY
  button_primary: `${SPACING.button_padding} ${TYPOGRAPHY.body_xs} font-semibold ${COLORS.button_primary} ${EFFECTS.rounded_md} ${COLORS.button_primary_hover} ${EFFECTS.transition_smooth} active:scale-95`,
  
  // BUTTON SECONDARY
  button_secondary: `${SPACING.button_padding} ${TYPOGRAPHY.body_xs} font-medium ${COLORS.button_secondary} ${COLORS.border_secondary} border ${EFFECTS.rounded_md} ${COLORS.button_secondary_hover} ${EFFECTS.transition_smooth}`,
  
  // ICON BUTTON
  icon_button: `w-9 h-9 ${EFFECTS.rounded_sm} ${COLORS.button_icon} ${COLORS.border_primary} border flex items-center justify-center ${COLORS.button_icon_hover} hover:${COLORS.border_hover} hover:scale-105 active:scale-95 ${EFFECTS.transition_smooth}`,
  
  // BADGE
  badge_success: `inline-flex items-center ${SPACING.gap_sm} px-4 py-2.5 ${EFFECTS.rounded_md} ${EFFECTS.backdrop_blur} ${COLORS.accent_emerald_bg} ${COLORS.accent_emerald_border} border`,
  badge_error: `inline-flex items-center ${SPACING.gap_sm} px-4 py-2.5 ${EFFECTS.rounded_md} ${EFFECTS.backdrop_blur} ${COLORS.accent_red_bg} ${COLORS.accent_red_border} border`,
  badge_info: `inline-flex items-center ${SPACING.gap_sm} px-4 py-2.5 ${EFFECTS.rounded_md} ${EFFECTS.backdrop_blur} ${COLORS.accent_blue_bg} ${COLORS.accent_blue_border} border`,
  
  // SECTION HEADER
  section_header: `${SPACING.section_padding} ${COLORS.border_primary} border-b`,
  
  // DIVIDER
  divider: `${COLORS.border_primary} border-t`,
} as const;

/* ============================================================================
 * REUSABLE COMPONENTS (from existing codebase)
 * ============================================================================ */

export const REUSABLE_COMPONENTS = {
  // From ExecutionLogsSidebar.tsx
  modal_backdrop: "fixed inset-0 bg-black/60 backdrop-blur-xl z-40",
  modal_container: "fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none",
  modal_content: "relative border-2 border-white rounded-2xl w-full max-w-3xl h-[85vh] pointer-events-auto",
  
  // From ChatShell.tsx
  message_user: "max-w-[80%] rounded-2xl px-5 py-3 bg-white text-black",
  message_assistant: "max-w-[80%] rounded-2xl px-5 py-3 bg-white/[0.05] border border-white/[0.08] text-white/90",
  
  // From SaveWorkflowModal.tsx
  code_block: "text-xs text-emerald-400 font-mono",
  endpoint_badge: "px-1.5 py-0.5 bg-blue-400/20 rounded text-[10px] font-semibold text-blue-300",
  
  // Loading states
  spinner: "w-4 h-4 border-2 border-white/20 border-t-white/70 rounded-full animate-spin",
  pulse_dot: "w-2 h-2 rounded-full bg-white/60 animate-pulse",
} as const;

/* ============================================================================
 * ICON SIZES (from lucide-react usage)
 * ============================================================================ */

export const ICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 32,
} as const;

/* ============================================================================
 * LAYOUT PATTERNS
 * ============================================================================ */

export const LAYOUTS = {
  // Centered modal
  centered_modal: "fixed inset-0 z-50 flex items-center justify-center p-4",
  
  // Full screen
  full_screen: "w-full h-screen",
  
  // Flex column
  flex_col: "flex flex-col",
  
  // Flex row with gap
  flex_row: "flex items-center gap-3",
  
  // Grid 2 columns
  grid_2: "grid grid-cols-2 gap-2.5",
  
  // Scrollable area
  scrollable: "overflow-y-auto scrollbar-custom",
} as const;

/* ============================================================================
 * ANIMATION CLASSES (from ExecutionLogsSidebar.tsx)
 * ============================================================================ */

export const ANIMATIONS = {
  fade_in: "animate-fade-in", // 0.3s fade in
  slide_up: "animate-slide-up", // 0.4s slide up
  slide_in_left: "animate-slide-in-left", // 0.25s slide from left
  pulse_dot: "animate-pulse-dot", // Pulsing dot
  ripple: "animate-ripple", // Ripple effect
  spin: "animate-spin", // Spinner
} as const;

/* ============================================================================
 * USAGE NOTES
 * ============================================================================ */

/**
 * CRITICAL RULES FOR NEW COMPONENTS:
 * 
 * 1. ALWAYS use PATTERNS for common components (cards, buttons, inputs)
 * 2. NEVER create custom colors - use COLORS tokens
 * 3. NEVER create custom spacing - use SPACING tokens
 * 4. NEVER create custom typography - use TYPOGRAPHY tokens
 * 5. REUSE existing component patterns from REUSABLE_COMPONENTS
 * 6. Match the glass morphism aesthetic (backdrop-blur + subtle borders)
 * 7. Use white/opacity for all colors (never pure colors except accents)
 * 8. Maintain consistent rounded corners (rounded-lg, rounded-xl, rounded-2xl)
 * 9. Use smooth transitions for all interactive elements
 * 10. Follow the dark gradient background pattern
 * 
 * EXAMPLE - Creating a new card component:
 * 
 * ❌ WRONG:
 * <div className="bg-gray-900 border-gray-700 rounded-md p-4">
 * 
 * ✅ CORRECT:
 * <div className={PATTERNS.card}>
 * 
 * EXAMPLE - Creating a new button:
 * 
 * ❌ WRONG:
 * <button className="bg-blue-500 text-white px-4 py-2 rounded">
 * 
 * ✅ CORRECT:
 * <button className={PATTERNS.button_primary}>
 */

console.log("✅ UI MAP COMPLETE");
