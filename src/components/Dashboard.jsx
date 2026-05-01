import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  School,
  FileCheck,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  User,
  FileText,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { API, authHeaders } from '../config/api';

// SLC Corporate Theme Mapping
const THEME = {
  primary: '#1072b3',
  secondary: '#03396c',
  light: '#bdd4e5',
  accent: '#f6ce11',
  bg: '#F5F7FA',
};

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
  school: { icon: School, color: 'bg-green-50 text-green-600' },
  doc: { icon: FileText, color: 'bg-purple-50 text-purple-600' },
  user: { icon: User, color: 'bg-orange-50 text-orange-600' },
};

const STATUS_COLORS = {
  Approved: 'bg-green-50 text-green-600',
  Pending: 'bg-yellow-50 text-yellow-600',
  Rejected: 'bg-red-50 text-red-600',
  Cancelled: 'bg-gray-100 text-gray-500',
};

const StatCard = ({ title, value, icon: Icon, trend, color, loading }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-4 relative overflow-hidden group"
  >
    <div className={cn('absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 transition-transform duration-500 group-hover:scale-125', color)} />
    <div className="flex items-center justify-between">
      <div className={cn('p-3 rounded-lg', color.replace('bg-', 'bg-opacity-10 text-'))}>
        <Icon className="w-6 h-6" />
      </div>
      <div className={cn('flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-md', trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
        {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      </div>
    </div>
    <div>
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</p>
      {loading ? (
        <div className="h-9 w-24 bg-slate-50 rounded animate-pulse mt-1" />
      ) : (
        <h3 className="text-3xl font-black text-slate-900 mt-1">
          {value != null ? value.toLocaleString() : '—'}
        </h3>
      )}
    </div>
  </motion.div>
);

const Dashboard = ({ onNavigate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fullName = localStorage.getItem('userFullName') || 'Admin';
  const firstName = fullName.split(' ')[0];

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API}/api/dashboard/`, {
          headers: { Authorization: `Token ${localStorage.getItem('authToken')}` },
        });
        if (!res.ok) throw new Error('Failed to load dashboard data.');
        setData(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleExport = () => {
    if (!data) return;
    const { stats, recent_requests } = data;
    const lines = [
      'CIMORe Institutional Dashboard Report',
      `Generated: ${new Date().toLocaleString('en-PH')}`,
      '',
      'SUMMARY STATISTICS',
      `Total Requests,${stats.total_requests}`,
      `Pending Requests,${stats.pending_requests}`,
      `Schools Visited,${stats.schools_visited}`,
      `Documents Uploaded,${stats.documents_uploaded}`,
      '',
      'RECENT MARKETING REQUESTS',
      'Type,Requester,Status,Date',
      ...recent_requests.map(r => `"${r.type}","${r.requester}",${r.status},${r.date}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cimore-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = data?.stats;
  const chartData = data?.chart_data || [];
  const recentRequests = data?.recent_requests || [];
  const recentActivity = data?.recent_activity || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-secondary uppercase tracking-tight">Institutional Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, <span className="font-bold text-[#1072b3]">{firstName}</span>. Here is the campus pulse today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm outline-none">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          
          {/* EFFECT: Blue to Yellow */}
          <button
            onClick={handleExport}
            disabled={!data}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] rounded-lg shadow-md outline-none disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-600 uppercase">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Requests" value={stats?.total_requests} icon={TrendingUp} trend="up" color="bg-[#1072b3]" loading={loading} />
        <StatCard title="Pending Requests" value={stats?.pending_requests} icon={Clock} trend="down" color="bg-[#f6ce11]" loading={loading} />
        <StatCard title="Schools Visited" value={stats?.schools_visited} icon={School} trend="up" color="bg-[#03396c]" loading={loading} />
        <StatCard title="Documents Uploaded" value={stats?.documents_uploaded} icon={FileCheck} trend="up" color="bg-[#bdd4e5]" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Trailblazing Activity</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Institutional Outreach</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#1072b3]" />
              <span className="text-[10px] font-black text-slate-500 uppercase">Visits</span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            {loading ? (
              <div className="h-full w-full bg-slate-50 rounded-lg animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1072b3" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#1072b3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} dy={10} />
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

        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Recent Activity</h3>
            {/* EFFECT: Text Blue to Yellow */}
            <button
              onClick={() => onNavigate?.('marketing')}
              className="text-[10px] font-black uppercase tracking-widest text-[#1072b3] hover:text-[#f6ce11] transition-colors"
            >
              View All
            </button>
          </div>
          <div className="space-y-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-slate-50 rounded animate-pulse w-3/4" />
                    <div className="h-2 bg-slate-50 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              recentActivity.map((item, idx) => {
                const meta = NOTIFICATION_META[item.type] || NOTIFICATION_META.request;
                const Icon = meta.icon;
                return (
                  <div key={idx} className="flex gap-4 group cursor-pointer transition-transform hover:translate-x-1">
                    <div className={cn('w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors', meta.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">{item.desc}</p>
                      <p className="text-[9px] text-slate-400 mt-1 uppercase font-black tracking-widest">{timeAgo(item.time)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Recent Marketing Requests</h3>
          <button
            onClick={() => onNavigate?.('marketing')}
            className="text-[10px] font-black uppercase tracking-widest text-[#1072b3] hover:text-[#f6ce11] transition-colors"
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
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-8 py-5"><div className="h-4 bg-slate-50 rounded animate-pulse" /></td></tr>
                ))
              ) : (
                recentRequests.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 text-xs font-black text-slate-800 uppercase tracking-tight">{row.type}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#03396c] flex items-center justify-center text-[10px] font-black text-white uppercase">
                          {row.requester.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <p className="text-xs font-bold text-slate-600">{row.requester}</p>
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
                        className="text-[10px] font-black uppercase tracking-widest text-[#1072b3] hover:text-[#f6ce11] transition-colors"
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
  );
};

export default Dashboard;