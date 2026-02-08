# Tambo Landing - Comprehensive Design & Technical Analysis

## 🎨 DESIGN SYSTEM OVERVIEW

### Color Palette

#### Primary Colors
- **Ghost Mint**: `#D6FFEC` - Lightest mint shade
- **Mint**: `#B6FFDD` - Primary brand color, used for accents and CTAs
- **Teal**: `#7FFFC3` - Mid-tone teal for highlights
- **Dark Teal**: `#80C1A2` - Darker teal for patterns and borders

#### Neutral Colors
- **Off White**: `#F2F8F6` - Light background
- **Light Gray**: `#E5F0ED` - Primary background color
- **Grey**: `#D8E9E4` - Mid-tone grey
- **Dark Grey**: `#CBE2DB` - Darker grey for borders

#### Accent Colors
- **White**: `#ffffff` - Pure white
- **Black**: `#0F1A17` - Primary text color, deep forest black
- **Forest**: `#008346` - Deep green accent

#### Additional Colors
- **Red**: `#e30613`
- **Blue**: `#0070f3`
- **Green**: `#00ff88`
- **Purple**: `#7928ca`
- **Pink**: `#FFC4EB`
- **Light Pink**: `#FFD6F1`
- **Dark Pink**: `#E1C9D9`

### Theme Configuration
- **Default Theme**: Light
- **Primary**: Light Gray (`#E5F0ED`)
- **Secondary**: Black (`#0F1A17`)
- **Contrast**: Mint (`#B6FFDD`)

---

## 📝 TYPOGRAPHY SYSTEM

### Font Families
1. **Sentient** (`--next-font-sentient`)
   - Used for: Hero titles, headings (h1-h4)
   - Weight: 300 (Light)
   - Letter spacing: -0.05em to -0.04em
   - Line height: 110%

2. **Geist** (`--next-font-geist`)
   - Used for: Body text, paragraphs
   - Weight: 400-500
   - Letter spacing: 0em
   - Line height: 110-140%

3. **Geist Mono** (`--next-font-geist-mono`)
   - Used for: Labels, buttons, code snippets
   - Weight: 400-500
   - Letter spacing: 0.02em
   - Text transform: Uppercase
   - Line height: 110-120%

4. **Server Mono** (`--next-font-mono`)
   - Used for: Technical/monospace content
   - Weight: 400
   - Line height: 90%

### Typography Scale

#### Headings
- **Hero Title**: 64px (mobile & desktop), Sentient Light, -0.05em
- **H1**: 28px (mobile) / 48px (desktop), Sentient Light, -0.05em
- **H2**: 40px (both), Sentient Light, -0.05em
- **H3**: 32px (both), Sentient Light, -0.05em
- **H4**: 24px (both), Sentient Light, -0.05em
- **H5**: 16px (both), Geist Mono Medium, 0.02em, UPPERCASE

#### Body Text
- **P-L**: 20px, Geist Regular
- **P**: 14px (mobile) / 16px (desktop), Geist Regular
- **P-Bold**: 16px, Geist Medium
- **P-Sentient**: 16px, Sentient Light, -0.04em
- **P-S**: 12px, Geist Regular, 140% line-height

#### UI Elements
- **Button**: 14px, Geist Mono Medium, 0.02em, UPPERCASE
- **Link**: 14px, Geist Mono Medium, 0.02em, UPPERCASE, underlined
- **Surtitle**: 16px, Geist Mono Regular, 0.02em, UPPERCASE
- **Label-M**: 12px, Geist Mono Regular, 0.02em, UPPERCASE
- **Label-S**: 10px, Geist Mono Regular, 0.02em, UPPERCASE
- **Code Snippet**: 12px, Geist Mono Regular, 0.02em

---

## 🎭 ANIMATION LIBRARIES & TECHNIQUES

### Core Animation Stack

