'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Play, Square, Zap, Database, Shield, ExternalLink, Send, Loader2, Copy, Check } from 'lucide-react';
import { getMCPServer, startRuntime, stopRuntime } from '@/lib/mcpApi';
import ApiTester from '@/components/mcp/ApiTester';

export default function MCPServerDetail() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.serverId as string;
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [server, setServer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runtimeStatus, setRuntimeStatus] = useState<string>('not_loaded');
  const [showApiTester, setShowApiTester] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  
  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchServer();
  }, [serverId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchServer = async () => {
    try {
      setLoading(true);
      const data = await getMCPServer(serverId);
      setServer(data);
      setRuntimeStatus(data.runtimeStatus || 'not_loaded');
    } catch (error) {
      console.error('Error fetching server:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleStartRuntime = async () => {
    try {
      await startRuntime(serverId);
      setRuntimeStatus('running');
      await fetchServer();
    } catch (error) {
      console.error('Error starting runtime:', error);
    }
  };

  const handleStopRuntime = async () => {
    try {
      await stopRuntime(serverId);
      setRuntimeStatus('stopped');
      await fetchServer();
    } catch (error) {
      console.error('Error stopping runtime:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Server not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/mcp')}
          className="mb-6 flex items-center gap-2 text-purple-300 hover:text-purple-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Servers
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{server.name}</h1>
              <p className="text-purple-200">{server.description}</p>
            </div>
            <div className="flex gap-2">
              {runtimeStatus === 'running' ? (
                <button
                  onClick={handleStopRuntime}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleStartRuntime}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Start
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-purple-200">Status</span>
              </div>
              <div className="text-white font-semibold capitalize">{runtimeStatus}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-blue-400" />
                <span className="text-purple-200">Tools</span>
              </div>
              <div className="text-white font-semibold">{server.tools?.length || 0}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-purple-200">Security</span>
              </div>
              <div className="text-white font-semibold">Enabled</div>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={() => setShowApiTester(!showApiTester)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {showApiTester ? 'Hide' : 'Show'} API Tester
            </button>
          </div>

          {showApiTester && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <ApiTester 
                serverId={serverId}
                apiEndpoint={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/mcp/servers/${serverId}/execute`}
                onClose={() => setShowApiTester(false)}
              />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
