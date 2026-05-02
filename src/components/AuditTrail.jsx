import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, ChevronLeft, ChevronRight, X, Clock, User,
  Shield, Globe, FileText, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API, authHeaders } from '../config/api';

const ACTION_TYPES = [
  'ALL',
  'USER_LOGIN', 'USER_LOGOUT',
  'USER_CREATED', 'USER_UPDATED', 'USER_ARCHIVED',
  'REQUEST_CREATED', 'REQUEST_UPDATED', 'REQUEST_DELETED',
  'DOCUMENT_CREATED', 'DOCUMENT_UPDATED', 'DOCUMENT_DELETED',
  'SCHOOL_CREATED', 'SCHOOL_UPDATED', 'SCHOOL_ARCHIVED',
  'PASSWORD_CHANGED', 'PASSWORD_RESET',
  'ANNOUNCEMENT_CREATED',
  'BACKUP_CREATED', 'RESTORE_COMPLETED',
];

const ACTION_COLORS = {
  USER_LOGIN:           'bg-blue-100 text-blue-800',
  USER_LOGOUT:          'bg-slate-100 text-slate-600',
  USER_CREATED:         'bg-green-100 text-green-800',
  USER_UPDATED:         'bg-amber-100 text-amber-800',
  USER_ARCHIVED:        'bg-red-100 text-red-700',
  REQUEST_CREATED:      'bg-emerald-100 text-emerald-800',
  REQUEST_UPDATED:      'bg-amber-100 text-amber-800',
  REQUEST_DELETED:      'bg-red-100 text-red-700',
  DOCUMENT_CREATED:     'bg-emerald-100 text-emerald-800',
  DOCUMENT_UPDATED:     'bg-amber-100 text-amber-800',
  DOCUMENT_DELETED:     'bg-red-100 text-red-700',
  SCHOOL_CREATED:       'bg-emerald-100 text-emerald-800',
  SCHOOL_UPDATED:       'bg-amber-100 text-amber-800',
  SCHOOL_ARCHIVED:      'bg-orange-100 text-orange-800',
  PASSWORD_CHANGED:     'bg-purple-100 text-purple-800',
  PASSWORD_RESET:       'bg-purple-100 text-purple-800',
  ANNOUNCEMENT_CREATED: 'bg-indigo-100 text-indigo-800',
  BACKUP_CREATED:       'bg-teal-100 text-teal-800',
  RESTORE_COMPLETED:    'bg-teal-100 text-teal-800',
};