#### 1. GSAP (GreenSock Animation Platform) v3.13.0
**Purpose**: High-performance timeline-based animations
**Usage**:
- Custom ticker integration with Tempus
- Default easing: 'none' (linear)
- Lag smoothing disabled for precise control
- Used for: Scroll-triggered animations, parallax effects, kinesis (mouse-follow)

**Key Implementation**:
```typescript
// Custom GSAP setup with Tempus integration
gsap.defaults({ ease: 'none' })
gsap.ticker.lagSmoothing(0)
gsap.ticker.remove(gsap.updateRoot)
// Manual update via Tempus RAF
useTempus((time) => {
  gsap.updateRoot(time / 1000)
})
```

#### 2. Lenis v1.3.16
**Purpose**: Smooth scroll library
**Features**:
- Smooth scrolling with momentum
- Velocity tracking for scroll-based animations
- Integration with marquee components
- Scrollbar gutter management

#### 3. Tempus v1.0.0-dev.17
**Purpose**: Unified RequestAnimationFrame (RAF) management
**Features**:
- Single RAF loop for all animations
- Performance optimization
- Patch mode for consistent timing
- Integration with GSAP and other animation systems

#### 4. Framer Motion (via motion-dom & motion-utils)
**Purpose**: React animation library
**Note**: Installed but not heavily used in favor of GSAP

#### 5. Theatre.js v0.7.2
**Purpose**: Animation sequencing and timeline editor
**Components**:
- `@theatre/core` - Runtime
- `@theatre/studio` - Visual editor (dev only)
**Usage**: Complex animation sequences, R3F integration

---

### Animation Techniques

#### 1. **Scroll-Triggered Animations**
- GSAP ScrollTrigger integration
- Lenis smooth scroll with velocity tracking
- Intersection Observer for viewport detection
- Progressive reveal patterns

#### 2. **Parallax Effects**
- Mouse-based parallax (Kinesis component)
- Scroll-based parallax
- Multi-layer depth effects

#### 3. **Marquee Animations**
- Custom marquee component with Tempus RAF
- Scroll velocity integration
- Pause on hover
- Seamless looping with modulo math

#### 4. **WebGL Animations**
- React Three Fiber (R3F) v9.4.2
- Three.js v0.181.2
- Custom animated gradient shader
- Flowmap effects
- Postprocessing v6.38.0

#### 5. **Rive Animations**
- `@rive-app/react-webgl2` v4.26.2
- Interactive vector animations
- State machine integration
- Lazy loading with intersection observer

#### 6. **CSS Animations**
- Custom easing functions (cubic-bezier)
- Transform-based animations (GPU-accelerated)
- Transition utilities
- Keyframe animations

---

## 🎨 EASING FUNCTIONS

### CSS Easings (cubic-bezier)
```typescript
'in-quad': 'cubic-bezier(0.55, 0.085, 0.68, 0.53)'
'in-cubic': 'cubic-bezier(0.55, 0.055, 0.675, 0.19)'
'in-quart': 'cubic-bezier(0.895, 0.03, 0.685, 0.22)'
'in-quint': 'cubic-bezier(0.755, 0.05, 0.855, 0.06)'
'in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)'
'in-circ': 'cubic-bezier(0.6, 0.04, 0.98, 0.335)'
'out-quad': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
'out-cubic': 'cubic-bezier(0.215, 0.61, 0.355, 1)'
'out-quart': 'cubic-bezier(0.165, 0.84, 0.44, 1)'
'out-quint': 'cubic-bezier(0.23, 1, 0.32, 1)'
'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)'
'out-circ': 'cubic-bezier(0.075, 0.82, 0.165, 1)'
'in-out-quad': 'cubic-bezier(0.455, 0.03, 0.515, 0.955)'
'in-out-cubic': 'cubic-bezier(0.645, 0.045, 0.355, 1)'
'in-out-quart': 'cubic-bezier(0.77, 0, 0.175, 1)'
'in-out-quint': 'cubic-bezier(0.86, 0, 0.07, 1)'
'in-out-expo': 'cubic-bezier(1, 0, 0, 1)'
'in-out-circ': 'cubic-bezier(0.785, 0.135, 0.15, 0.86)'
'gleasing': 'cubic-bezier(0.4, 0, 0, 1)'
```

