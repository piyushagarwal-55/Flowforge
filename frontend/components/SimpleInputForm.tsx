'use client';

import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

interface SimpleInputFormProps {
  onSubmit: (values: Record<string, any>) => void;
  isSubmitting?: boolean;
}

export default function SimpleInputForm({ onSubmit, isSubmitting = false }: SimpleInputFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        email,
        password,
        name: name || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white/95 mb-2">User Information</h3>
        <p className="text-sm text-white/50">Fill in the details to create a new user</p>
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/70">
          Email Address
          <span className="text-red-400 ml-1">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Mail className={`${focusedField === 'email' ? 'text-emerald-400' : 'text-white/40'} transition-colors`} size={18} />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) {
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.email;
                  return newErrors;
                });
              }
            }}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            placeholder="user@example.com"
            className={`w-full pl-12 pr-4 py-3 bg-[#0f0f0f]/60 backdrop-blur-xl border rounded-xl text-white/90 placeholder-white/30 focus:outline-none transition-all ${
              errors.email
                ? 'border-red-500/50 focus:border-red-500'
                : focusedField === 'email'
                ? 'border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20'
                : 'border-white/[0.08] hover:border-white/[0.12]'
            }`}
          />
        </div>
        {errors.email && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs text-red-400"
          >
            <AlertCircle size={14} />
            {errors.email}
          </motion.div>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/70">
          Password
          <span className="text-red-400 ml-1">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Lock className={`${focusedField === 'password' ? 'text-emerald-400' : 'text-white/40'} transition-colors`} size={18} />
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) {
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.password;
                  return newErrors;
                });
              }
            }}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            placeholder="Minimum 8 characters"
            className={`w-full pl-12 pr-4 py-3 bg-[#0f0f0f]/60 backdrop-blur-xl border rounded-xl text-white/90 placeholder-white/30 focus:outline-none transition-all ${
              errors.password
                ? 'border-red-500/50 focus:border-red-500'
                : focusedField === 'password'
                ? 'border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20'
                : 'border-white/[0.08] hover:border-white/[0.12]'
            }`}
          />
        </div>
        {errors.password && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs text-red-400"
          >
            <AlertCircle size={14} />
            {errors.password}
          </motion.div>
        )}
      </div>

      {/* Name Field (Optional) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/70">
          Full Name
          <span className="text-white/30 ml-1 text-xs">(optional)</span>
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <User className={`${focusedField === 'name' ? 'text-emerald-400' : 'text-white/40'} transition-colors`} size={18} />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            placeholder="John Doe"
            className={`w-full pl-12 pr-4 py-3 bg-[#0f0f0f]/60 backdrop-blur-xl border rounded-xl text-white/90 placeholder-white/30 focus:outline-none transition-all ${
              focusedField === 'name'
                ? 'border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20'
                : 'border-white/[0.08] hover:border-white/[0.12]'
            }`}
          />
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold hover:from-emerald-600 hover:to-blue-600 disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 disabled:cursor-not-allowed transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            Submitting...
          </>
        ) : (
          'Continue →'
        )}
      </motion.button>
    </form>
  );
}
