'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Play, Square, Zap, Database, Shield, ExternalLink, Send, Loader2, Copy, Check } from 'lucide-react';
import { getMCPServer, startRuntime, stopRuntime } from '@/lib/mcpApi';
import ApiTester from '@/components/mcp/ApiTester';

export default function MCPServerDetail() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.serverId as string;
  
  const [server, setServer] = us
  description: string;
  inputSchema: any;
}

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
      setS