### JavaScript Easings
- Full suite of easing functions (quad, cubic, quart, quint, expo, circ, back, elastic, bounce)
- In, Out, and InOut variants
- Used with GSAP and custom animations

---

## 🧩 COMPONENT LIBRARY

### UI Components

#### 1. **Button / CTA Component**
**Path**: `components/button/`
**Features**:
- Primary and secondary variants
- Black and white color schemes
- Icon support (arrow, github, discord)
- Code snippet expansion
- Hash pattern background
- Hover states with GSAP

**Styling**:
- Border radius: 16px
- Height: 48px
- Padding: 16px (left), 8px (right/top/bottom)
- Icon container: 32x32px, mint background, 10px radius
- Typography: Geist Mono, 14px, uppercase

#### 2. **Marquee Component**
**Path**: `components/marquee/`
**Features**:
- Infinite scroll animation
- Scroll velocity integration
- Pause on hover
- Configurable speed and direction
- Intersection observer optimization

#### 3. **Kinesis (Parallax) Component**
**Path**: `components/kinesis/`
**Features**:
- Mouse-follow parallax effect
- GSAP-powered smooth movement
- Desktop-only (disabled on mobile)
- Expo easing (4s duration)

#### 4. **Rive Animation Component**
**Path**: `components/rive/`
**Features**:
- WebGL2-based Rive animations
- State machine integration
- Lazy loading with intersection observer
- Custom asset loader for fonts/images
- Configurable fit and alignment

#### 5. **Animated Gradient Component**
**Path**: `components/animated-gradient/`
**Features**:
- WebGL shader-based gradient
- Dynamic color transitions
- Viewport visibility optimization
- R3F integration via tunnel
- Custom material system

#### 6. **Image Component**
**Path**: `components/image/`
**Features**:
- Next.js Image wrapper
- Lazy loading
- Responsive sizing
- CSS module styling

#### 7. **Video Component**
**Path**: `components/video/`
**Features**:
- Optimized video playback
- Multiple format support (.mov, .webm)
- Lazy loading

#### 8. **Dropdown Component**
**Path**: `components/dropdown/`
**Features**:
- Radix UI integration
- Accessible dropdown menus
- Custom styling

#### 9. **Contact Form Component**
**Path**: `components/contact-form/`
**Features**:
- Cloudflare Turnstile integration
- Form validation
- Spam protection
- Rate limiting

---

### Layout Components

#### 1. **Real Viewport Component**
**Path**: `components/real-viewport/`
**Purpose**: CSS custom properties for accurate viewport dimensions
**Features**:
- Handles mobile browser chrome
- Updates on resize
- Provides `--vh` and `--vw` variables

#### 2. **GSAP Runtime Component**
**Path**: `components/gsap/runtime.tsx`
**Purpose**: Client-side GSAP initialization
**Features**:
- Lazy loading
- Tempus integration
- Single RAF loop

#### 3. **Wrapper Component**
**Path**: `app/(pages)/_components/wrapper.tsx`
**Purpose**: Page-level wrapper with Lenis integration
**Features**:
- Smooth scroll setup
- Theme management
- Layout constraints

---

## 🎨 STYLING SYSTEM

### Tailwind CSS v4
**Configuration**: CSS-first with `@theme` directive
**Custom Utilities**: `dr-*` prefix for project-specific utilities

#### Custom Utility Categories
1. **Scaling Utilities** (responsive to device width)
   - `dr-text-*`, `dr-tracking-*`, `dr-leading-*`
   - `dr-border-*`, `dr-rounded-*`

