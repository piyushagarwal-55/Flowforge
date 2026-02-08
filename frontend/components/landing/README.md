# FlowForge Landing Page

## Overview

The FlowForge landing page is **not marketing fluff** — it's the product introducing itself. Built as an extension of the existing FlowForge UI, it maintains complete visual consistency while adding narrative structure and scroll choreography.

## Design Philosophy

### Core Principle
**FlowForge's Dark Identity + Tambo's Motion Philosophy = Product Introduction**

This landing page feels like **FlowForge escaped into marketing** — not a redesign, but an expansion of the existing product UI into a narrative onboarding experience.

## Visual Identity

### Strict Adherence to UI-MAP.TS
Every color, spacing, typography, and effect comes from `frontend/internal/ui-map.ts`:

- **Backgrounds**: Dark gradient (`from-[#0a0a0a] via-[#111] to-[#0a0a0a]`)
- **Borders**: White opacity (`border-white/[0.06]`, `border-white/[0.08]`)
- **Text**: White opacity hierarchy (`text-white/90`, `text-white/70`, `text-white/50`)
- **Accents**: Emerald (success), Red (error), Blue (info)
- **Effects**: Backdrop blur, rounded corners, smooth transitions

### No New Design Language
- ❌ No light colors
- ❌ No pastels
- ❌ No marketing gradients
- ✅ Only FlowForge darkness

## Motion Philosophy

### Inspired by Tambo, Adapted to FlowForge

1. **Ambient Background Motion**
   - Slow-moving radial gradients (emerald + blue)
   - Subtle noise texture overlay
   - Never static, always breathing

2. **Scroll Choreography**
   - Every section: `opacity: 0 → 1` + `translateY: 20px → 0`
   - Staggered child elements (50-100ms delay)
   - Easing: `[0.25, 0.46, 0.45, 0.94]` (out-quad)

3. **Micro-Interactions**
   - Button hover: `scale: 1.02` + glow increase
   - Card hover: `translateY: -4px` + border brightness
   - Icon hover: `rotate: 5deg` + `scale: 1.1`

4. **Progressive Disclosure**
   - One idea per section
   - Clear narrative flow
   - Never overwhelming

## Section Structure

### 1. Hero (100vh)
- Oversized headline
- Supporting text
- Two CTAs (primary → app, secondary → demo)
- Ambient background animation
- Scroll indicator

### 2. Problem (py-24)
- 3 pain point cards
- Red accents for problems
- Staggered entrance
- Hover lift effect

### 3. Solution (py-32)
- Emerald radial glow
- Large headline
- Visual workflow preview
- Glass morphism card

### 4. Features (py-24)
- 4 feature cards
- Icon rotation on hover
- Card lift on hover
- Emerald accents
- Staggered entrance

### 5. Technical Demo (py-32)
- **CRITICAL**: Real FlowForge product embedded
- Lazy-loaded WorkflowPage component
- Sandbox mode (no persistence)
- User can try building workflows
- This is the hackathon differentiator

### 6. Final CTA (py-32)
- Strong headline
- Two CTAs
- Radial glow background

### 7. Footer
- Simple, minimal
- Hackathon attribution

## Components

### AmbientBackground.tsx
Animated dark background with radial glows and noise texture.

**Features**:
- Base gradient layer
- Animated emerald glow (8s loop)
- Animated blue glow (10s loop, delayed)
- Noise texture overlay

### AnimatedSection.tsx
Reusable scroll-triggered animation wrapper.

**Props**:
- `children`: ReactNode
- `className`: string (optional)
- `delay`: number (optional)

**Animation**:
- Initial: `opacity: 0, y: 20`
- Final: `opacity: 1, y: 0`
- Viewport: `once: true, margin: "-100px"`

### FeatureCard.tsx
Feature card with icon, title, description.

**Props**:
- `icon`: LucideIcon
- `title`: string
- `description`: string
- `delay`: number (optional)

**Interactions**:
- Hover: Card lifts (`y: -4`)
- Hover: Icon rotates (`rotate: 5deg`) and scales (`scale: 1.1`)

### GlassPanel.tsx
Glass morphism container using FlowForge's glass pattern.

**Props**:
- `children`: ReactNode
- `className`: string (optional)

**Style**: Uses `PATTERNS.glass` from ui-map.ts

### LandingDemo.tsx
**CRITICAL COMPONENT** - Embeds real FlowForge product.

**Features**:
- Lazy loads WorkflowPage component
- Intersection Observer for performance
- Sandbox mode (demo user, no persistence)
- Example prompts
- Loading states

**Props**: None (self-contained)

## Performance Optimizations

### Code Splitting
```tsx
const WorkflowPage = dynamic(() => import("@/app/builder/page"), {
  ssr: false,
  loading: () => <LoadingSpinner />
});
```

### Lazy Loading
- Demo section only loads when visible (IntersectionObserver)
- Heavy components deferred until needed

### Animation Performance
- Only `transform` and `opacity` (GPU-accelerated)
- No `width`, `height`, `top`, `left` animations
- `will-change` used sparingly

### Responsive Design
- Mobile: Stacks vertically, reduces text size
- Desktop: Full layout with all features
- Breakpoints: `md:` (768px), `lg:` (1024px)

## Usage

### Development
```bash
npm run dev
# Navigate to http://localhost:5000/landing
```

### Production
```bash
npm run build
npm start
```

## Testing Checklist

- [ ] Landing loads without backend
- [ ] Demo activates when backend running
- [ ] Mobile responsive
- [ ] Animations smooth (60fps)
- [ ] No layout shift
- [ ] Lighthouse score >90
- [ ] All CTAs functional
- [ ] Scroll behavior smooth
- [ ] Dark theme consistent
- [ ] No console errors

## Hackathon Narrative

This landing page demonstrates:

1. **Product-First Design**: Not marketing, but product introduction
2. **Generative UI**: Real FlowForge embedded, not screenshots
3. **Dark Professional Identity**: Infrastructure-grade aesthetic
4. **Motion Excellence**: Tambo-inspired choreography
5. **Technical Depth**: Live demo proves it's real

## Future Enhancements

- [ ] Add video testimonials
- [ ] Add stats/metrics
- [ ] Add pricing section
- [ ] Add FAQ section
- [ ] Add blog preview
- [ ] Add changelog preview

## Notes

- This landing page is **additive** — it doesn't touch existing routes
- All components reuse FlowForge's design system
- No new colors, no new patterns, no new visual language
- The demo section is the star — it proves FlowForge is real

---

**Built with engineering discipline for The UI Strikes Back Hackathon**
