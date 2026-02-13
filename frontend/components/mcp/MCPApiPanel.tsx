'use client';

import { motion } from 'framer-motion';
import { Copy, Check, ExternalLink, Code, Terminal } from 'lucide-react';
import { useState } from 'react';

interface MCPApiPanelProps {
  serverId: string;
  apiEndpoint: string;
  exampleCurl: string;
  exampleFetch: string;
}

export default function MCPApiPanel({ serverId, apiEndpoint, exampleCurl, exampleFetch }: MCPApiPanelProps) {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedFetch, setCopiedFetch] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  const handleCopy = async (text: string, type: 'curl' | 'fetch' | 'endpoint') => {
    await navigator.clipboard.writeText(text);
    
    if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else if (type === 'fetch') {
      setCopiedFetch(true);
      setTimeout(() => setCopiedFetch(false), 2000);
    } else {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-white/[0.08] rounded-xl p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
          <ExternalLink className="text-emerald-400" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white/90">Your Live API</h3>
          <p className="text-sm text-white/50">Ready to use from any frontend or curl</p>
        </div>
      </div>

      {/* API Endpoint */}
      <div className="mb-6">
        <label className="text-xs font-medium text-white/60 mb-2 block">API Endpoint</label>
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
          <div className="relative bg-[#1a1a1a] border border-white/[0.08] rounded-lg p-3 flex items-center justify-between">
            <code className="text-sm text-emerald-400 font-mono flex-1 truncate">{apiEndpoint}</code>
            <button
              onClick={() => handleCopy(apiEndpoint, 'endpoint')}
              className="ml-3 p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              {copiedEndpoint ? (
                <Check className="text-emerald-400" size={16} />
              ) : (
                <Copy className="text-white/40" size={16} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* cURL Example */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-white/60 flex items-center gap-2">
            <Terminal size={14} />
            cURL Example
          </label>
          <button
            onClick={() => handleCopy(exampleCurl, 'curl')}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
          >
            {copiedCurl ? (
              <>
                <Check size={12} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={12} />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
          <pre className="relative bg-[#1a1a1a] border border-white/[0.08] rounded-lg p-4 overflow-x-auto">
            <code className="text-xs text-white/70 font-mono">{exampleCurl}</code>
          </pre>
        </div>
      </div>

      {/* JavaScript Fetch Example */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-white/60 flex items-center gap-2">
            <Code size={14} />
            JavaScript Fetch
          </label>
          <button
            onClick={() => handleCopy(exampleFetch, 'fetch')}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
          >
            {copiedFetch ? (
              <>
                <Check size={12} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={12} />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
          <pre className="relative bg-[#1a1a1a] border border-white/[0.08] rounded-lg p-4 overflow-x-auto">
            <code className="text-xs text-white/70 font-mono">{exampleFetch}</code>
          </pre>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-400/80">
          💡 This API is live and ready to use. No manual deployment needed. Call it from any frontend, mobile app, or command line.
        </p>
      </div>
    </motion.div>
  );
}