2. **Column-Based Sizing** (responsive to grid columns)
   - `dr-w-col-*`, `dr-h-col-*`
   - `dr-gap-col-*`, `dr-p-col-*`, `dr-m-col-*`

3. **Standard Sizing** (responsive to device width)
   - `dr-w-*`, `dr-h-*`
   - `dr-gap-*`, `dr-p-*`, `dr-m-*`
   - `dr-top-*`, `dr-inset-*`

4. **Layout Utilities**
   - `dr-grid` - Grid with project columns
   - `dr-layout-block` - Layout block with margins
   - `dr-layout-grid` - Combined layout + grid
   - `desktop-only`, `mobile-only`

### PostCSS Functions
```css
mobile-vw(pixels)   /* Viewport width for mobile */
mobile-vh(pixels)   /* Viewport height for mobile */
desktop-vw(pixels)  /* Viewport width for desktop */
desktop-vh(pixels)  /* Viewport height for desktop */
columns(n)          /* Width based on grid columns */
```

### CSS Modules
**Naming Convention**: `component-name.module.css`
**Import Alias**: Always import as `s`
**Class Naming**: camelCase (e.g., `.button`, `.isPrimary`, `.isDisabled`)

### Global CSS Classes
```css
.fullwidth          /* Full viewport width */
.fade-mask          /* Gradient mask on edges */
.card-outline       /* 6px outline with off-white */
.dashed-border      /* 1px dashed forest border */
.content-max-width  /* Max width constraint */
.section-shadow-top /* Top shadow with teal glow */
.section-shadow-bottom /* Bottom shadow with teal glow */
.section-rounded-top /* Rounded top corners */
.section-rounded-bottom /* Rounded bottom corners */
.dark-teal-pattern  /* Diagonal stripe pattern */
.shadow-xs          /* Small teal glow */
.shadow-s           /* Medium teal glow */
.shadow-m           /* Large teal glow */
```

---

## 🏗️ ARCHITECTURE

### Tech Stack

#### Frontend Framework
- **Next.js** v16.1.6 (App Router)
- **React** v19.2.2
- **TypeScript** v5.9.3

#### State Management
- **Zustand** v5.0.9 - Lightweight state management
- **Hamo** v1.0.0-dev.6 - React hooks for observers

#### 3D & WebGL
- **Three.js** v0.181.2
- **React Three Fiber** v9.4.2
- **@react-three/drei** v10.7.7 - R3F helpers
- **Postprocessing** v6.38.0 - Post-processing effects
- **Tunnel-rat** v0.1.2 - Portal system for R3F

#### Animation
- **GSAP** v3.13.0
- **Lenis** v1.3.16 - Smooth scroll
- **Tempus** v1.0.0-dev.17 - RAF management
- **Theatre.js** v0.7.2 - Animation sequencing

#### UI Libraries
- **Radix UI** - Accessible primitives
  - `@radix-ui/react-dropdown-menu` v2.1.16
  - `@radix-ui/react-tooltip` v1.2.8
- **Lucide React** v0.560.0 - Icons
- **@base-ui-components/react** v1.0.0-rc.0

#### Content & MDX
- **@next/mdx** v16.1.6
- **@mdx-js/react** v3.1.1
- **Nextra** v4.6.1 - Documentation framework
- **rehype-pretty-code** v0.14.1 - Code highlighting
- **remark-gfm** v4.0.1 - GitHub Flavored Markdown

#### Forms & Validation
- **Zod** v4.2.1 - Schema validation
- **@valibot/to-json-schema** v1.5.0

#### Maps & Geolocation
- **Mapbox GL** v3.17.0

#### Analytics
- **PostHog** v1.335.0

#### Development Tools
- **Biome** v2.3.8 - Linter & formatter
- **Lefthook** v2.0.9 - Git hooks
- **Bun** v1.3.0 - Package manager & runtime

---

