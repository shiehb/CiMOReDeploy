import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X, Send, MessageCircle, Loader2, AlertCircle,
  Paperclip, FileText, Image as ImageIcon, Download,
  XCircle, Check, WifiOff, RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API } from '../config/api';

// ─── Constants ───────────────────────────────────────────────────────────────
const ACCEPTED_TYPES  = '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.mp4,.mov';
const MAX_FILE_MB     = 10;
const SEND_TIMEOUT    = 15_000;
const GROUP_WINDOW_MS = 5 * 60 * 1000;

// ─── Pure helpers ────────────────────────────────────────────────────────────
const isImage     = (name = '') => /\.(jpe?g|png|gif|webp)$/i.test(name);
const genTempId   = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const lsKey       = (rid) => (rid ? `cimore_pending_${rid}` : null);
const readPending = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
const savePending = (key, arr) => { if (key) localStorage.setItem(key, JSON.stringify(arr)); };
const dropPending = (key, tempId) => savePending(key, readPending(key).filter(m => m.client_temp_id !== tempId));

const mergeMessages = (serverMsgs, prevMsgs) => {
  const confirmed = new Set(serverMsgs.map(m => m.client_temp_id).filter(Boolean));
  const unresolved = prevMsgs.filter(
    m => m._optimistic && m.client_temp_id && !confirmed.has(m.client_temp_id)
  );
  return [
    ...serverMsgs.map(m => ({ ...m, _localStatus: 'sent' })),
    ...unresolved,
  ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
};

// ─── Visual helpers ──────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  '#1072b3', '#e91e63', '#9c27b0', '#673ab7',
  '#2196f3', '#00bcd4', '#009688', '#4caf50', '#ff9800', '#f44336',
];
const avatarColor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
};
const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';

const formatSep = (iso) => {
  try {
    const d   = new Date(iso);
    const now = new Date();
    const sod = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const t   = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' });
    const gap = sod(now) - sod(d);
    if (gap === 0)           return `Today at ${t}`;
    if (gap === 86_400_000)  return `Yesterday at ${t}`;
    return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ` at ${t}`;
  } catch { return ''; }
};

const formatTs = (msg) => {
  const s = msg._localStatus;
  if (s === 'sending') return 'Sending…';
  if (s === 'queued')  return 'Queued — will send when online';
  if (s === 'failed')  return 'Failed · tap ! to retry';
  try {
    const diff = Math.floor((Date.now() - new Date(msg.created_at)) / 1000);
    if (diff < 30)    return 'Just now';
    if (diff < 90)    return '1 min ago';
    const mins = Math.floor(diff / 60);
    if (diff < 3600)  return `${mins} mins ago`;
    const hrs = Math.floor(diff / 3600);
    if (diff < 7200)  return '1 hr ago';
    if (diff < 86400) return `${hrs} hrs ago`;
    const d = new Date(msg.created_at);
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const t = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === yest.toDateString()) return `Yesterday at ${t}`;
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric' }) + ` at ${t}`;
  } catch { return ''; }
};

