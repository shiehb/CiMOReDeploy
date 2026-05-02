import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  User,
  FileText,
  ChevronDown,
  X,
  Megaphone,
  Bell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { API, authHeaders } from '../config/api';

function timeAgo(isoString) {
  if (!isoString) return '';
  const then = new Date(isoString.length === 10 ? isoString + 'T00:00:00' : isoString);
  const diff = Math.floor((Date.now() - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 172800) return 'Yesterday';
  const days = Math.floor(diff / 86400);
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

const NOTIFICATION_META = {
  request: { icon: TrendingUp, color: 'bg-blue-50 text-[#1072b3]' },
  school:  { icon: FileText,   color: 'bg-green-50 text-green-600' },
  doc:     { icon: FileText,   color: 'bg-purple-50 text-purple-600' },
  user:    { icon: User,       color: 'bg-orange-50 text-orange-600' },
};

const STATUS_COLORS = {
  Approved:  'bg-green-50 text-green-600 border-green-200',
  Pending:   'bg-yellow-50 text-yellow-600 border-yellow-200',
  Rejected:  'bg-red-50 text-red-600 border-red-200',
  Cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const BAR_COLORS = {
  Approved:  '#16a34a',
  Pending:   '#ca8a04',
  Rejected:  '#dc2626',
  Cancelled: '#6b7280',
};

function getPresetRange(preset) {
  const to   = new Date();
  const from = new Date();
  if (preset === 'Daily')        from.setDate(to.getDate() - 1);
  else if (preset === 'Weekly')  from.setDate(to.getDate() - 7);
  else if (preset === 'Monthly') from.setMonth(to.getMonth() - 1);
  return {
    from: from.toISOString().slice(0, 10),
    to:   to.toISOString().slice(0, 10),
  };
}

const ALL_STATUSES = ['Approved', 'Pending', 'Rejected', 'Cancelled'];

// ---------------------------------------------------------------------------
// Sheet — slides in from the right, mimics shadcn/ui Sheet behaviour
// ---------------------------------------------------------------------------
const Sheet = ({ open, onClose, title, description, children }) => (
  <AnimatePresence>
    {open && (
      <>
        {/* Backdrop */}
        <motion.div
          key="sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-[120] backdrop-blur-sm h-screen"
        />

        {/* Panel */}
        <motion.div
          key="sheet-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[999] shadow-2xl flex flex-col"
        >
          {/* Sheet header */}
          <div className="flex items-start justify-between px-8 py-7 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h2>
              {description && (
                <p className="text-[11px] font-medium text-slate-400 mt-1 leading-relaxed">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors outline-none ml-4 mt-0.5 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sheet body */}
          <div className="flex-1 overflow-y-auto px-8 py-7">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
const Dashboard = ({ onNavigate }) => {
  const [error, setError] = useState(null);

  const [marketingData, setMarketingData] = useState({
    breakdown: { Approved: 0, Pending: 0, Rejected: 0, Cancelled: 0 },
    requests:  [],
  });
  const [trailChartData,  setTrailChartData]  = useState([]);
  const [activityData,    setActivityData]    = useState([]);
  const [marketingLoading, setMarketingLoading] = useState(true);
  const [trailLoading,     setTrailLoading]     = useState(true);
  const [activityLoading,  setActivityLoading]  = useState(true);

  const fullName  = localStorage.getItem('userFullName') || 'Admin';
  const firstName = fullName.split(' ')[0];

  // Sheet visibility
  const [announcementSheetOpen, setAnnouncementSheetOpen] = useState(false);
  const [notifSheetOpen, setNotifSheetOpen]               = useState(false);

  // Announcement form
  const [announcementTitle, setAnnouncementTitle]         = useState('');
  const [announcementMsg, setAnnouncementMsg]             = useState('');
  const [announcementTarget, setAnnouncementTarget]       = useState('All Staff');
  const [announcementLoading, setAnnouncementLoading]     = useState(false);
  const [announcementSuccess, setAnnouncementSuccess]     = useState('');

  // Notification form
  const [notifTitle, setNotifTitle]     = useState('');
  const [notifMsg, setNotifMsg]         = useState('');
  const [notifRoles, setNotifRoles]     = useState(new Set());
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState('');

  // Row 2 — Request filters
  const [reqFilterStatuses, setReqFilterStatuses]   = useState(new Set());
  const [showReqStatusPanel, setShowReqStatusPanel] = useState(false);
  const [reqDatePreset, setReqDatePreset]           = useState('Monthly');
  const [reqDateFrom, setReqDateFrom] = useState(() => getPresetRange('Monthly').from);
  const [reqDateTo,   setReqDateTo]   = useState(() => getPresetRange('Monthly').to);

  // Row 3 Left — Trailblazing filter
  const [trailPreset, setTrailPreset]     = useState('Monthly');
  const [trailDateFrom, setTrailDateFrom] = useState('');
  const [trailDateTo, setTrailDateTo]     = useState('');

  // Row 3 Right — Activity filter
  const [activityCategories, setActivityCategories] = useState(new Set());
  const [showActivityPanel, setShowActivityPanel]   = useState(false);

  const reqFilterRef      = useRef(null);
  const activityFilterRef = useRef(null);

  // Marketing requests + breakdown — refetch on every filter change
  useEffect(() => {
    const fetchMarketing = async () => {
      setMarketingLoading(true);
      try {
        const params = new URLSearchParams();
        const statusList = [...reqFilterStatuses];
        params.set('status', statusList.length === 0 ? 'ALL STATUSES' : statusList.join(','));
        if (reqDateFrom) params.set('startDate', reqDateFrom);
        if (reqDateTo)   params.set('endDate',   reqDateTo);
        const res = await fetch(`${API}/api/dashboard/marketing/?${params}`, {
          headers: { Authorization: `Token ${localStorage.getItem('authToken')}` },
        });
        if (!res.ok) throw new Error('Failed to load marketing data.');
        setMarketingData(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setMarketingLoading(false);
      }
    };
    fetchMarketing();
  }, [reqFilterStatuses, reqDateFrom, reqDateTo]);

  // Trailblazing chart — refetch when preset or custom dates change
  useEffect(() => {
    const fetchTrail = async () => {
      setTrailLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('filterType', trailPreset.toUpperCase());
        if (trailPreset === 'Custom' && trailDateFrom) params.set('startDate', trailDateFrom);
        if (trailPreset === 'Custom' && trailDateTo)   params.set('endDate',   trailDateTo);
        const res = await fetch(`${API}/api/dashboard/trailblazing/?${params}`, {
          headers: { Authorization: `Token ${localStorage.getItem('authToken')}` },
        });
        if (!res.ok) throw new Error('Failed to load trailblazing data.');
        const json = await res.json();
        setTrailChartData(json.chartData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setTrailLoading(false);
      }
    };
    fetchTrail();
  }, [trailPreset, trailDateFrom, trailDateTo]);

  // Recent activity — refetch when category filter changes
  useEffect(() => {
    const fetchActivity = async () => {
      setActivityLoading(true);
      try {
        const params = new URLSearchParams();
        const catList = [...activityCategories];
        params.set('category', catList.length === 0 ? 'ALL ACTIVITY' : catList.join(','));
        const res = await fetch(`${API}/api/dashboard/recent-activity/?${params}`, {
          headers: { Authorization: `Token ${localStorage.getItem('authToken')}` },
        });
        if (!res.ok) throw new Error('Failed to load activity.');
        const json = await res.json();
        setActivityData(json.activities || []);
      } catch (err) {
        console.error(err);
      } finally {
        setActivityLoading(false);
      }
    };
    fetchActivity();
  }, [activityCategories]);

  // Click-outside: request status panel
  useEffect(() => {
    const handler = (e) => {
      if (reqFilterRef.current && !reqFilterRef.current.contains(e.target))
        setShowReqStatusPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Click-outside: activity panel
  useEffect(() => {
    const handler = (e) => {
      if (activityFilterRef.current && !activityFilterRef.current.contains(e.target))
        setShowActivityPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Breakdown data derived from server response (no local filtering)
  const statusCountData = Object.entries(marketingData.breakdown || {})
    .map(([name, value]) => ({ name, value }));

  // --- Handlers ---

  const handlePostAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMsg.trim()) return;
    setAnnouncementLoading(true);
    setAnnouncementSuccess('');
    try {
      const res = await fetch(`${API}/api/announcements/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title:   announcementTitle,
          message: announcementMsg,
          target:  announcementTarget,
        }),
      });
      if (!res.ok) throw new Error('Failed to post announcement.');
      setAnnouncementTitle('');
      setAnnouncementMsg('');
      setAnnouncementTarget('All Staff');
      setAnnouncementSuccess('Announcement posted successfully.');
      setTimeout(() => {
        setAnnouncementSuccess('');
        setAnnouncementSheetOpen(false);
      }, 2000);
    } catch (err) {
      setAnnouncementSuccess(`Error: ${err.message}`);
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMsg.trim() || notifRoles.size === 0) return;
    setNotifLoading(true);
    setNotifSuccess('');
    try {
      const res = await fetch(`${API}/api/notifications/send/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title: notifTitle, message: notifMsg, roles: [...notifRoles] }),
      });
      if (!res.ok) throw new Error('Failed to send notification.');
      setNotifTitle('');
      setNotifMsg('');
      setNotifRoles(new Set());
      setNotifSuccess('Notification sent.');
      setTimeout(() => {
        setNotifSuccess('');
        setNotifSheetOpen(false);
      }, 2000);
    } catch (err) {
      setNotifSuccess(`Error: ${err.message}`);
    } finally {
      setNotifLoading(false);
    }
  };

  const toggleReqStatus = (s) =>
    setReqFilterStatuses(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });

  const toggleNotifRole = (role) =>
    setNotifRoles(prev => {
      const next = new Set(prev);
      next.has(role) ? next.delete(role) : next.add(role);
      return next;
    });

  const toggleActivityCategory = (cat) =>
    setActivityCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });

  const handleReqPreset = (preset) => {
    setReqDatePreset(preset);
    const range = getPresetRange(preset);
    setReqDateFrom(range.from);
    setReqDateTo(range.to);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-600 uppercase">
          {error}
        </div>
      )}

      {/* ── Filter Controls + Action Buttons ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        {/* Left: filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">

        {/* Status multi-select */}
        <div className="relative" ref={reqFilterRef}>
          <button
            onClick={() => setShowReqStatusPanel(p => !p)}
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors shadow-sm outline-none"
          >
            {reqFilterStatuses.size === 0 ? 'All Statuses' : [...reqFilterStatuses].join(', ')}
            <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', showReqStatusPanel && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {showReqStatusPanel && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 top-full mt-2 z-30 bg-white border border-slate-200 rounded-lg shadow-xl w-52 p-2"
              >
                {ALL_STATUSES.map(status => (
                  <label
                    key={status}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={reqFilterStatuses.has(status)}
                      onChange={() => toggleReqStatus(status)}
                      className="w-4 h-4 rounded accent-[#1072b3] cursor-pointer"
                    />
                    <span className={cn('px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border', STATUS_COLORS[status])}>
                      {status}
                    </span>
                  </label>
                ))}
                {reqFilterStatuses.size > 0 && (
                  <button
                    onClick={() => setReqFilterStatuses(new Set())}
                    className="cursor-pointer w-full mt-1 py-2 text-[10px] font-black uppercase tracking-tighter text-slate-400 hover:text-[#1072b3] transition-colors text-center"
                  >
                    Clear filters
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Date preset tabs + From/To inputs */}
        <div className="flex flex-wrap items-center gap-2">
          {['Daily', 'Weekly', 'Monthly'].map(preset => (
            <button
              key={preset}
              onClick={() => handleReqPreset(preset)}
              className={cn(
                'cursor-pointer px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all outline-none',
                reqDatePreset === preset
                  ? 'bg-[#1072b3] text-white border-[#1072b3]'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              )}
            >
              {preset}
            </button>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={reqDateFrom}
              onChange={(e) => { setReqDateFrom(e.target.value); setReqDatePreset('Custom'); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#1072b3]/20 focus:border-[#1072b3]"
            />
            <span className="text-[10px] font-black text-slate-400 uppercase">to</span>
            <input
              type="date"
              value={reqDateTo}
              onChange={(e) => { setReqDateTo(e.target.value); setReqDatePreset('Custom'); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#1072b3]/20 focus:border-[#1072b3]"
            />
          </div>
        </div>
        </div>{/* end left filters */}

        {/* Right: action buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setAnnouncementSheetOpen(true)}
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-[#1072b3] hover:text-[#1072b3] transition-all shadow-sm outline-none"
          >
            <Megaphone className="w-4 h-4" />
            <span className="hidden sm:inline">Create Announcement</span>
          </button>

          <button
            onClick={() => setNotifSheetOpen(true)}
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 font-black text-[11px] uppercase tracking-widest transition-all duration-300 bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] rounded-lg shadow-md outline-none"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Send Notification</span>
          </button>
        </div>
      </div>{/* end filter controls + action buttons row */}

      {/* ── ROW 2B — Breakdown Bar Chart + Requests Table ── */}
      <div className="flex flex-col md:flex-row gap-6">

        {/* Left: Status breakdown */}
        <div className="md:w-1/4 shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Breakdown</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">By Request Status</p>
          </div>
          <div style={{ height: 250 }}>
            {marketingLoading ? (
              <div className="h-full w-full bg-slate-50 rounded-lg animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusCountData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 700 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 700 }}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '10px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {statusCountData.map((entry) => (
                      <Cell key={entry.name} fill={BAR_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Marketing Requests Table */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Recent Marketing Requests</h3>
            <button
              onClick={() => onNavigate?.('marketing')}
              className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-[#1072b3] hover:text-[#f6ce11] transition-colors"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Request Type</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted By</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marketingLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-8 py-5">
                        <div className="h-4 bg-slate-50 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : marketingData.requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-10 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      No requests match the selected filters.
                    </td>
                  </tr>
                ) : (
                  marketingData.requests.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5 text-xs font-black text-slate-800 uppercase tracking-tight">{row.requestType}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#03396c] flex items-center justify-center text-[10px] font-black text-white uppercase">
                            {row.submittedBy.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <p className="text-xs font-bold text-slate-600">{row.submittedBy}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={cn('px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest border-l-2', STATUS_COLORS[row.status] || 'bg-slate-100 text-slate-500 border-slate-300')}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-[11px] font-bold text-slate-500">{row.date}</td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => onNavigate?.('marketing')}
                          className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-[#1072b3] hover:text-[#f6ce11] transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── ROW 3 — Trailblazing Activity + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Trailblazing Activity */}
        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Trailblazing Activity</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Institutional Outreach</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#1072b3]" />
              <span className="text-[10px] font-black text-slate-500 uppercase">Visits</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            {['Monthly', 'Semestral', 'Yearly'].map(p => (
              <button
                key={p}
                onClick={() => setTrailPreset(p)}
                className={cn(
                  'cursor-pointer px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all outline-none',
                  trailPreset === p
                    ? 'bg-[#1072b3] text-white border-[#1072b3]'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setTrailPreset('Custom')}
              className={cn(
                'cursor-pointer px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all outline-none',
                trailPreset === 'Custom'
                  ? 'bg-[#1072b3] text-white border-[#1072b3]'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              )}
            >
              Custom
            </button>
            {trailPreset === 'Custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={trailDateFrom}
                  onChange={(e) => setTrailDateFrom(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#1072b3]/20 focus:border-[#1072b3]"
                />
                <span className="text-[10px] font-black text-slate-400 uppercase">to</span>
                <input
                  type="date"
                  value={trailDateTo}
                  onChange={(e) => setTrailDateTo(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#1072b3]/20 focus:border-[#1072b3]"
                />
              </div>
            )}
          </div>

          <div className="h-[350px] w-full">
            {trailLoading ? (
              <div className="h-full w-full bg-slate-50 rounded-lg animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trailChartData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1072b3" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#1072b3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="visits" stroke="#1072b3" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Recent Activity</h3>
            <button
              onClick={() => onNavigate?.('marketing')}
              className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-[#1072b3] hover:text-[#f6ce11] transition-colors"
            >
              View All
            </button>
          </div>

          <div className="relative mb-6" ref={activityFilterRef}>
            <button
              onClick={() => setShowActivityPanel(p => !p)}
              className="cursor-pointer flex items-center justify-between gap-2 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors shadow-sm outline-none"
            >
              <span>{activityCategories.size === 0 ? 'All Activity' : [...activityCategories].join(', ')}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform shrink-0', showActivityPanel && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {showActivityPanel && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute left-0 top-full mt-2 z-30 bg-white border border-slate-200 rounded-lg shadow-xl w-full p-2"
                >
                  {['User', 'Request', 'Visit'].map(cat => (
                    <label
                      key={cat}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={activityCategories.has(cat)}
                        onChange={() => toggleActivityCategory(cat)}
                        className="w-4 h-4 rounded accent-[#1072b3] cursor-pointer"
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{cat}</span>
                    </label>
                  ))}
                  {activityCategories.size > 0 && (
                    <button
                      onClick={() => setActivityCategories(new Set())}
                      className="cursor-pointer w-full mt-1 py-2 text-[10px] font-black uppercase tracking-tighter text-slate-400 hover:text-[#1072b3] transition-colors text-center"
                    >
                      Clear filters
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            {activityLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-slate-50 rounded animate-pulse w-3/4" />
                    <div className="h-2 bg-slate-50 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : activityData.length === 0 ? (
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center py-6">
                No activity matches the selected filter.
              </p>
            ) : (
              activityData.map((item, idx) => {
                const meta = NOTIFICATION_META[item.type] || NOTIFICATION_META.request;
                const Icon = meta.icon;
                return (
                  <div key={idx} className="flex gap-4 group cursor-pointer transition-transform hover:translate-x-1">
                    <div className={cn('w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors', meta.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">{item.description}</p>
                      <p className="text-[9px] text-slate-400 mt-1 uppercase font-black tracking-widest">{timeAgo(item.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Sheet: Create Announcement ── */}
      <Sheet
        open={announcementSheetOpen}
        onClose={() => setAnnouncementSheetOpen(false)}
        title="Create Announcement"
        description="Broadcast a message to collaborators and staff dashboards."
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Title</label>
            <input
              type="text"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              placeholder="e.g. Foundation Week Reminder"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#1072b3]/20 focus:border-[#1072b3] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Message</label>
            <textarea
              rows={5}
              value={announcementMsg}
              onChange={(e) => setAnnouncementMsg(e.target.value)}
              placeholder="Type your announcement here..."
              className="w-full border border-slate-200 rounded-lg p-3 text-xs font-medium text-slate-700 resize-none outline-none focus:ring-2 focus:ring-[#1072b3]/20 focus:border-[#1072b3] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Audience</label>
            <select
              value={announcementTarget}
              onChange={(e) => setAnnouncementTarget(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-2 focus:ring-[#1072b3]/20 focus:border-[#1072b3] transition-all bg-white"
            >
              <option value="All Staff">All Staff</option>
              <option value="All Collaborators">All Collaborators</option>
            </select>
          </div>

          {announcementSuccess && (
            <p className={cn(
              'text-[10px] font-black uppercase tracking-widest',
              announcementSuccess.startsWith('Error') ? 'text-red-500' : 'text-green-600'
            )}>
              {announcementSuccess}
            </p>
          )}

          <button
            onClick={handlePostAnnouncement}
            disabled={announcementLoading || !announcementTitle.trim() || !announcementMsg.trim()}
            className="cursor-pointer flex items-center justify-center gap-2 w-full px-6 py-3 font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] rounded-lg shadow-md outline-none disabled:opacity-50"
          >
            {announcementLoading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Post Announcement'
            }
          </button>
        </div>
      </Sheet>

      {/* ── Sheet: Send Notification ── */}
      <Sheet
        open={notifSheetOpen}
        onClose={() => setNotifSheetOpen(false)}
        title="Send Notification"
        description="Send a direct broadcast message to a specific group of users."
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Title</label>
            <input
              type="text"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              placeholder="e.g. System Maintenance Notice"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#1072b3]/20 focus:border-[#1072b3] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Message</label>
            <input
              type="text"
              value={notifMsg}
              onChange={(e) => setNotifMsg(e.target.value)}
              placeholder="Notification message..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#1072b3]/20 focus:border-[#1072b3] transition-all"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Roles</label>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              {['Admin', 'Staff', 'Collaborator'].map(role => (
                <label key={role} className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={notifRoles.has(role)}
                    onChange={() => toggleNotifRole(role)}
                    className="w-4 h-4 rounded accent-[#1072b3] cursor-pointer"
                  />
                  <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{role}</span>
                </label>
              ))}
            </div>
          </div>

          {notifSuccess && (
            <p className={cn(
              'text-[10px] font-black uppercase tracking-widest',
              notifSuccess.startsWith('Error') ? 'text-red-500' : 'text-green-600'
            )}>
              {notifSuccess}
            </p>
          )}

          <button
            onClick={handleSendNotification}
            disabled={notifLoading || !notifTitle.trim() || !notifMsg.trim() || notifRoles.size === 0}
            className="cursor-pointer flex items-center justify-center gap-2 w-full px-6 py-3 font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] rounded-lg shadow-md outline-none disabled:opacity-50"
          >
            {notifLoading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Send Notification'
            }
          </button>
        </div>
      </Sheet>

    </div>
  );
};

export default Dashboard;