### Project Structure

```
tambo-landing/
├── app/                    # Next.js App Router
│   ├── (pages)/           # Page groups
│   │   ├── home/          # Homepage sections
│   │   ├── (legal)/       # Legal pages
│   │   └── contact-us/    # Contact page
│   ├── blog/              # Blog system
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── animated-gradient/ # WebGL gradient
│   ├── button/            # CTA buttons
│   ├── gsap/              # GSAP runtime
│   ├── kinesis/           # Parallax
│   ├── marquee/           # Infinite scroll
│   ├── rive/              # Rive animations
│   └── ui/                # UI primitives
├── styles/                # Design system
│   ├── colors.ts          # Color palette
│   ├── typography.ts      # Type scale
│   ├── easings.ts         # Easing functions
│   ├── config.ts          # Theme config
│   ├── css/               # Global CSS
│   └── scripts/           # Style generators
├── webgl/                 # WebGL utilities
│   ├── components/        # R3F components
│   ├── hooks/             # WebGL hooks
│   └── utils/             # Shaders & helpers
├── hooks/                 # Custom React hooks
├── libs/                  # Utility functions
├── orchestra/             # Dev tools
├── providers/             # Context providers
└── public/                # Static assets
    ├── assets/            # Images, videos
    ├── fonts/             # Custom fonts
    └── videos/            # Video files
```

---

## 🎬 ANIMATION PATTERNS

### 1. Scroll-Based Animations
**Implementation**: GSAP + Lenis + Intersection Observer
**Pattern**:
```typescript
// Detect viewport entry
const [setRef, intersection] = useIntersectionObserver()

// Trigger animation on scroll
useEffect(() => {
  if (intersection?.isIntersecting) {
    gsap.to(element, { opacity: 1, y: 0 })
  }
}, [intersection])
```

### 2. Mouse-Follow Parallax
**Implementation**: Kinesis component with GSAP
**Pattern**:
```typescript
useMouseMove((x, y) => {
  gsap.to(mouseRef.current, {
    x, y,
    duration: 4,
    ease: 'expo.out'
  })
})
```

### 3. Infinite Marquee
**Implementation**: Custom Tempus RAF loop
**Pattern**:
```typescript
useTempus((_, deltaTime) => {
  const velocity = lenis?.velocity ?? 0
  const offset = deltaTime * (speed * 0.1 * velocity)
  transformRef.current += offset
  transformRef.current = modulo(transformRef.current, width)
  node.style.transform = `translate3d(${-transformRef.current}px,0,0)`
})
```

### 4. WebGL Gradient Animation
**Implementation**: Custom shader with R3F
**Features**:
- Animated noise-based gradient
- Color interpolation
- Viewport-optimized rendering

### 5. Rive State Machines
**Implementation**: Rive WebGL2 with state machines
**Pattern**:
```typescript
const { RiveComponent, rive } = useRive({
  src,
  autoplay: false,
  stateMachines: 'MainStateMachine'
})

// Play/pause based on visibility
useEffect(() => {
  intersection?.isIntersecting ? rive?.play() : rive?.pause()
}, [intersection, rive])
```

---

## 📐 LAYOUT SYSTEM

### Breakpoints
- **Mobile**: < 800px
- **Desktop**: ≥ 800px

### Grid System
- **Columns**: Configurable via `styles/layout.mjs`
- **Gutters**: Responsive spacing
- **Max Width**: Defined in config

### Spacing Scale
- Base unit: `0.25rem` (4px)
- Scale: Multiples of base (4, 8, 12, 16, 24, 32, 48, 64, etc.)

### Border Radius
- **XS**: 4px
- **SM**: 8px
- **MD**: 12px
- **LG**: 16px
- **XL**: 24px
- **2XL**: 32px
- **Section**: 40px (mobile) / 60px (desktop)

---

## 🎯 PERFORMANCE OPTIMIZATIONS