const bubbleRadius = (isMine, isFirst, isLast) => {
  if (isFirst && isLast) return 'rounded-2xl';
  if (isMine) {
    if (isFirst) return 'rounded-2xl rounded-br-sm';
    if (isLast)  return 'rounded-2xl rounded-tr-sm';
    return 'rounded-2xl rounded-tr-sm rounded-br-sm';
  }
  if (isFirst) return 'rounded-2xl rounded-bl-sm';
  if (isLast)  return 'rounded-2xl rounded-tl-sm';
  return 'rounded-2xl rounded-tl-sm rounded-bl-sm';
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const TimeSep = ({ iso }) => (
  <div className="flex items-center gap-3 my-4 px-2">
    <div className="flex-1 h-px bg-slate-100" />
    <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">
      {formatSep(iso)}
    </span>
    <div className="flex-1 h-px bg-slate-100" />
  </div>
);

const StatusDot = ({ status, isLastOwn, onRetry }) => {
  if (status === 'sending')
    return <Loader2 className="w-3 h-3 animate-spin text-slate-400 shrink-0" />;
  if (status === 'failed')
    return (
      <button type="button" onClick={onRetry} title="Tap to retry"
        className="cursor-pointer shrink-0 hover:scale-110 transition-transform">
        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
      </button>
    );
  if (status === 'queued')
    return <Check className="w-3 h-3 text-slate-400 shrink-0" />;
  if (status === 'sent' && isLastOwn)
    return <Check className="w-3 h-3 text-[#0084FF] shrink-0" />;
  return null;
};

const FileChip = ({ name, onRemove }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0084FF]/10 border border-[#0084FF]/20 rounded-lg max-w-full">
    {isImage(name)
      ? <ImageIcon className="w-3.5 h-3.5 text-[#0084FF] shrink-0" />
      : <FileText  className="w-3.5 h-3.5 text-[#0084FF] shrink-0" />}
    <span className="text-[10px] font-bold text-[#0084FF] truncate max-w-[180px]">{name}</span>
    {onRemove && (
      <button type="button" onClick={onRemove}
        className="cursor-pointer text-[#0084FF]/60 hover:text-red-500 transition-colors shrink-0">
        <XCircle className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

const BubbleAttachment = ({ url, name, isMine }) => {
  if (!url) return null;
  const n = name || url.split('/').pop();
  if (isImage(n)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img src={url} alt={n}
          className="max-w-[220px] max-h-[180px] rounded-xl object-cover shadow-sm hover:opacity-90 transition-opacity" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" download={n}
      className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg transition-colors group max-w-[220px] ${
        isMine
          ? 'bg-white/20 hover:bg-white/30 text-white'
          : 'bg-slate-300/60 hover:bg-slate-300 text-[#050505]'
      }`}>
      <FileText className="w-4 h-4 shrink-0" />
      <span className="text-[11px] font-bold truncate flex-1">{n}</span>
      <Download className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
    </a>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const ChatSheet = ({ open, onClose, requestId, requestTitle }) => {
  const [messages,     setMessages]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [text,         setText]         = useState('');
  const [inputError,   setInputError]   = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isOnline,     setIsOnline]     = useState(navigator.onLine);
  const [syncing,      setSyncing]      = useState(false);
  const [expandedId,   setExpandedId]   = useState(null); 

  const bottomRef    = useRef(null);
  const pollRef      = useRef(null);
  const textareaRef  = useRef(null);
  const fileInputRef = useRef(null);
  const sendGuard    = useRef(false);
  const flushRef     = useRef(null);

  const myName = localStorage.getItem('userFullName') || '';
  const key    = lsKey(requestId);

  // ── Enrich messages with Messenger grouping metadata ───────────────────────
  const enriched = useMemo(() => {
    const result = messages.map((m, i) => {
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const prevSame = prev && prev.sender_name === m.sender_name &&
        new Date(m.created_at) - new Date(prev.created_at) < GROUP_WINDOW_MS;
      const nextSame = next && next.sender_name === m.sender_name &&
        new Date(next.created_at) - new Date(m.created_at) < GROUP_WINDOW_MS;
      return {
        ...m,
        _isFirst: !prevSame,
        _isLast:  !nextSame,
        _showSep: !!prev && new Date(m.created_at) - new Date(prev.created_at) >= GROUP_WINDOW_MS,
      };
    });
    for (let i = result.length - 1; i >= 0; i--) {
      if (result[i].sender_name === myName) {
        result[i] = { ...result[i], _isLastOwn: true };
        break;
      }
    }
    return result;
  }, [messages, myName]);

  // Derive the other participant from message history for the header
  const otherParty = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender_name && messages[i].sender_name !== myName)
        return messages[i].sender_name;
    }
    return null;
  }, [messages, myName]);

  const fetchMessages = useCallback(async () => {
    if (!requestId) return;
    const token = localStorage.getItem('authToken');
    try {
      const res = await fetch(`${API}/api/communications/?request_id=${requestId}`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) return;
      const serverMsgs = await res.json();
      if (!Array.isArray(serverMsgs)) return;

      if (key) {
        const confirmed = new Set(serverMsgs.map(m => m.client_temp_id).filter(Boolean));
        savePending(key, readPending(key).filter(p => !confirmed.has(p.client_temp_id)));
      }
      setMessages(prev => mergeMessages(serverMsgs, prev));
    } catch { /* silent — optimistic messages stay visible */ }
  }, [requestId, key]);

  useEffect(() => {
    if (!open || !requestId) {
      setMessages([]);
      setText('');
      setInputError('');
      setSelectedFile(null);
      setExpandedId(null);
      return;
    }
    if (key) {
      const pending = readPending(key);
      if (pending.length > 0)
        setMessages(pending.map(m => ({ ...m, _optimistic: true, _localStatus: m._localStatus || 'queued' })));
    }
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));
    pollRef.current = setInterval(fetchMessages, 30_000);
    return () => clearInterval(pollRef.current);
  }, [open, requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 350);
  }, [open]);

  const sendToServer = useCallback(async (msg) => {
    const token = localStorage.getItem('authToken');
    const fd = new FormData();
    fd.append('sender_name',     msg.sender_name);
    fd.append('message',         msg.message || '');
    fd.append('related_request', requestId);
    fd.append('status',          'Pending');
    fd.append('client_temp_id',  msg.client_temp_id);
    if (msg._file) {
      fd.append('file',      msg._file);
      fd.append('file_name', msg._file.name);
    }
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SEND_TIMEOUT);
    try {
      const res = await fetch(`${API}/api/communications/`, {
        method:  'POST',
        headers: { Authorization: `Token ${token}` },
        body:    fd,
        signal:  ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const confirmed = await res.json();
      if (msg.file_url?.startsWith('blob:')) URL.revokeObjectURL(msg.file_url);
      setMessages(prev => prev.map(m =>
        m.client_temp_id === msg.client_temp_id ? { ...confirmed, _localStatus: 'sent' } : m
      ));
      if (!msg._file) dropPending(key, msg.client_temp_id);
    } catch (err) {
      clearTimeout(timer);
      const newStatus = (!navigator.onLine || err.name === 'AbortError') ? 'queued' : 'failed';
      setMessages(prev => prev.map(m =>
        m.client_temp_id === msg.client_temp_id ? { ...m, _localStatus: newStatus } : m
      ));
      if (!msg._file && key) {
        savePending(key, readPending(key).map(p =>
          p.client_temp_id === msg.client_temp_id ? { ...p, _localStatus: newStatus } : p
        ));
      }
    }
  }, [requestId, key]);

  const flushPending = useCallback(async () => {
    if (!key || !navigator.onLine) return;
    const queue = readPending(key);
    if (queue.length === 0) return;
    setSyncing(true);
    for (const msg of queue) {
      setMessages(prev => prev.map(m =>
        m.client_temp_id === msg.client_temp_id ? { ...m, _localStatus: 'sending' } : m
      ));
      await sendToServer(msg);
    }
    setSyncing(false);
    fetchMessages();
  }, [key, sendToServer, fetchMessages]);

  useEffect(() => { flushRef.current = flushPending; }, [flushPending]);

  useEffect(() => {
    const handleOnline  = () => { setIsOnline(true);  flushRef.current?.(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (sendGuard.current) return;
    const trimmed      = text.trim();
    const capturedFile = selectedFile;
    if (!trimmed && !capturedFile) return;
    if (!requestId) return;

    sendGuard.current = true;
    setInputError('');

    const tempId = genTempId();
    const now    = new Date().toISOString();
    const optimistic = {
      client_temp_id: tempId,
      sender_name:    myName,
      message:        trimmed,
      file_url:       capturedFile ? URL.createObjectURL(capturedFile) : null,
      file_name:      capturedFile?.name || '',
      created_at:     now,
      _optimistic:    true,
      _localStatus:   'sending',
      _file:          capturedFile,
    };

    setMessages(prev => [...prev, optimistic]);
    setText('');
    setSelectedFile(null);
    sendGuard.current = false;

    if (!capturedFile && key) {
      savePending(key, [...readPending(key), {
        client_temp_id: tempId, sender_name: myName, message: trimmed,
        created_at: now, _optimistic: true, _localStatus: 'sending',
      }]);
    }

    if (!navigator.onLine) {
      setMessages(prev => prev.map(m =>
        m.client_temp_id === tempId ? { ...m, _localStatus: 'queued' } : m
      ));
      if (!capturedFile && key) {
        savePending(key, readPending(key).map(p =>
          p.client_temp_id === tempId ? { ...p, _localStatus: 'queued' } : p
        ));
      }
      return;
    }

    sendToServer({ ...optimistic, _file: capturedFile });
  };

  const retryMessage = useCallback((msg) => {
    setMessages(prev => prev.map(m =>
      m.client_temp_id === msg.client_temp_id ? { ...m, _localStatus: 'sending' } : m
    ));
    if (!msg._file && key) {
      const existing = readPending(key).find(p => p.client_temp_id === msg.client_temp_id);
      if (!existing) {
        savePending(key, [...readPending(key), {
          client_temp_id: msg.client_temp_id, sender_name: msg.sender_name,
          message: msg.message, created_at: msg.created_at, _optimistic: true, _localStatus: 'sending',
        }]);
      }
    }
    sendToServer(msg);
  }, [key, sendToServer]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setInputError(`File must be under ${MAX_FILE_MB} MB.`);
      return;
    }
    setInputError('');
    setSelectedFile(f);
    e.target.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  };

  const canSend = !!(text.trim() || selectedFile);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div key="chat-bd"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[120] backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div key="chat-panel"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[999] shadow-2xl flex flex-col"
          >
            {/* ── Messenger Chat Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar with live status dot */}
                <div className="relative shrink-0 select-none">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: avatarColor(otherParty || requestTitle || 'Chat') }}>
                    {initials(otherParty || requestTitle || 'Chat')}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white transition-colors ${
                      isOnline ? 'bg-green-400' : 'bg-slate-300'
                    }`}
                  />
                </div>

                {/* Name, status line, request subtitle */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h2 className="text-[14px] font-bold text-slate-900 leading-tight truncate">
                      {otherParty || requestTitle || `Request #${requestId}`}
                    </h2>
                    {syncing && <RefreshCw className="w-3 h-3 animate-spin text-[#1072b3] shrink-0" />}
                  </div>
                  <p className={`text-[11px] font-medium leading-tight flex items-center gap-1 ${
                    isOnline ? 'text-green-500' : 'text-amber-500'
                  }`}>
                    {isOnline
                      ? 'Active now'
                      : <><WifiOff className="w-2.5 h-2.5 shrink-0" /> Offline — messages queued</>
                    }
                  </p>
                  {otherParty && (
                    <p className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                      {requestTitle || `Request #${requestId}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button onClick={onClose}
                className="cursor-pointer p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all outline-none shrink-0"
                title="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Message list ── */}
            <div className="flex-1 overflow-y-auto px-3 py-4 bg-white">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-[#1072b3]" />
                </div>
              ) : enriched.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-[13px] font-semibold text-slate-400">No messages yet</p>
                  <p className="text-[11px] text-slate-300 max-w-[200px]">Start the conversation below.</p>
                </div>
              ) : (
                <>
                  {enriched.map((msg) => {
                    const isMine   = msg.sender_name === myName;
                    const status   = msg._localStatus || 'sent';
                    const isFailed = status === 'failed';
                    const displayFileUrl  = msg._file ? msg.file_url : (msg.file_url || null);
                    const displayFileName = msg._file ? msg._file.name : (msg.file_name || '');
                    const msgId    = msg.client_temp_id || msg.id;
                    const isExpanded  = expandedId === msgId;
                    const radius   = bubbleRadius(isMine, msg._isFirst, msg._isLast);
                    const showStatus = status !== 'sent' || !!msg._isLastOwn;

                    return (
                      <React.Fragment key={msgId}>
                        {msg._showSep && <TimeSep iso={msg.created_at} />}

                        <div className={`flex items-end gap-1.5 ${isMine ? 'justify-end' : 'justify-start'} ${
                          msg._isLast ? 'mb-3' : 'mb-[3px]'
                        }`}>

                          {!isMine && (
                            <div className="w-8 h-8 shrink-0 self-end mb-0.5">
                              {msg._isLast && (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold select-none"
                                  style={{ backgroundColor: avatarColor(msg.sender_name) }}>
                                  {initials(msg.sender_name)}
                                </div>
                              )}
                            </div>
                          )}

                          <div className={`flex flex-col max-w-[72%] ${isMine ? 'items-end' : 'items-start'}`}>
                            {!isMine && msg._isFirst && (
                              <span className="text-[11px] font-semibold text-slate-500 px-2 mb-1 leading-none">
                                {msg.sender_name}
                              </span>
                            )}

                            <div
                              onClick={() => setExpandedId(isExpanded ? null : msgId)}
                              className={`px-4 py-2.5 text-sm leading-relaxed select-text cursor-pointer active:opacity-80 transition-opacity ${radius} ${
                                isMine
                                  ? `bg-[#0084FF] text-white${isFailed ? ' opacity-60' : ''}`
                                  : 'bg-[#E4E6EB] text-[#050505]'
                              }`}>
                              {msg.message && (
                                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                              )}
                              {(displayFileUrl || msg._file) && (
                                <BubbleAttachment
                                  url={displayFileUrl}
                                  name={displayFileName}
                                  isMine={isMine}
                                />
                              )}
                            </div>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div key="ts"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="overflow-hidden">
                                  <span className={`text-[10px] font-medium px-1 pt-1 block ${
                                    isFailed ? 'text-red-500' : status === 'queued' ? 'text-amber-500' : 'text-slate-400'
                                  }`}>
                                    {formatTs(msg)}
                                  </span>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {isMine && showStatus && (
                              <div className="flex items-center justify-end h-4 mt-0.5 pr-0.5">
                                <StatusDot
                                  status={status}
                                  isLastOwn={!!msg._isLastOwn}
                                  onRetry={() => retryMessage(msg)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* ── Input area ── */}
            <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
              {inputError && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <p className="text-[10px] text-red-600 font-bold">{inputError}</p>
                </div>
              )}

              {selectedFile && (
                <div className="mb-2">
                  <FileChip name={selectedFile.name} onRemove={() => setSelectedFile(null)} />
                </div>
              )}

              <form onSubmit={handleSend} className="flex items-end gap-2">
                <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES}
                  onChange={handleFileChange} className="hidden" />

                <button type="button" onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                  className="cursor-pointer w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:bg-[#0084FF]/10 hover:text-[#0084FF] flex items-center justify-center transition-colors shrink-0 mb-0.5">
                  <Paperclip className="w-4 h-4" />
                </button>

                <textarea ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedFile ? 'Add a caption… (optional)' : 'Aa'}
                  rows={1}
                  className="flex-1 resize-none bg-[#F0F2F5] border-none rounded-2xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0084FF]/20 transition-all leading-relaxed min-h-[38px] max-h-[120px] overflow-y-auto"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                />

                <button type="submit" disabled={!canSend}
                  className="cursor-pointer w-9 h-9 rounded-full bg-[#0084FF] text-white flex items-center justify-center hover:bg-[#0073e0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 mb-0.5">
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <p className="text-[9px] text-slate-300 mt-1.5 text-center font-medium select-none">
                Shift + Enter for new line · Max {MAX_FILE_MB} MB per file
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatSheet;