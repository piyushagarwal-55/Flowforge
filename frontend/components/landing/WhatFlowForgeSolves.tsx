"use client";

import { useEffect, useRef, useState, useImperativeHandle } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./WhatFlowForgeSolves.module.css";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Feature buttons data with positions (same pattern as Tambo)
const BUTTONS = [
  { title: "Generative Workflows", href: "/", top: 15, left: 8 },
  { title: "Natural Language APIs", href: "/", top: 12, right: 8 },
  { title: "Visual Builder", href: "/", top: 32, left: 5 },
  { title: "AI Explainability", href: "/", top: 28, right: 5 },
  { title: "Real-time Logs", href: "/", top: 50, left: 3 },
  { title: "Auto-Orchestration", href: "/", top: 48, right: 3 },
  { title: "Security Analysis", href: "/", top: 68, left: 6 },
  { title: "Type-Safe Templates", href: "/", top: 65, right: 6 },
  { title: "MCP Support", href: "/", top: 82, left: 12 },
  { title: "One-Click Deploy", href: "/", top: 80, right: 12 },
];

// Background item component (single orb)
function BackgroundItem({
  className,
  opacity = 1,
  hashed,
  borderOpacity,
  size,
  itemRef,
}: {
  className?: string;
  opacity?: number;
  hashed?: boolean;
  borderOpacity?: number;
  size: number;
  itemRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={itemRef}
      className={clsx(
        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full",
        styles.orbItem,
        className
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {/* Inner circle with background */}
      <div
        className="absolute inset-0 rounded-full bg-[#0d0d0d]"
        style={{ opacity }}
      />
      
      {/* Hashed pattern overlay */}
      {hashed && (
        <div
          className={clsx("absolute inset-0 rounded-full", styles.hashed)}
          style={{ opacity: opacity * 0.6 }}
        />
      )}
      
      {/* Dashed border */}
      <div
        className="absolute inset-0 rounded-full border border-dashed border-emerald-500/40"
        style={{ opacity: borderOpacity }}
      />
    </div>
  );
}

export function WhatFlowForgeSolves() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const orbsContainerRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);
  const orb4Ref = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [hasTriggered, setHasTriggered] = useState(false);

  // GSAP ScrollTrigger animation for orbs
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const orbs = [orb1Ref.current, orb2Ref.current, orb3Ref.current, orb4Ref.current].filter(Boolean);
    if (orbs.length === 0 || !sectionRef.current) return;

    // Create scroll-triggered animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top center",
        end: "center center",
        scrub: 1,
        onEnter: () => setHasTriggered(true),
      },
    });

    // Animate orbs from large to smaller sizes
    orbs.forEach((orb, index) => {
      const startSize = 800 + (orbs.length - index) * 200;
      const endSize = 300 + (orbs.length - index) * 120;
      
      gsap.set(orb, {
        width: startSize,
        height: startSize,
      });

      tl.to(orb, {
        width: endSize,
        height: endSize,
        ease: "power2.out",
      }, 0);
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  // Staggered button reveal animation
  useEffect(() => {
    if (!hasTriggered) return;
    
    buttonsRef.current.forEach((btn, index) => {
      if (btn) {
        setTimeout(() => {
          btn.style.opacity = "1";
          btn.style.transform = "scale(1)";
        }, index * 100);
      }
    });
  }, [hasTriggered]);

  return (
    <section
      ref={sectionRef}
      className={clsx("relative py-32 overflow-hidden", styles.section)}
    >
      {/* Orbs container - positioned in background */}
      <div
        ref={orbsContainerRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
      >
        <div className="relative w-full h-full hidden lg:block">
          <BackgroundItem
            itemRef={orb1Ref}
            size={1200}
            opacity={0.3}
            hashed
            borderOpacity={0.15}
          />
          <BackgroundItem
            itemRef={orb2Ref}
            size={950}
            opacity={0.5}
            borderOpacity={0.25}
          />
          <BackgroundItem
            itemRef={orb3Ref}
            size={700}
            opacity={0.7}
            hashed
            borderOpacity={0.35}
          />
          <BackgroundItem
            itemRef={orb4Ref}
            size={450}
            opacity={0.9}
            borderOpacity={0.5}
          />
        </div>
      </div>

      {/* Main content */}
      <div
        ref={contentRef}
        className="relative z-10 min-h-[80vh] flex flex-col items-center justify-center"
      >
        {/* Title section */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-emerald-400/80 uppercase tracking-[0.2em] mb-6">
            FEATURES
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-10 leading-tight">
            What FlowForge <br />
            <span className="text-white/40">solves for you</span>
          </h2>
          
          {/* CTA Button */}
          <Link href="/" className="hidden lg:inline-flex">
            <button className="group px-8 py-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 font-semibold hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all inline-flex items-center gap-3">
              Start Building
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>

        {/* Floating buttons - Desktop */}
        <div className="absolute inset-0 hidden lg:block pointer-events-none">
          {BUTTONS.map((button, index) => (
            <div
              key={button.title}
              ref={(el) => { buttonsRef.current[index] = el }}
              className="absolute pointer-events-auto"
              style={{
                top: `${button.top}%`,
                ...(button.right !== undefined
                  ? { right: `${button.right}%` }
                  : { left: `${button.left}%` }),
                opacity: 0,
                transform: "scale(1.15)",
                transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
              }}
            >
              <Link href={button.href}>
                <button className="px-4 py-2.5 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/[0.1] text-white/80 text-sm font-medium hover:bg-white/[0.1] hover:border-white/[0.2] transition-all shadow-xl whitespace-nowrap">
                  {button.title}
                </button>
              </Link>
            </div>
          ))}
        </div>

        {/* Mobile feature list */}
        <div className="lg:hidden w-full max-w-md px-4 mt-8 space-y-2">
          {BUTTONS.map((button) => (
            <Link key={button.title} href={button.href} className="block">
              <button className="w-full px-5 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/80 text-sm font-medium hover:bg-white/[0.08] transition-all flex items-center justify-between">
                {button.title}
                <ArrowRight size={16} className="text-emerald-400" />
              </button>
            </Link>
          ))}
          <Link href="/" className="block pt-4">
            <button className="w-full py-4 rounded-xl bg-white text-black font-semibold">
              Start Building
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