### Code Splitting
- Dynamic imports for below-fold sections
- Lazy loading of heavy components
- Route-based splitting

### Animation Performance
- Single RAF loop via Tempus
- GPU-accelerated transforms (translate3d, opacity)
- Intersection Observer for viewport detection
- `will-change` used sparingly

### Image Optimization
- Next.js Image component
- WebP format
- Lazy loading
- Responsive sizing

### Bundle Optimization
- Tree shaking
- CSS purging
- Webpack/Turbopack optimization
- Source map analysis

---

## 🔧 DEVELOPMENT TOOLS

### Orchestra (Dev Tools)
**Path**: `orchestra/`
**Features**:
- Grid overlay
- Minimap
- Stats monitor
- Theatre.js studio integration
- Command palette (Cmd+O)

### Biome
**Purpose**: Linting & formatting
**Config**: `biome.json`
**Custom Rules**: `biome-plugins/`

### Lefthook
**Purpose**: Git hooks
**Config**: `lefthook.yml`

---

## 📦 KEY DEPENDENCIES SUMMARY

### Animation & Motion
- gsap@3.13.0
- lenis@1.3.16
- tempus@1.0.0-dev.17
- @theatre/core@0.7.2
- @rive-app/react-webgl2@4.26.2

### 3D & WebGL
- three@0.181.2
- @react-three/fiber@9.4.2
- @react-three/drei@10.7.7
- postprocessing@6.38.0

### UI & Components
- @radix-ui/react-dropdown-menu@2.1.16
- @radix-ui/react-tooltip@1.2.8
- lucide-react@0.560.0
- clsx@2.1.1

### Content & MDX
- @next/mdx@16.1.6
- nextra@4.6.1
- rehype-pretty-code@0.14.1

### State & Hooks
- zustand@5.0.9
- hamo@1.0.0-dev.6

### Styling
- tailwindcss@4.1.18
- @tailwindcss/postcss@4.1.18
- postcss-preset-env@10.5.0

---

## 🎨 VISUAL EFFECTS

### Shadows
- **Teal Glow**: `rgba(127, 255, 195, 0.7)` - Used for emphasis
- **Section Shadows**: Large soft shadows with teal tint
- **Card Shadows**: Subtle elevation

### Patterns
- **Hash Pattern**: Diagonal stripes with dark teal
- **Dashed Borders**: 1px dashed forest green
- **Gradient Masks**: Fade effects on edges

### Hover States
- Button hover: Hash pattern animation
- Link hover: Underline
- Card hover: Shadow increase

### Focus States
- 2px solid outline with contrast color (mint)

---

## 🚀 PERFORMANCE METRICS

### Optimization Strategies
1. **Above-fold priority**: Static imports for hero
2. **Below-fold lazy**: Dynamic imports for sections
3. **RAF consolidation**: Single loop via Tempus
4. **Viewport detection**: Intersection Observer
5. **Asset optimization**: WebP, lazy loading
6. **Code splitting**: Route and component level
7. **CSS optimization**: Purging, minification
8. **Bundle analysis**: Source map explorer

---

## 📝 NOTES

### Design Philosophy
- **Minimalist**: Clean, spacious layouts
- **Tech-forward**: WebGL, advanced animations
- **Performance-first**: Optimized for speed
- **Accessible**: Radix UI, semantic HTML
- **Responsive**: Mobile-first approach

### Animation Philosophy
- **Subtle**: Enhance, don't distract
- **Performant**: GPU-accelerated
- **Purposeful**: Guide user attention
- **Smooth**: High frame rate (60fps)

### Code Philosophy
- **Type-safe**: TypeScript everywhere
- **Modular**: Component-based
- **Maintainable**: Clear structure
- **Documented**: Inline comments
- **Tested**: Quality assurance

---

**Last Updated**: 2025-02-08
**Version**: 1.3.0
**Analyzed By**: Kiro AI Assistant
