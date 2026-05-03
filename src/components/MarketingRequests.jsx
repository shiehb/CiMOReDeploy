import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Filter, ExternalLink,
  FileText, Loader2, ChevronDown, MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { API, authHeaders } from '../config/api';

const THEME = {
  primary: '#1072b3',
  secondary: '#03396c',
  accent: '#f6ce11',
  bg: '#F5F7FA',
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
  });
};

const STATUS_STYLE = {
  Approved: 'bg-green-50 text-green-600 border-green-100',
  Pending:  'bg-yellow-50 text-yellow-600 border-yellow-100',
  Rejected: 'bg-red-50 text-red-600 border-red-100',
  Cancelled: 'bg-gray-50 text-gray-600 border-gray-100',
};

const DOT_STYLE = {
  Approved: 'bg-green-600',
  Pending:  'bg-yellow-600',
  Rejected: 'bg-red-600',
  Cancelled: 'bg-gray-600',
};

const STATUS_ORDER   = { Pending: 0, Approved: 1, Rejected: 2, Cancelled: 3 };
const ALL_STATUSES   = ['Pending', 'Approved', 'Rejected', 'Cancelled'];
const SHOWN_STATUSES = new Set(ALL_STATUSES);

const initials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase();

const MarketingRequests = ({ onViewDetail, onOpenChat }) => {
  const [searchQuery, setSearchQuery]         = useState('');
  const [filterStatuses, setFilterStatuses]   = useState(new Set());
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [requests, setRequests]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [pageSize, setPageSize]               = useState(10);
  const [currentPage, setCurrentPage]         = useState(1);
  const [focusedRowId, setFocusedRowId]       = useState(null);

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
      if (res.ok) setRequests(await res.json());
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

  const filteredRequests = requests
    .filter(r => {
      if (!SHOWN_STATUSES.has(r.status)) return false;
      const q = searchQuery.toLowerCase();
      const matchesSearch = r.type.toLowerCase().includes(q) ||
                            (r.requester_name || '').toLowerCase().includes(q);
      const matchesStatus = filterStatuses.size === 0 || filterStatuses.has(r.status);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3));

  const totalPages        = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatuses, pageSize]);

  const filterLabel = filterStatuses.size === 0
    ? 'All Statuses'
    : [...filterStatuses].join(', ');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-secondary uppercase tracking-tight">Marketing Requests</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Track and manage institutional marketing initiatives.</p>
        </div>
        {onOpenChat && (
          <button
            onClick={() => onOpenChat(null, 'Marketing Requests', requests)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border-2 border-transparent rounded-lg bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] group outline-none cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Open Chat</span>
          </button>
        )}
      </div>

      {/* Search / filter bar */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row items-center overflow-hidden">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#1072b3] transition-colors" />
          <input
            type="text"
            placeholder="Search by type or requester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-none py-4 pl-12 pr-4 text-sm font-medium focus:ring-0 transition-all outline-none"
          />
        </div>

        <div className="relative w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-100" ref={filterRef}>
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

          <AnimatePresence>
            {showFilterPanel && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute right-0 top-full mt-2 z-30 bg-white border border-slate-200 rounded-lg shadow-xl w-52 p-2"
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
                      STATUS_STYLE[status]
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", DOT_STYLE[status])} />
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
      </div>

      {/* Requests table */}
      <AnimatePresence mode="wait">
        <motion.div
          key="requests"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 240px)' }}
        >
          <div className="flex-1 overflow-auto min-h-[250px]">
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1072b3]" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-[11px] font-black uppercase tracking-widest">No matching records found</p>
              </div>
            ) : (
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md shadow-[0_1px_0_0_#e2e8f0]">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[35%]">Request Type</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[22%]">Requester</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[14%]">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[16%]">Date Filed</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[13%] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRequests.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setFocusedRowId(focusedRowId === row.id ? null : row.id)}
                      className={cn(
                        "cursor-pointer transition-all duration-200",
                        focusedRowId === row.id ? "bg-[#1072b3]/5" : "hover:bg-slate-50/50"
                      )}
                    >
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate max-w-xs">{row.type}</p>
                        {row.description && (
                          <p className="text-[11px] font-medium text-slate-400 mt-1 truncate max-w-xs">{row.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#03396c] flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm">
                            {initials(row.requester_name)}
                          </div>
                          <p className="text-xs font-bold text-slate-600 truncate">{row.requester_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 whitespace-nowrap border",
                          STATUS_STYLE[row.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", DOT_STYLE[row.status] ?? 'bg-slate-400')} />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-[11px] font-bold text-slate-500 whitespace-nowrap">{formatDate(row.created_at)}</td>
                      <td className="px-6 py-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          {onOpenChat && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onOpenChat(row.id, row.type || `Request #${row.id}`); }}
                              title="Open Chat"
                              className="cursor-pointer w-8 h-8 inline-flex items-center justify-center rounded-lg bg-[#1072b3]/10 text-[#1072b3] hover:bg-[#1072b3] hover:text-white transition-all duration-200 active:scale-95 outline-none"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); onViewDetail(row.id); }}
                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black rounded-lg active:scale-95 whitespace-nowrap outline-none"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Open
                          </button>
                        </div>
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
              <span className="text-slate-400 uppercase tracking-tighter">
                {filteredRequests.length} Total Records
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors uppercase tracking-widest"
              >
                Prev
              </button>
              <span className="uppercase tracking-widest">Page {currentPage} / {totalPages}</span>
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

export default MarketingRequests;