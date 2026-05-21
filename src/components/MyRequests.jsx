import React, { useState, useEffect, useRef } from 'react';
import { Search, ExternalLink, Loader2, AlertCircle, Filter, ChevronDown, FileText, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { API, authHeaders } from '../config/api';

const THEME = {
  primary: '#1072b3',
  secondary: '#03396c',
  accent: '#f6ce11',
  bg: '#F5F7FA',
};

const STATUS_STYLES = {
  Pending:  'bg-amber-50 text-amber-600 border-amber-100',
  Approved: 'bg-green-50 text-green-600 border-green-100',
  Rejected: 'bg-red-50 text-red-600 border-red-100',
};

const STATUS_DOT = {
  Pending:  'bg-amber-500',
  Approved: 'bg-green-500',
  Rejected: 'bg-red-500',
};

const STATUS_ORDER   = { Pending: 0, Approved: 1, Rejected: 2 };
const ALL_STATUSES   = ['Pending', 'Approved', 'Rejected'];
const SHOWN_STATUSES = new Set(ALL_STATUSES);

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '';

const MyRequests = ({ onViewDetail, onOpenChat }) => {
  const [requests, setRequests]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');
  const [search, setSearch]                   = useState('');
  const [filterStatuses, setFilterStatuses]   = useState(new Set());
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [pageSize, setPageSize]               = useState(10);
  const [currentPage, setCurrentPage]         = useState(1);

  const filterRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target))
        setShowFilterPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API}/api/marketing/`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRequests(await res.json());
    } catch (err) {
      setError(`Failed to load requests: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const toggleStatus = (status) => {
    setFilterStatuses(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const filtered = requests
    .filter((r) => {
      if (!SHOWN_STATUSES.has(r.status)) return false;
      const q = search.toLowerCase();
      const matchesSearch =
        (r.title || r.type).toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q);
      const matchesStatus = filterStatuses.size === 0 || filterStatuses.has(r.status);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3));

  const totalPages        = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedRequests = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setCurrentPage(1); }, [search, filterStatuses, pageSize]);

  const filterLabel = filterStatuses.size === 0
    ? 'All Statuses'
    : [...filterStatuses].join(', ');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-secondary uppercase tracking-tight">My Past Requests</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">History of all marketing requests you have submitted.</p>
        </div>
        {onOpenChat && (
          <button
            onClick={() => onOpenChat(null, 'My Requests', requests)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border-2 border-transparent rounded-lg bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] group outline-none cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Open Chat</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs font-black uppercase tracking-widest text-red-600">{error}</p>
        </div>
      )}

      {/* Search / filter bar */}
      <div className="relative" ref={filterRef}>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row items-center overflow-hidden">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#1072b3] transition-colors" />
            <input
              type="text"
              placeholder="Search by title or request type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-none py-4 pl-12 pr-4 text-sm font-medium focus:ring-0 outline-none transition-all"
            />
          </div>

          {/* Checklist filter */}
          <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-100">
            <button
              onClick={() => setShowFilterPanel(p => !p)}
              className="w-full flex items-center justify-between gap-2 py-4 px-5 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors outline-none cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{filterLabel}</span>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-slate-400 transition-transform shrink-0",
                showFilterPanel && "rotate-180"
              )} />
            </button>
          </div>
        </div>

        {/* Dropdown rendered outside overflow-hidden container */}
        <AnimatePresence>
          {showFilterPanel && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-lg shadow-xl w-52 p-2"
            >
              {ALL_STATUSES.map(status => (
                <label
                  key={status}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={filterStatuses.has(status)}
                    onChange={() => toggleStatus(status)}
                    className="w-4 h-4 rounded accent-[#1072b3] cursor-pointer"
                  />
                  <span className={cn(
                    "px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5",
                    STATUS_STYLES[status]
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[status])} />
                    {status}
                  </span>
                </label>
              ))}
              {filterStatuses.size > 0 && (
                <button
                  onClick={() => setFilterStatuses(new Set())}
                  className="w-full mt-1 py-2 text-[10px] font-black uppercase tracking-tighter text-slate-400 hover:text-[#1072b3] transition-colors text-center"
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <AnimatePresence mode="wait">
        <motion.div
          key="my-requests"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 240px)' }}
        >
          <div className="flex-1 overflow-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1072b3]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-[11px] font-black uppercase tracking-widest text-center px-6">
                  {requests.length === 0 ? "No submitted requests found" : "No records match your search"}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md shadow-[0_1px_0_0_#e2e8f0]">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[8%] text-center">Ref ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[30%]">Request Title</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[24%]">Type</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[16%]">Date Filed</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[12%]">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[10%] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-5 text-[10px] font-black text-slate-400 font-mono text-center">#{req.id}</td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate max-w-xs">{req.title || 'Untitled Request'}</p>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-600 truncate">{req.type}</td>
                      <td className="px-6 py-5 text-[11px] font-bold text-slate-500 whitespace-nowrap">{formatDate(req.created_at)}</td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          'px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 whitespace-nowrap border',
                          STATUS_STYLES[req.status] || 'bg-slate-100 text-slate-500 border-slate-200'
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_DOT[req.status] || 'bg-slate-400')} />
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {/* EFFECT: Blue to Yellow */}
                        <button
                          onClick={() => onViewDetail(req.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black rounded-lg active:scale-95 whitespace-nowrap outline-none"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-[11px] font-bold text-slate-600">
            <div className="flex items-center gap-3">
              <span className="uppercase tracking-widest opacity-60">Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-md py-1.5 px-3 text-[11px] font-black focus:outline-none focus:ring-2 focus:ring-[#1072b3]/20"
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="text-slate-400 uppercase tracking-tighter">({filtered.length} total)</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors uppercase tracking-widest"
              >
                Prev
              </button>
              <span className="uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors uppercase tracking-widest"
              >
                Next
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

    </div>
  );
};

export default MyRequests;