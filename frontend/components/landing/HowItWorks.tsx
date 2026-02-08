"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, Cpu, Zap, Database, Code } from "lucide-react";
import Link from "next/link";

export function HowItWorks() {
  return (
    <section className="relative py-40 px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.06),transparent_70%)]" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Title Block */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-20"
        >
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-6">
            How It Works
          </p>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
            The missing layer <br /> between conversation and infrastructure
          </h2>
          <Link href="https://github.com/yourusername/flowforge" target="_blank">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl bg-white/[0.05] text-white/80 font-semibold border-2 border-white/[0.1] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all backdrop-blur-xl inline-flex items-center gap-2"
            >
              Learn More
              <ArrowRight size={18} />
            </motion.button>
          </Link>
        </motion.div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Outer glow */}
          <div className="absolute -inset-8 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent rounded-3xl blur-3xl" />
          
          <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-12 md:p-16">
            {/* Desktop Layout */}
            <div className="hidden md:block">
              <div className="flex items-center justify-between gap-8">
                {/* Step 1: User Input */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="flex-1"
                >
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-blue-500/5 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 hover:border-blue-500/30 transition-all">
                      <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                        <MessageSquare className="text-blue-400" size={28} />
                      </div>
                      <h3 className="text-xl font-semibold text-white/95 mb-3">1. Natural Language</h3>
                      <p className="text-sm text-white/60 leading-relaxed mb-4">
                        Describe your backend in plain English
                      </p>
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                        <p className="text-xs text-white/70 font-mono">
                          "Create a signup API with email validation"
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Arrow */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <ArrowRight className="text-emerald-400/50" size={32} />
                </motion.div>

                {/* Step 2: FlowForge Processing */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="flex-1"
                >
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 hover:border-emerald-500/30 transition-all">
                      <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                        <Cpu className="text-emerald-400" size={28} />
                      </div>
                      <h3 className="text-xl font-semibold text-white/95 mb-3">2. AI Generation</h3>
                      <p className="text-sm text-white/60 leading-relaxed mb-4">
                        FlowForge generates workflow nodes
                      </p>
                      <div className="space-y-2">
                        {["Input", "Validate", "Database", "Response"].map((step, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.8 + i * 0.1 }}
                            className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg p-2"
                          >
                            <div className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                              <span className="text-[10px] font-semibold text-emerald-400">{i + 1}</span>
                            </div>
                            <span className="text-xs text-white/70">{step}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Arrow */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.2 }}
                >
                  <ArrowRight className="text-emerald-400/50" size={32} />
                </motion.div>

                {/* Step 3: Production API */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.4 }}
                  className="flex-1"
                >
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 via-purple-500/5 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 hover:border-purple-500/30 transition-all">
                      <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                        <Zap className="text-purple-400" size={28} />
                      </div>
                      <h3 className="text-xl font-semibold text-white/95 mb-3">3. Production API</h3>
                      <p className="text-sm text-white/60 leading-relaxed mb-4">
                        Deploy instantly with full observability
                      </p>
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                        <p className="text-xs text-emerald-400 font-mono mb-1">
                          POST /api/signup
                        </p>
                        <p className="text-[10px] text-white/40 font-mono">
                          Status: 200 OK
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden space-y-6">
              {[
                {
                  icon: MessageSquare,
                  title: "1. Natural Language",
                  description: "Describe your backend in plain English",
                  example: '"Create a signup API"',
                  delay: 0.2,
                },
                {
                  icon: Cpu,
                  title: "2. AI Generation",
                  description: "FlowForge generates workflow nodes",
                  example: "Input → Validate → DB → Response",
                  delay: 0.4,
                },
                {
                  icon: Zap,
                  title: "3. Production API",
                  description: "Deploy instantly with full observability",
                  example: "POST /api/signup",
                  delay: 0.6,
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: step.delay }}
                  className="relative group"
                >
                  <div className="relative bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                      <step.icon className="text-emerald-400" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-white/95 mb-2">{step.title}</h3>
                    <p className="text-sm text-white/60 leading-relaxed mb-3">
                      {step.description}
                    </p>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                      <p className="text-xs text-white/70 font-mono">{step.example}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.6 }}
              className="mt-12 pt-12 border-t border-white/[0.06]"
            >
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: Database,
                    title: "Auto-Orchestration",
                    description: "Connects databases, APIs, and services automatically",
                  },
                  {
                    icon: Code,
                    title: "Type-Safe",
                    description: "Generated workflows are fully typed and validated",
                  },
                  {
                    icon: Zap,
                    title: "Real-Time Logs",
                    description: "Stream execution logs and debug in production",
                  },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.8 + i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <feature.icon className="text-white/60" size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white/90 mb-1">{feature.title}</h4>
                      <p className="text-xs text-white/50 leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
