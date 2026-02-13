'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { X, Play, Sparkles } from 'lucide-react';

interface RunWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRun: (input: Record<string, any>) => void;
  isRunning?: boolean;
  inputSchema?: any;
}

export default function RunWorkflowModal({
  isOpen,
  onClose,
  onRun,
  isRunning = false,
  inputSchema,
}: RunWorkflowModalProps) {
  const [inputValues, setInputValues] = useState<Record<string, any>>({});

  // Extract input fields from the first node (User Input node)
  const getInputFields = () => {
    if (!inputSchema || !inputSchema.properties) {
      // Default fields for MCP workflows
      return [
        { name: 'email', type: 'string', required: true },
        { name: 'password', type: 'string', required: true },
        { name: 'name', type: 'string', required: false },
      ];
    }

    return Object.entries(inputSchema.properties).map(([key, schema]: [string, any]) => ({
      name: key,
      type: schema.type || 'string',
      required: inputSchema.required?.includes(key) || false,
    }));
  };

  const fields = getInputFields();

  const handleSubmit = () => {
    // Validate required fields
    const missingFields = fields
      .filter(f => f.required && !inputValues[f.name])
      .map(f => f.name);

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    onRun(inputValues);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md bg-[#0f0f0f]/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/[0.06] pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 py-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/[0.09] to-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center border border-white/[0.06]">
                    <Sparkles size={18} className="text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white/95 tracking-tight">
                      Run Workflow
                    </h2>
                    <p className="text-xs text-white/45 mt-0.5">
                      Provide input values to execute
                    </p>
                  </div>
                  {!isRunning && (
                    <button
                      onClick={onClose}
                      className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-all duration-200"
                    >
                      <X size={16} className="text-white/50" />
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-4">
                {fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <label className="block text-xs font-medium text-white/70">
                      {field.name}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    <input
                      type={field.type === 'password' ? 'password' : 'text'}
                      value={inputValues[field.name] || ''}
                      onChange={(e) =>
                        setInputValues({ ...inputValues, [field.name]: e.target.value })
                      }
                      onKeyDown={handleKeyDown}
                      placeholder={`Enter ${field.name}`}
                      disabled={isRunning}
                      className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl 
                        text-sm text-white placeholder-white/30 
                        focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.04]
                        shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200"
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-white/[0.06] flex gap-2">
                <button
                  onClick={onClose}
                  disabled={isRunning}
                  className="flex-1 px-3 py-2.5 text-xs font-medium text-white/60 
                    bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08]
                    rounded-xl transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isRunning}
                  className="flex-1 px-3 py-2.5 text-xs font-semibold text-black 
                    bg-white hover:bg-white/95 rounded-xl 
                    flex items-center justify-center gap-2
                    shadow-[0_1px_3px_rgba(0,0,0,0.3)]
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play size={14} fill="black" />
                      Run Workflow
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