const formatTimestamp = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const DiffModal = ({ log, onClose }) => {
  const before  = log.metadata?.before || {};
  const after   = log.metadata?.after  || {};
  const keys    = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const hasDiff = keys.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1072b3]" />
            Log Entry Details
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 pb-6 space-y-3">
          {/* Timestamp */}
          <div className="flex items-start gap-3">
            <Clock className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Timestamp</p>
              <p className="font-mono text-xs text-slate-700 mt-0.5">{formatTimestamp(log.timestamp)}</p>
            </div>
          </div>

          {/* User */}
          <div className="flex items-start gap-3">
            <User className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">User</p>
              {log.user_name ? (
                <>
                  <p className="text-slate-800 font-medium text-sm mt-0.5">{log.user_name}</p>
                  <p className="text-xs text-slate-400">{log.email}</p>
                </>
              ) : (
                <p className="text-slate-400 italic text-xs mt-0.5">System</p>
              )}
            </div>
          </div>

          {/* Action */}
          <div className="flex items-start gap-3">
            <Shield className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Action</p>
              <span className={`inline-block font-mono text-xs px-2 py-0.5 rounded-md font-medium mt-1 ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-700'}`}>
                {log.action}
              </span>
            </div>
          </div>

          {/* Resource */}
          <div className="flex items-start gap-3">
            <FileText className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Resource</p>
              <p className="text-slate-700 text-sm mt-0.5">{log.resource || '—'}</p>
            </div>
          </div>

          {/* IP Address */}
          <div className="flex items-start gap-3">
            <Globe className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">IP Address</p>
              <p className="font-mono text-xs text-slate-700 mt-0.5">{log.ip_address || '—'}</p>
            </div>
          </div>

          {/* Details */}
          {log.details && (
            <div className="flex items-start gap-3">
              <FileText className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Details</p>
                <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">{log.details}</p>
              </div>
            </div>
          )}

          {/* Field-level diff — only when metadata is present */}
          {log.metadata && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Field Changes</p>
              {hasDiff ? (
                <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide pb-2 pr-4 w-1/4">Field</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide pb-2 pr-4 w-[37.5%]">Before</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide pb-2 w-[37.5%]">After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k) => (
                      <tr key={k} className="border-t border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs text-slate-600 capitalize">{k}</td>
                        <td className="py-2 pr-4 font-mono text-xs bg-red-50 text-red-700 rounded px-1">
                          {before[k] !== undefined ? String(before[k]) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-2 font-mono text-xs bg-green-50 text-green-700 rounded px-1">
                          {after[k] !== undefined ? String(after[k]) : <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-slate-400 italic text-center py-3">No field-level diff recorded.</p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const AuditTrail = () => {
  const [logs, setLogs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  // filters
  const [search, setSearch]         = useState('');
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [action, setAction]         = useState('ALL');
  const [actionOpen, setActionOpen] = useState(false);

  // pagination
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        page_size: pageSize,
        ...(search    && { search }),
        ...(startDate && { start_date: startDate }),
        ...(endDate   && { end_date: endDate }),
        ...(action !== 'ALL' && { action }),
      });
      const res = await fetch(`${API}/api/audit-logs/?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load audit logs.');
      const data = await res.json();
      setLogs(data.results);
      setTotalPages(data.total_pages);
      setTotalCount(data.count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, startDate, endDate, action]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // reset to page 1 when any filter changes
  useEffect(() => {
    setPage(1);
  }, [search, startDate, endDate, action, pageSize]);

  const handleClearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setAction('ALL');
    setPage(1);
  };

  const hasActiveFilters = search || startDate || endDate || action !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#03396c]">Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-0.5">System-wide activity log for all significant actions</p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Date range */}
          <div className="flex items-center gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1072b3]/40 focus:border-[#1072b3]"
              />
            </div>
            <span className="text-slate-400 text-sm mt-5">—</span>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1072b3]/40 focus:border-[#1072b3]"
              />
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Search User</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1072b3]/40 focus:border-[#1072b3]"
              />
            </div>
          </div>

          {/* Action type dropdown */}
          <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-1">Action Type</label>
            <button
              onClick={() => setActionOpen((o) => !o)}
              className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white hover:border-[#1072b3] transition-colors min-w-[170px] justify-between"
            >
              <span className={action !== 'ALL' ? 'font-mono text-xs' : ''}>
                {action === 'ALL' ? 'All Actions' : action}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <AnimatePresence>
              {actionOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto w-56"
                >
                  {ACTION_TYPES.map((a) => (
                    <button
                      key={a}
                      onClick={() => { setAction(a); setActionOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs font-mono hover:bg-[#1072b3]/5 transition-colors ${
                        action === a ? 'bg-[#1072b3]/10 text-[#1072b3] font-semibold' : 'text-slate-600'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Page size */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Show</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1072b3]/40 bg-white"
            >
              {[10, 25, 50].map((n) => <option key={n} value={n}>{n} entries</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {error && (
          <div className="p-6 text-center text-red-600 text-sm">{error}</div>
        )}

        {!error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Timestamp</span>
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />User</span>
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                    <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Action</span>
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Resource</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                    <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />IP Address</span>
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100 animate-pulse">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-3 bg-slate-100 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400 text-sm">
                      No audit logs found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 text-xs font-mono">
                        {formatTimestamp(log.timestamp)}
                      </td>

                      {/* User */}
                      <td className="px-5 py-3.5">
                        {log.user_name ? (
                          <>
                            <p className="font-semibold text-slate-800 leading-tight">{log.user_name}</p>
                            <p className="text-xs text-slate-400 leading-tight mt-0.5">{log.email}</p>
                          </>
                        ) : (
                          <span className="text-slate-400 italic text-xs">System</span>
                        )}
                      </td>

                      {/* Action badge */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-block font-mono text-xs px-2 py-0.5 rounded-md font-medium ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-700'}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Resource */}
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{log.resource || '—'}</td>

                      {/* IP */}
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {log.ip_address || '—'}
                      </td>

                      {/* Details */}
                      <td className="px-5 py-3.5 max-w-xs">
                        <span className="text-slate-600 text-xs truncate max-w-[200px] block" title={log.details}>
                          {log.details || '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!error && !loading && totalCount > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-medium text-slate-700">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)}
              </span>{' '}
              of <span className="font-medium text-slate-700">{totalCount}</span> entries
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>

              <span className="px-3 py-1.5 text-xs font-medium text-slate-700">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Diff modal */}
      <AnimatePresence>
        {selectedLog && (
          <DiffModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditTrail;
