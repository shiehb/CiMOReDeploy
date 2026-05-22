import React, { useState, useEffect } from 'react';
import {
  Search, Upload, FileText, FileCode, Eye,
  BarChart2, TrendingUp, TrendingDown, Download, Sparkles,
  Filter, ArrowUpRight, ArrowDownRight, File,
  X, Minus, Building2, Users, CheckCircle, Clock, Printer,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { API, authHeaders, apiFetch } from '../config/api';

const THEME = {
  primary: '#1072b3',
  secondary: '#03396c',
  accent: '#f6ce11',
};

const CHART_COLORS = ['#1072b3', '#03396c', '#2F80ED', '#56CCF2', '#f6ce11'];

const DOC_TYPE_CONFIG = {
  Report:   { icon: FileText, color: 'text-[#1072b3] bg-blue-50' },
  Document: { icon: File,     color: 'text-[#03396c] bg-slate-50' },
  Memo:     { icon: FileText, color: 'text-green-600 bg-green-50' },
  Proposal: { icon: FileCode, color: 'text-purple-600 bg-purple-50' },
};
const DEFAULT_DOC_CONFIG = { icon: FileText, color: 'text-slate-500 bg-slate-50' };

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReportHTML({ schools, requests, analysisData, reportDate }) {
  const metrics           = analysisData?.metrics           ?? {};
  const enrollment_trends = analysisData?.enrollment_trends ?? [];
  const predictions       = analysisData?.predictions       ?? {};
  const insights          = analysisData?.insights          ?? [];

  const statusCounts = { Approved: 0, Pending: 0, Rejected: 0, Cancelled: 0 };
  requests.forEach(r => { if (r.status in statusCounts) statusCounts[r.status]++; });

  const allTrends = [
    ...enrollment_trends,
    ...(predictions.predicted_value != null && predictions.next_year
      ? [{ name: predictions.next_year, value: predictions.predicted_value, isPrediction: true }]
      : []),
  ];
  const maxVal = Math.max(...allTrends.map(t => t.value), 1);

  const trendBars = allTrends.map(t => {
    const w = Math.round((t.value / maxVal) * 100);
    const barStyle = t.isPrediction
      ? `background:repeating-linear-gradient(45deg,#555 0,#555 2px,#ccc 2px,#ccc 6px);`
      : `background:#333;`;
    return `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
        <div style="width:44px;text-align:right;font-size:10px;font-weight:700;color:#555;">${escapeHtml(t.name)}</div>
        <div style="flex:1;background:#e5e5e5;height:18px;">
          <div style="height:100%;width:${w}%;${barStyle}"></div>
        </div>
        <div style="width:100px;font-size:10px;font-weight:700;color:#000;">
          ${t.value.toLocaleString()}${t.isPrediction ? ' *' : ''}
        </div>
      </div>`;
  }).join('');

  const schoolRows = schools.map((s, i) => `
    <tr style="${i % 2 === 1 ? 'background:#f5f5f5;' : ''}">
      <td>${escapeHtml(s.school_name)}</td>
      <td>${escapeHtml(s.address || '—')}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(s.offered_strands || '—')}</td>
      <td style="text-align:center;font-weight:700;">${(s.estimated_students ?? 0).toLocaleString()}</td>
      <td style="text-align:center;">${escapeHtml(s.last_visited || '—')}</td>
    </tr>`).join('');

  const reqRows = requests.map((r, i) => {
    const d = r.created_at
      ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      : '—';
    return `
      <tr style="${i % 2 === 1 ? 'background:#f5f5f5;' : ''}">
        <td style="font-weight:700;">#${r.id}</td>
        <td style="font-weight:600;">${escapeHtml(r.title || r.type || '—')}</td>
        <td>${escapeHtml(r.requester_name || '—')}</td>
        <td style="font-weight:800;text-transform:uppercase;font-size:10px;">${escapeHtml(r.status)}</td>
        <td>${d}</td>
      </tr>`;
  }).join('');

  const insightItems = insights.map((ins, i) => `
    <div style="display:flex;gap:10px;padding:8px 10px;margin-bottom:6px;border-left:3px solid #000;">
      <span style="font-weight:900;font-size:10px;min-width:20px;color:#000;">${String(i + 1).padStart(2, '0')}.</span>
      <p style="font-size:11px;color:#333;line-height:1.55;margin:0;">${escapeHtml(ins)}</p>
    </div>`).join('');

  const statusCards = Object.keys(statusCounts).map(label => `
    <div style="flex:1;padding:10px;text-align:center;border:1px solid #aaa;">
      <div style="font-size:22px;font-weight:900;color:#000;">${statusCounts[label]}</div>
      <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#555;margin-top:3px;">${label}</div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>CiMORe Institutional Report — ${reportDate}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Times New Roman',Times,serif;color:#000;background:#fff;font-size:12px}
    .pg{padding:28px 36px;max-width:900px;margin:0 auto;}
    .pg+.pg{page-break-before:always;break-before:page;}
    h1{font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:14px;}
    h2{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #555;padding-bottom:4px;margin:14px 0 10px;}
    .meta{font-size:10px;color:#555;margin-bottom:14px;}
    .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;}
    .metric{border:1px solid #999;padding:10px;}
    .metric .lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#555;margin-bottom:4px;}
    .metric .val{font-size:22px;font-weight:900;color:#000;}
    .metric .sub{font-size:9px;color:#666;margin-top:2px;}
    table{width:100%;border-collapse:collapse;font-size:10px;margin-top:8px;}
    th{background:#000;color:#fff;padding:6px 8px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;}
    td{padding:5px 8px;border-bottom:1px solid #ddd;vertical-align:middle;}
    .status-row{display:flex;gap:8px;margin-bottom:10px;}
    .foot{margin-top:18px;border-top:1px solid #aaa;padding-top:8px;font-size:9px;color:#555;text-align:center;}
    .note{font-size:9px;color:#555;margin-top:8px;}
    @media print{
      body{padding:0;}
      .pg{padding:18px 24px;}
    }
  </style>
</head>
<body>

  <!-- PAGE 1: Summary Metrics + Enrollment Trends + Predictive Intelligence -->
  <div class="pg">
    <h1>CiMORe Institutional Report</h1>
    <p class="meta">Generated: ${reportDate} &nbsp;&nbsp;|&nbsp;&nbsp; CiMORe — CIMO Institutional Intelligence Hub &nbsp;&nbsp;|&nbsp;&nbsp; CONFIDENTIAL</p>

    <h2>Summary Metrics</h2>
    <div class="metrics">
      <div class="metric">
        <div class="lbl">Total Schools</div>
        <div class="val">${metrics.total_schools ?? '—'}</div>
        <div class="sub">Trailblazed institutions</div>
      </div>
      <div class="metric">
        <div class="lbl">Est. Students</div>
        <div class="val">${(metrics.total_estimated_students ?? 0).toLocaleString()}</div>
        <div class="sub">Across all schools</div>
      </div>
      <div class="metric">
        <div class="lbl">Conversion Rate</div>
        <div class="val">${metrics.conversion_rate ?? 0}%</div>
        <div class="sub">Requests approved</div>
      </div>
      <div class="metric">
        <div class="lbl">Total Requests</div>
        <div class="val">${metrics.total_requests ?? '—'}</div>
        <div class="sub">${metrics.pending_requests ?? 0} pending</div>
      </div>
    </div>

    <h2>Enrollment Potential Trends</h2>
    ${trendBars || '<p style="font-size:11px;color:#555;">No enrollment data available.</p>'}
    ${predictions.predicted_value != null
      ? `<p class="note">* Hatched bar = predicted value for ${escapeHtml(predictions.next_year ?? '')}${predictions.predicted_growth_pct != null ? ` (${predictions.predicted_growth_pct > 0 ? '+' : ''}${predictions.predicted_growth_pct}% projected)` : ''}. Based on linear regression of historical data.</p>`
      : ''}

    ${insights.length > 0 ? `
    <h2>Predictive Intelligence</h2>
    ${insightItems}` : ''}

    <div class="foot">CiMORe — CIMO Institutional Intelligence Hub &nbsp;·&nbsp; Confidential &nbsp;·&nbsp; ${reportDate} &nbsp;·&nbsp; Page 1</div>
  </div>

  <!-- PAGE 2: Marketing Requests -->
  <div class="pg">
    <h1>Marketing Requests</h1>
    <p class="meta">Total: ${requests.length} &nbsp;&nbsp;|&nbsp;&nbsp; ${reportDate}</p>

    <h2>Status Breakdown</h2>
    <div class="status-row">${statusCards}</div>

    <h2>Request Log</h2>
    ${requests.length > 0
      ? `<table>
           <thead><tr>
             <th>ID</th><th>Title / Type</th><th>Requester</th><th>Status</th><th>Date</th>
           </tr></thead>
           <tbody>${reqRows}</tbody>
         </table>`
      : '<p style="font-size:11px;color:#555;margin-top:8px;">No requests found.</p>'}

    <div class="foot">CiMORe — CIMO Institutional Intelligence Hub &nbsp;·&nbsp; Confidential &nbsp;·&nbsp; ${reportDate} &nbsp;·&nbsp; Page 2</div>
  </div>

  <!-- PAGE 3: School Intelligence / Trailblazing -->
  <div class="pg">
    <h1>School Intelligence — Trailblazing</h1>
    <p class="meta">Total Schools: ${schools.length} &nbsp;&nbsp;|&nbsp;&nbsp; ${reportDate}</p>

    <h2>School Records</h2>
    ${schools.length > 0
      ? `<table>
           <thead><tr>
             <th>School Name</th><th>Address</th><th>Offered Strands</th>
             <th style="text-align:center;">Est. Students</th><th style="text-align:center;">Last Visited</th>
           </tr></thead>
           <tbody>${schoolRows}</tbody>
         </table>`
      : '<p style="font-size:11px;color:#555;margin-top:8px;">No school records available.</p>'}

    <div class="foot">CiMORe — CIMO Institutional Intelligence Hub &nbsp;·&nbsp; Confidential &nbsp;·&nbsp; ${reportDate} &nbsp;·&nbsp; Page 3</div>
  </div>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Export Preview Modal
// ---------------------------------------------------------------------------

function ExportPreviewModal({ analysisData, onClose }) {
  const [schools, setSchools]   = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [schoolsRes, reqsRes] = await Promise.all([
          apiFetch(`${API}/api/schools/`,    { headers: authHeaders() }),
          apiFetch(`${API}/api/marketing/`,  { headers: authHeaders() }),
        ]);
        if (schoolsRes.ok) setSchools(await schoolsRes.json());
        if (reqsRes.ok)    setRequests(await reqsRes.json());
      } catch (e) {
        console.error('Export fetch failed', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const metrics          = analysisData?.metrics          ?? {};
  const enrollment_trends = analysisData?.enrollment_trends ?? [];
  const predictions      = analysisData?.predictions      ?? {};
  const insights         = analysisData?.insights         ?? [];

  const chartData = [
    ...enrollment_trends,
    ...(predictions.next_year && predictions.predicted_value != null
      ? [{ name: predictions.next_year, value: predictions.predicted_value, isPrediction: true }]
      : []),
  ];

  const statusCounts = { Approved: 0, Pending: 0, Rejected: 0, Cancelled: 0 };
  requests.forEach(r => { if (r.status in statusCounts) statusCounts[r.status]++; });

  const handlePrint = () => {
    const html = buildReportHTML({ schools, requests, analysisData, reportDate });
    const w = window.open('', '_blank', 'width=1020,height=760');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 600);
  };

  const handleDownload = () => {
    const html = buildReportHTML({ schools, requests, analysisData, reportDate });
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `CiMORe-Report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const STATUS_CONFIG = [
    { label: 'Approved',  bg: 'bg-green-50 border-green-100',  text: 'text-green-600'  },
    { label: 'Pending',   bg: 'bg-amber-50 border-amber-100',  text: 'text-amber-600'  },
    { label: 'Rejected',  bg: 'bg-red-50   border-red-100',    text: 'text-red-600'    },
    { label: 'Cancelled', bg: 'bg-slate-50 border-slate-100',  text: 'text-slate-500'  },
  ];

  const STATUS_BADGE = {
    Approved:  'text-green-600 bg-green-50',
    Pending:   'text-amber-600 bg-amber-50',
    Rejected:  'text-red-600   bg-red-50',
    Cancelled: 'text-slate-500 bg-slate-100',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col"
      >
        {/* Sticky toolbar */}
        <div className="bg-[#03396c] text-white px-8 py-5 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-[#f6ce11]" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">Export Preview</h2>
              <p className="text-[10px] text-white/60 mt-0.5">{reportDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#f6ce11] hover:bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <div className="w-px h-6 bg-white/20 mx-1" />
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable report body */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-xs font-bold">
              Loading report data…
            </div>
          ) : (
            <div className="p-8 space-y-10">

              {/* Summary Metrics */}
              <section>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Summary Metrics</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Schools',    value: metrics.total_schools ?? 0,                              Icon: Building2,   iconCls: 'text-[#1072b3]', bgCls: 'bg-blue-50' },
                    { label: 'Est. Students',    value: (metrics.total_estimated_students ?? 0).toLocaleString(), Icon: Users,       iconCls: 'text-[#03396c]', bgCls: 'bg-slate-100' },
                    { label: 'Conversion Rate',  value: `${metrics.conversion_rate ?? 0}%`,                      Icon: CheckCircle, iconCls: 'text-green-600', bgCls: 'bg-green-50' },
                    { label: 'Pending Requests', value: metrics.pending_requests ?? 0,                           Icon: Clock,       iconCls: 'text-amber-500', bgCls: 'bg-amber-50' },
                  ].map(({ label, value, Icon, iconCls, bgCls }) => (
                    <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', bgCls)}>
                        <Icon className={cn('w-4 h-4', iconCls)} />
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                      <p className="text-2xl font-black text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Enrollment Trends */}
              <section>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Enrollment Potential Trends</p>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-6">
                  {chartData.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}
                            cursor={{ fill: '#F1F5F9' }}
                            formatter={(v, _n, props) => [Number(v).toLocaleString(), props.payload.isPrediction ? 'Predicted' : 'Est. Students']}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, i) => (
                              <Cell
                                key={`cell-${i}`}
                                fill={entry.isPrediction ? '#f6ce11' : CHART_COLORS[i % (CHART_COLORS.length - 1)]}
                                opacity={entry.isPrediction ? 0.75 : 1}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-56 flex items-center justify-center text-slate-400 text-xs font-bold">
                      No enrollment data available.
                    </div>
                  )}
                  {predictions.next_year && predictions.predicted_value != null && (
                    <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1.5">
                      <span className="inline-block w-3 h-2 rounded-sm bg-[#f6ce11] opacity-75" />
                      Gold bar = predicted value for {predictions.next_year}
                      {predictions.predicted_growth_pct != null && (
                        <span className="ml-1 font-black text-amber-600">
                          ({predictions.predicted_growth_pct > 0 ? '+' : ''}{predictions.predicted_growth_pct}% projected)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </section>

              {/* Trailblazing */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">School Intelligence — Trailblazing</p>
                  <span className="text-[9px] font-black text-[#1072b3] bg-blue-50 px-2 py-1 rounded-md">
                    {schools.length} {schools.length === 1 ? 'School' : 'Schools'}
                  </span>
                </div>
                {schools.length > 0 ? (
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            {['School Name', 'Address', 'Offered Strands', 'Est. Students', 'Last Visited'].map(h => (
                              <th key={h} className="text-left py-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {schools.map((s, i) => (
                            <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="py-3 px-4 font-bold text-slate-800">{s.school_name}</td>
                              <td className="py-3 px-4 text-slate-500">{s.address || '—'}</td>
                              <td className="py-3 px-4 text-slate-500 max-w-[160px] truncate">{s.offered_strands || '—'}</td>
                              <td className="py-3 px-4 font-black text-[#1072b3] text-center">{(s.estimated_students ?? 0).toLocaleString()}</td>
                              <td className="py-3 px-4 text-slate-500 text-center">{s.last_visited || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl py-10 text-center text-slate-400 text-xs font-bold">
                    No school records available.
                  </div>
                )}
              </section>

              {/* Marketing Requests */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Marketing Requests</p>
                  <span className="text-[9px] font-black text-[#1072b3] bg-blue-50 px-2 py-1 rounded-md">
                    {requests.length} Total
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {STATUS_CONFIG.map(({ label, bg, text }) => (
                    <div key={label} className={cn('rounded-xl p-4 border text-center', bg)}>
                      <p className={cn('text-2xl font-black', text)}>{statusCounts[label]}</p>
                      <p className={cn('text-[9px] font-black uppercase tracking-widest mt-1', text)}>{label}</p>
                    </div>
                  ))}
                </div>
                {requests.length > 0 ? (
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            {['ID', 'Title / Type', 'Requester', 'Status', 'Date'].map(h => (
                              <th key={h} className="text-left py-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {requests.map((r, i) => (
                            <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="py-3 px-4 font-black text-slate-400">#{r.id}</td>
                              <td className="py-3 px-4 font-bold text-slate-800 max-w-[200px] truncate">{r.title || r.type || '—'}</td>
                              <td className="py-3 px-4 text-slate-500">{r.requester_name || '—'}</td>
                              <td className="py-3 px-4">
                                <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md', STATUS_BADGE[r.status] ?? 'text-slate-500 bg-slate-100')}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500">{formatDate(r.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl py-10 text-center text-slate-400 text-xs font-bold">
                    No requests found.
                  </div>
                )}
              </section>

              {/* Insights */}
              {insights.length > 0 && (
                <section>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Predictive Intelligence</p>
                  <div className="space-y-2">
                    {insights.map((ins, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[#1072b3] font-black text-[10px] shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                        <p className="text-xs font-medium text-slate-700 leading-relaxed">{ins}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function AnalysisModal({ data, onClose }) {
  if (!data) return null;
  const { enrollment_trends = [], metrics = {}, predictions = {}, top_strands = [], documents_by_type = {}, insights = [] } = data;

  const TrendIcon =
    predictions.trend_direction === 'upward' ? TrendingUp
    : predictions.trend_direction === 'downward' ? TrendingDown
    : Minus;

  const trendColorClass =
    predictions.trend_direction === 'upward' ? 'text-green-600 bg-green-50'
    : predictions.trend_direction === 'downward' ? 'text-red-600 bg-red-50'
    : 'text-slate-600 bg-slate-100';

  const chartData = [
    ...enrollment_trends,
    ...(predictions.next_year && predictions.predicted_value != null
      ? [{ name: predictions.next_year, value: predictions.predicted_value, isPrediction: true }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#03396c] text-white px-8 py-6 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#f6ce11]" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">Full Institutional Analysis</h2>
              <p className="text-[10px] text-white/60 mt-0.5">Generated from live system data</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Schools',   value: metrics.total_schools,                             icon: Building2,    color: 'text-[#1072b3]' },
              { label: 'Est. Students',   value: (metrics.total_estimated_students ?? 0).toLocaleString(), icon: Users, color: 'text-[#03396c]' },
              { label: 'Conversion Rate', value: `${metrics.conversion_rate ?? 0}%`,                icon: CheckCircle,  color: 'text-green-600' },
              { label: 'Pending Requests', value: metrics.pending_requests,                         icon: Clock,        color: 'text-amber-500' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn('w-4 h-4', color)} />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                </div>
                <p className="text-2xl font-black text-slate-900">{value ?? '—'}</p>
              </div>
            ))}
          </div>

          {/* Enrollment trend chart */}
          <div className="bg-slate-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Enrollment Potential Trend</h3>
                <p className="text-[10px] text-slate-400 mt-1">Estimated students from visited schools, by year</p>
              </div>
              <div className={cn('flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-lg', trendColorClass)}>
                <TrendIcon className="w-3 h-3" />
                {predictions.predicted_growth_pct != null
                  ? `${predictions.predicted_growth_pct > 0 ? '+' : ''}${predictions.predicted_growth_pct}% projected`
                  : predictions.trend_direction || 'stable'}
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}
                      cursor={{ fill: '#F1F5F9' }}
                      formatter={(value, _name, props) => [
                        Number(value).toLocaleString(),
                        props.payload.isPrediction ? 'Predicted' : 'Estimated Students',
                      ]}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isPrediction ? '#f6ce11' : CHART_COLORS[index % (CHART_COLORS.length - 1)]}
                          opacity={entry.isPrediction ? 0.75 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-bold">
                No enrollment trend data available yet.
              </div>
            )}

            {predictions.next_year && predictions.predicted_value != null && (
              <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1.5">
                <span className="inline-block w-3 h-2 rounded-sm bg-[#f6ce11] opacity-75" />
                Gold bar = predicted value for {predictions.next_year}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top strands */}
            {top_strands.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Top Offered Strands</h3>
                <div className="space-y-3">
                  {top_strands.map(({ name, count }) => (
                    <div key={name} className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-700 shrink-0">{name}</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="h-1.5 bg-[#1072b3] rounded-full shrink-0"
                          style={{ width: `${Math.max(20, (count / top_strands[0].count) * 80)}px` }}
                        />
                        <span className="text-[10px] font-black text-slate-400">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents by type */}
            {Object.keys(documents_by_type).length > 0 && (
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Documents by Type</h3>
                <div className="space-y-3">
                  {Object.entries(documents_by_type).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{type}</span>
                      <span className="text-[10px] font-black text-[#1072b3] bg-blue-50 px-2 py-1 rounded-md">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="bg-[#03396c] rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#f6ce11]" />
                <h3 className="text-xs font-black uppercase tracking-widest">System Intelligence Insights</h3>
              </div>
              <div className="space-y-3">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-white/10 rounded-lg">
                    <span className="text-[#f6ce11] font-black text-xs mt-0.5 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-xs font-medium leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const DocumentsReports = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [docsRes, analysisRes] = await Promise.all([
          apiFetch(`${API}/api/documents/`, { headers: authHeaders() }),
          apiFetch(`${API}/api/documents/analysis/`, { headers: authHeaders() }),
        ]);
        if (docsRes.ok) setDocuments(await docsRes.json());
        if (analysisRes.ok) setAnalysisData(await analysisRes.json());
      } catch (e) {
        console.error('Failed to load documents data', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleGenerateAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const res = await apiFetch(`${API}/api/documents/analysis/`, { headers: authHeaders() });
      if (res.ok) {
        setAnalysisData(await res.json());
        setShowModal(true);
      }
    } catch (e) {
      console.error('Analysis fetch failed', e);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const filtered = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enrollmentData = analysisData?.enrollment_trends ?? [];
  const metrics       = analysisData?.metrics ?? {};
  const insights      = analysisData?.insights ?? [];
  const firstInsight  = insights[0] ?? null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-secondary uppercase tracking-tight">Documents & Reports</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Centralized repository for institutional intelligence and analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#f6ce11] text-black rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-[#1072b3] hover:text-white transition-all duration-300 shadow-md"
          >
            <Download className="w-4 h-4" />
            Export All
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1072b3] text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-[#f6ce11] hover:text-black transition-all duration-300 shadow-md group">
            <Upload className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
            Upload Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Document Management */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Document Management</h3>
            <button className="p-2 hover:bg-slate-50 rounded-md transition-colors text-slate-400">
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1072b3] transition-colors" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:bg-white focus:border-[#1072b3] transition-all"
            />
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">Loading documents…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">
                {searchQuery ? 'No documents match your search.' : 'No documents uploaded yet.'}
              </div>
            ) : (
              filtered.map((doc) => {
                const cfg  = DOC_TYPE_CONFIG[doc.type] ?? DEFAULT_DOC_CONFIG;
                const Icon = cfg.icon;
                return (
                  <div
                    key={doc.id}
                    className="p-4 bg-slate-50/50 hover:bg-white hover:shadow-lg border border-transparent hover:border-slate-100 rounded-lg transition-all group flex items-center gap-4"
                  >
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105', cfg.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{doc.type}</span>
                        <span className="text-[9px] font-black text-slate-400 opacity-30">•</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:text-[#1072b3] transition-colors"><Eye className="w-4 h-4" /></button>
                      <button className="p-2 hover:text-[#f6ce11] transition-colors"><Download className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Reports & Analytics */}
        <div className="space-y-6">
          {/* Enrollment trend chart */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Enrollment Trends</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Institutional Growth Analytics</p>
              </div>
              <BarChart2 className="w-5 h-5 text-slate-300" />
            </div>
            <div className="h-[250px] w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                  Loading chart data…
                </div>
              ) : enrollmentData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                  No enrollment data available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enrollmentData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}
                      cursor={{ fill: '#F1F5F9' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {enrollmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Summary metric cards */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Conversion Rate</p>
              <div className="flex items-center justify-between">
                <h4 className="text-2xl font-black text-slate-900">
                  {loading ? '—' : `${metrics.conversion_rate ?? 0}%`}
                </h4>
                {!loading && metrics.yoy_change != null && (
                  <div className={cn(
                    'flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-md',
                    metrics.yoy_change >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50',
                  )}>
                    {metrics.yoy_change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {metrics.yoy_change > 0 ? '+' : ''}{metrics.yoy_change}%
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Est. Students</p>
              <div className="flex items-center justify-between">
                <h4 className="text-2xl font-black text-slate-900">
                  {loading ? '—' : (metrics.total_estimated_students ?? 0).toLocaleString()}
                </h4>
                {!loading && metrics.total_schools != null && (
                  <div className="text-[9px] font-black text-[#1072b3] bg-blue-50 px-2 py-1 rounded-md">
                    {metrics.total_schools} schools
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Insights card */}
          <div className="bg-[#03396c] p-8 rounded-lg shadow-xl shadow-slate-200 text-white relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <div className="flex items-center gap-3 mb-5">
              <Sparkles className="w-5 h-5 text-[#f6ce11]" />
              <h3 className="text-xs font-black uppercase tracking-widest">Predictive Intelligence</h3>
            </div>
            <div className="space-y-5">
              <div className="p-5 bg-white/10 backdrop-blur-md rounded-lg border border-white/10">
                <p className="text-xs font-medium leading-relaxed">
                  {loading
                    ? 'Loading insights…'
                    : firstInsight ?? 'No data available yet. Add schools and marketing requests to generate insights.'}
                </p>
              </div>
              <button
                onClick={handleGenerateAnalysis}
                disabled={analysisLoading}
                className="w-full py-3.5 bg-[#f6ce11] text-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {analysisLoading ? 'Generating…' : 'Generate Full Analysis'}
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis modal */}
      {showModal && (
        <AnalysisModal data={analysisData} onClose={() => setShowModal(false)} />
      )}

      {/* Export preview modal */}
      {showExportModal && (
        <ExportPreviewModal analysisData={analysisData} onClose={() => setShowExportModal(false)} />
      )}
    </div>
  );
};

export default DocumentsReports;
