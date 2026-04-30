import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Filter, ExternalLink,
  FileText, Loader2, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const API = 'https://ci-mo-re-deploy-isra.vercel.app';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Token ${localStorage.getItem('authToken')}`,
});

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
  });
};

const STATUS_STYLE = {
  Approved: 'bg-green-50 text-green-600',
  Pending:  'bg-yellow-50 text-yellow-600',
  Rejected: 'bg-red-50 text-red-600',
};

const DOT_STYLE = {
  Approved: 'bg-green-600',
  Pending:  'bg-yellow-600',
  Rejected: 'bg-red-600',
};

const STATUS_ORDER   = { Pending: 0, Approved: 1, Rejected: 2 };
const ALL_STATUSES   = ['Pending', 'Approved', 'Rejected'];
const SHOWN_STATUSES = new Set(ALL_STATUSES);

const initials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase();

// ---------------------------------------------------------------------------

const MarketingRequests = ({ onViewDetail }) => {
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

  // Always exclude Archived/Cancelled; then apply checklist + search
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

  const totalPages       = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatuses, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const filterLabel = filterStatuses.size === 0
    ? 'All Statuses'
    : [...filterStatuses].join(', ');

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marketing Requests</h2>
          <p className="text-gray-500 text-sm mt-1">Track and manage institutional marketing initiatives.</p>
        </div>
      </div>

      {/* Search / filter bar */}
      <div className="bg-white rounded shadow-sm border border-gray-100 flex flex-col md:flex-row items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-none rounded py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>

        {/* Checklist filter */}
        <div className="relative w-full md:w-56 border-t md:border-t-0 md:border-l border-gray-100" ref={filterRef}>
          <button
            onClick={() => setShowFilterPanel(p => !p)}
            className="w-full flex items-center justify-between gap-2 py-3.5 px-4 text-sm text-gray-600 hover:bg-gray-50 transition-colors outline-none cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">{filterLabel}</span>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-gray-400 transition-transform shrink-0",
              showFilterPanel && "rotate-180"
            )} />
          </button>

          <AnimatePresence>
            {showFilterPanel && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg w-48 p-2"
              >
                {ALL_STATUSES.map(status => (
                  <label
                    key={status}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={filterStatuses.has(status)}
                      onChange={() => toggleStatus(status)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5",
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
                    className="w-full mt-1 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors text-center"
                  >
                    Clear filter
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Requests table — flex-1 so it fills remaining height */}
      <AnimatePresence mode="wait">
        <motion.div
          key="requests"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="bg-white rounded shadow-sm border border-gray-100 flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 220px)' }}
        >
          {/* Scrollable body */}
          <div className="flex-1 overflow-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-400">
                <FileText className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No requests found</p>
                <p className="text-xs mt-1 opacity-70">
                  {requests.length === 0
                    ? 'No marketing requests yet.'
                    : 'Try a different search or filter.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-separate border-spacing-0">
                {/* Sticky header — uses shadow instead of border-b to avoid collapse glitch */}
                <thead className="sticky top-0 z-10 bg-gray-100 shadow-[0_2px_0_0_#e5e7eb]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[35%]">Request Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[22%]">Submitted By</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[14%]">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[16%]">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[13%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedRequests.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setFocusedRowId(focusedRowId === row.id ? null : row.id)}
                      className={cn(
                        "cursor-pointer transition-all duration-200",
                        focusedRowId === row.id
                          ? "bg-primary/5 hover:bg-primary/10"
                          : "hover:bg-gray-50",
                        row.status === 'Pending'
                          ? "border-l-[3px] border-yellow-400"
                          : focusedRowId === row.id
                            ? "border-l-[3px] border-primary"
                            : "border-l-[3px] border-transparent"
                      )}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900 truncate max-w-xs">{row.type}</p>
                        {row.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{row.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                            {initials(row.requester_name)}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{row.requester_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 whitespace-nowrap",
                          STATUS_STYLE[row.status] ?? 'bg-gray-100 text-gray-500'
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", DOT_STYLE[row.status] ?? 'bg-gray-400')} />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(row.created_at)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); onViewDetail(row.id); }}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination — pinned to bottom of card */}
          <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>entries</span>
              <span className="text-gray-400 ml-2">
                ({filteredRequests.length} total)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-semibold">Page</span>
                <span>{currentPage}</span>
                <span>of</span>
                <span>{totalPages}</span>
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 disabled:opacity-50"
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
