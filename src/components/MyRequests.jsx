import React, { useState, useEffect, useRef } from 'react';
import { Search, ExternalLink, Loader2, AlertCircle, Filter, ChevronDown, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { API, authHeaders } from '../config/api';

const STATUS_STYLES = {
  Pending:  'bg-amber-50 text-amber-600',
  Approved: 'bg-green-50 text-green-600',
  Rejected: 'bg-red-50 text-red-600',
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

const MyRequests = ({ onViewDetail }) => {
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
        r.type.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q);
      const matchesStatus = filterStatuses.size === 0 || filterStatuses.has(r.status);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3));

  const totalPages        = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedRequests = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setCurrentPage(1); }, [search, filterStatuses, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const filterLabel = filterStatuses.size === 0
    ? 'All Statuses'
    : [...filterStatuses].join(', ');

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Past Requests</h2>
        <p className="text-gray-500 text-sm mt-1">History of all marketing requests you have submitted.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      {/* Search / filter bar */}
      <div className="bg-white rounded shadow-sm border border-gray-100 flex flex-col md:flex-row items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by title, type, or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-none rounded py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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

      {/* Table */}
      <AnimatePresence mode="wait">
        <motion.div
          key="my-requests"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="bg-white rounded shadow-sm border border-gray-100 flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 215px)' }}
        >
          {/* Scrollable body */}
          <div className="flex-1 overflow-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-400">
                <FileText className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">
                  {requests.length === 0 ? "You haven't submitted any requests yet." : 'No requests match your search.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-gray-100 shadow-[0_2px_0_0_#e5e7eb]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[6%]">#</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[30%]">Request Title</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[24%]">Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[16%]">Date Submitted</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[14%]">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[10%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedRequests.map((req) => (
                    <tr
                      key={req.id}
                      className={cn(
                        "hover:bg-gray-50 transition-colors",
                        req.status === 'Pending' && "border-l-[3px] border-amber-400"
                      )}
                    >
                      <td className="px-6 py-4 text-xs text-gray-400 font-mono">#{req.id}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900 truncate">{req.title || '—'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 truncate">{req.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(req.created_at)}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 whitespace-nowrap',
                          STATUS_STYLES[req.status] || 'bg-gray-100 text-gray-500'
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_DOT[req.status] || 'bg-gray-400')} />
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => onViewDetail(req.id)}
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

          {/* Pagination — pinned to bottom */}
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
              <span className="text-gray-400 ml-2">({filtered.length} total)</span>
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

export default MyRequests;
