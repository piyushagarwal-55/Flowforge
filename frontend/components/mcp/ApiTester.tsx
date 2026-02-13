'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';

interface ApiTesterProps {
  serverId: string;
  apiEndpoint: string;
  onClose: () => void;
}

export default function ApiTester({ serverId, apiEndpoint, onClose }: ApiTesterProps) {
  const [inputFields, setInputFields] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInputSchema();
  }, [serverId]);

  const fetchInputSchema = async () => {
    try {
      setLoadingSchema(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const ownerId = process.env.NEXT_PUBLIC_OWNER_ID || 'user_default';
      
      const res = await fetch(`${apiUrl}/mcp/servers/${serverId}/tools?ownerId=${ownerId}`);
      const data = await res.json();
      
      // Find the input tool to get the schema
      const inputTool = data.tools.find((t: any) => t.toolId === 'input');
      if (inputTool && inputTool.inputSchema?.variables) {
        setInputFields(inputTool.inputSchema.variables);
        
        // Initialize form data with defaults
        const initial: Record<string, any> = {};
        inputTool.inputSchema.variables.forEach((v: any) => {
          initial[v.name] = v.default || '';
        });
        setFormData(initial);
      } else {
        // Fallback to generic fields
        setInputFields([
          { name: 'email', type: 'string', required: true },
          { name: 'password', type: 'string', required: true }
        ]);
        setFormData({ email: '', password: '' });
      }
    } catch (err) {
      console.error('Failed to fetch schema:', err);
      // Fallback
      setInputFields([
        { name: 'email', type: 'string', required: true },
        { name: 'password', type: 'string', required: true }
      ]);
      setFormData({ email: '', password: '' });
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleTest = async () => {
    try {
      setLoading(true);
      setError(null);
      setResponse(null);
      
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (res.ok) {
        setResponse(data);
      } else {
        setError(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0f0f0f] border border-white/[0.08] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white/90">Test API</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              <X className="text-white/40" size={20} />
            </button>
          </div>

          {/* Endpoint */}
          <div className="mb-4">
            <label className="text-xs font-medium text-white/60 mb-2 block">Endpoint</label>
            <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-lg p-3">
              <code className="text-sm text-emerald-400 font-mono">{apiEndpoint}</code>
            </div>
          </div>

          {/* Dynamic Input Fields */}
          {loadingSchema ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-white/40" size={24} />
            </div>
          ) : (
            <div className="mb-4 space-y-3">
              <label className="text-xs font-medium text-white/60 mb-2 block">Request Data</label>
              {inputFields.map((field) => (
                <div key={field.name}>
                  <label className="text-xs text-white/50 mb-1 block">
                    {field.name}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <input
                    type={field.type === 'password' ? 'password' : 'text'}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    placeholder={field.name}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg p-3 text-sm text-white/90 focus:outline-none focus:border-emerald-500/30"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Test Button */}
          <button
            onClick={handleTest}
            disabled={loading || loadingSchema}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 text-emerald-400 font-medium hover:from-emerald-500/20 hover:to-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Testing...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Request
              </>
            )}
          </button>

          {/* Response */}
          {response && (
            <div>
              <label className="text-xs font-medium text-emerald-400 mb-2 block">✅ Response</label>
              <pre className="bg-[#1a1a1a] border border-emerald-500/20 rounded-lg p-4 overflow-x-auto">
                <code className="text-xs text-white/70 font-mono">{JSON.stringify(response, null, 2)}</code>
              </pre>
            </div>
          )}

          {/* Error */}
          {error && (
            <div>
              <label className="text-xs font-medium text-red-400 mb-2 block">❌ Error</label>
              <pre className="bg-[#1a1a1a] border border-red-500/20 rounded-lg p-4 overflow-x-auto mb-3">
                <code className="text-xs text-red-400/80 font-mono">{error}</code>
              </pre>
              {error.includes('context.vars.input') && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-400/90">
                    💡 This server was created with an older version. Please regenerate it from chat to fix this issue.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
