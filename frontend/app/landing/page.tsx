"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Zap, MessageSquare, GitBranch, BookOpen, ArrowRight, Sparkles, Play, Terminal, Layers, Shield, Code2, Workflow } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { SectionReveal, RevealItem } from "@/components/landing/SectionReveal";
import { FloatingNodeCard } from "@/components/landing/FloatingNodeCard";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { TypewriterText } from "@/components/landing/TypewriterText";
import { LandingDemo } from "@/components/landing/LandingDemo";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhatFlowForgeSolves } from "@/components/landing/WhatFlowForgeSolves";
import { BuiltForProduction } from "@/components/landing/BuiltForProduction";
import { COLORS, TYPOGRAPHY } from "@/internal/ui-map";

export default function LandingPage() {
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  const scrollToDemo = () => {
    document.getElementById("demo-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]">
      <AmbientBackground />

      {/* ========================================
          HERO SECTION - Calm Authority
          One idea: AI-Native Backend Infrastructure
      ======================================== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 py-20">
        {/* Hero-specific radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.08),transparent_60%)]" />
        
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 max-w-6xl mx-auto"
        >
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-white/70">Built for Tambo Hackathon</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-6 leading-[0.95]"
              >
                AI-Native
                <br />
                <span className="text-white/40">Backend</span>
              </motion.h1>

              {/* Dynamic Subheadline - fixed height to prevent layout shift */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-xl md:text-2xl text-white/50 mb-10 max-w-lg mx-auto lg:mx-0"
              >
                <span>Build production-grade APIs by</span>
                <span className="block h-[1.5em] mt-1">
                  <TypewriterText
                    phrases={["describing them", "conversing", "thinking out loud"]}
                    className="text-emerald-400"
                    typingSpeed={60}
                    pauseDuration={2500}
                  />
                </span>
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex items-center justify-center lg:justify-start gap-4 flex-wrap"
              >
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 0 60px rgba(255,255,255,0.2)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/")}
                  className="group px-8 py-4 rounded-2xl bg-white text-black text-base font-semibold transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center gap-3"
                >
                  Start Building
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.06)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={scrollToDemo}
                  className="px-8 py-4 rounded-2xl bg-white/[0.03] text-white/70 text-base font-medium border border-white/[0.1] hover:border-white/[0.15] transition-all backdrop-blur-xl flex items-center gap-3"
                >
                  <Play size={16} className="text-emerald-400" />
                  Watch Demo
                </motion.button>
              </motion.div>
            </div>

            {/* Right: Tambo-style Workflow Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="hidden lg:block"
            >
              <HeroVisual />
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="text-white/20" size={32} strokeWidth={1.5} />
        </motion.div>
      </section>

      {/* Breathing room */}
      <div className="h-24" />

      {/* ========================================
          PROBLEM SECTION - Backend is Broken
      ======================================== */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionReveal className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-white/95 mb-6">
              Backend Development is <span className="text-red-400">Broken</span>
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              Every API requires the same boilerplate. Every integration demands manual orchestration.
            </p>
          </SectionReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Rigid Frameworks",
                description: "Locked into opinionated structures that force every endpoint into the same pattern.",
                delay: 0,
              },
              {
                title: "Manual Orchestration",
                description: "Connect databases, validate inputs, handle errors — all by hand, every single time.",
                delay: 0.1,
              },
              {
                title: "Zero Explainability",
                description: "Complex codebases become black boxes. Understanding requires reading hundreds of lines.",
                delay: 0.2,
              },
            ].map((problem, i) => (
              <FloatingNodeCard
                key={i}
                icon={<div className="w-6 h-6 rounded-full bg-red-400/20 border-2 border-red-400" />}
                title={problem.title}
                description={problem.description}
                accentColor="red"
                delay={problem.delay}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Breathing room */}
      <div className="h-16" />

      {/* ========================================
          SOLUTION SECTION - FlowForge Changes Everything
      ======================================== */}
      <section className="relative py-40 px-6 overflow-hidden">
        {/* Emerald glow background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(16,185,129,0.06),transparent_50%)]" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <SectionReveal className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
              FlowForge Changes <span className="text-emerald-400">Everything</span>
            </h2>
            <p className="text-xl text-white/50 max-w-3xl mx-auto">
              Describe your backend in plain English. Watch it build itself.
              Every workflow explains itself.
            </p>
          </SectionReveal>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageSquare size={24} />,
                title: "Conversational Creation",
                description: '"Create a login API with JWT" → Complete workflow generated instantly',
              },
              {
                icon: <GitBranch size={24} />,
                title: "Visual Workflows",
                description: "See your backend as an interactive graph. Understand data flow at a glance.",
              },
              {
                icon: <BookOpen size={24} />,
                title: "AI Explainability",
                description: "Security notes, data flow diagrams, step-by-step execution explanations.",
              },
            ].map((feature, i) => (
              <RevealItem key={i} delay={i * 0.15}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="p-8 rounded-2xl bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/30 transition-all"
                >
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6"
                  >
                    <span className="text-emerald-400">{feature.icon}</span>
                  </motion.div>
                  <h3 className="text-lg font-semibold text-white/95 mb-3">{feature.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
                </motion.div>
              </RevealItem>
            ))}
          </div>
        </div>
      </section>

      {/* Breathing room */}
      <div className="h-16" />

      {/* ========================================
          WHAT FLOWFORGE SOLVES - Tambo-style Features
      ======================================== */}
      <WhatFlowForgeSolves />

      {/* Breathing room */}
      <div className="h-16" />

      {/* ========================================
          HOW IT WORKS - Architecture Diagram
      ======================================== */}
      <HowItWorks />

      {/* Breathing room */}
      <div className="h-16" />

      {/* ========================================
          FEATURES SECTION - Built for Production
      ======================================== */}
      <BuiltForProduction />

      {/* Breathing room */}
      <div className="h-16" />

      {/* ========================================
          DEMO SECTION - See It Build (Full Width)
      ======================================== */}
      <section id="demo-section" className="relative py-32 px-6">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_70%)]" />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <SectionReveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Sparkles size={14} className="text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Live Demo</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              See It In Action
            </h2>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              This is not a mockup. FlowForge is running in your browser right now.
            </p>
          </SectionReveal>

          {/* Quick steps - horizontal */}
          <SectionReveal delay={0.2} className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <span className="text-emerald-400 text-xs font-bold">1</span>
              </div>
              <span className="text-sm text-white/70">Describe your API</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <span className="text-emerald-400 text-xs font-bold">2</span>
              </div>
              <span className="text-sm text-white/70">Watch it generate</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <span className="text-emerald-400 text-xs font-bold">3</span>
              </div>
              <span className="text-sm text-white/70">Execute instantly</span>
            </div>
          </SectionReveal>

          {/* Demo container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Glow effects */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-blue-500/20 rounded-2xl blur-xl opacity-60" />
              <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/30 via-transparent to-blue-500/30 rounded-2xl" />
              
              {/* Demo frame */}
              <div className="relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/[0.08]">
                <LandingDemo />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Breathing room */}
      <div className="h-16" />

      {/* ========================================
          FINAL CTA - Portal Moment
      ======================================== */}
      <section className="relative py-48 px-6 overflow-hidden">
        {/* Portal glow effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.08),transparent_60%)]" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <SectionReveal>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8">
              Ready to Build?
            </h2>
            <p className="text-xl text-white/50 mb-12 max-w-xl mx-auto">
              Start building production-grade backends through conversation.
              No credit card required.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 80px rgba(255,255,255,0.25)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/")}
                className="group px-10 py-5 rounded-2xl bg-white text-black text-lg font-semibold transition-all shadow-[0_0_50px_rgba(255,255,255,0.15)] flex items-center gap-3"
              >
                Get Started Free
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <Link href="https://github.com" target="_blank">
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.06)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 rounded-2xl bg-white/[0.03] text-white/80 text-lg font-medium border border-white/[0.12] hover:border-white/[0.2] transition-all"
                >
                  View on GitHub
                </motion.button>
              </Link>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${COLORS.border_primary} py-8 px-6`}>
        <div className="max-w-6xl mx-auto text-center">
          <p className={`${TYPOGRAPHY.body_xs} ${COLORS.text_muted}`}>
            Built for The UI Strikes Back Hackathon • Powered by Tambo AI
          </p>
        </div>
      </footer>
    </div>
  );
}
