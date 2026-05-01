import React, { useState } from 'react';
import { 
  Search, 
  Upload, 
  FileText, 
  FileImage, 
  FileCode, 
  Eye, 
  Edit2, 
  Printer, 
  BarChart2, 
  TrendingUp, 
  Download, 
  Sparkles,
  MoreVertical,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  File
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

// SLC Corporate Theme Mapping
const THEME = {
  primary: '#1072b3',
  secondary: '#03396c',
  accent: '#f6ce11',
  bg: '#F5F7FA',
};

const DocumentsReports = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const documents = [
    { id: 1, name: 'Marketing Plan 2026.pdf', type: 'PDF', size: '2.4 MB', date: 'Apr 05, 2026', icon: FileText, color: 'text-[#1072b3] bg-blue-50' },
    { id: 2, name: 'Campus Event Photo.jpg', type: 'Image', size: '4.1 MB', date: 'Apr 04, 2026', icon: FileImage, color: 'text-[#03396c] bg-slate-50' },
    { id: 3, name: 'Enrollment Data.xlsx', type: 'Excel', size: '1.2 MB', date: 'Apr 03, 2026', icon: FileText, color: 'text-green-600 bg-green-50' },
    { id: 4, name: 'Social Media Assets.zip', type: 'Archive', size: '15.8 MB', date: 'Apr 02, 2026', icon: FileCode, color: 'text-purple-600 bg-purple-50' },
    { id: 5, name: 'Institutional Report.pdf', type: 'PDF', size: '5.6 MB', date: 'Apr 01, 2026', icon: FileText, color: 'text-[#1072b3] bg-blue-50' },
  ];

  const enrollmentData = [
    { name: '2022', value: 3200 },
    { name: '2023', value: 3500 },
    { name: '2024', value: 3800 },
    { name: '2025', value: 4200 },
    { name: '2026', value: 4500 },
  ];

  const CHART_COLORS = ['#1072b3', '#03396c', '#2F80ED', '#56CCF2', '#f6ce11'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-secondary uppercase tracking-tight">Documents & Reports</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Centralized repository for institutional intelligence and analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* EFFECT: Yellow to Blue flip */}
          <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#f6ce11] text-black rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-[#1072b3] hover:text-white transition-all duration-300 shadow-md">
            <Download className="w-4 h-4" />
            Export All
          </button>
          {/* EFFECT: Blue to Yellow flip */}
          <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1072b3] text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-[#f6ce11] hover:text-black transition-all duration-300 shadow-md group">
            <Upload className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
            Upload Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Document Management Card */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Document Management</h3>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-50 rounded-md transition-colors text-slate-400">
                <Filter className="w-4 h-4" />
              </button>
            </div>
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
            {documents.map((doc) => {
              const Icon = doc.icon;
              return (
                <div key={doc.id} className="p-4 bg-slate-50/50 hover:bg-white hover:shadow-lg border border-transparent hover:border-slate-100 rounded-lg transition-all group flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105", doc.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{doc.type}</span>
                      <span className="text-[9px] font-black text-slate-400 opacity-30">•</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{doc.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:text-[#1072b3] transition-colors"><Eye className="w-4 h-4" /></button>
                    <button className="p-2 hover:text-[#f6ce11] transition-colors"><Download className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reports & Analytics */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Enrollment Trends</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Institutional Growth Analytics</p>
              </div>
              <BarChart2 className="w-5 h-5 text-slate-300" />
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} />
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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Conversion Rate</p>
              <div className="flex items-center justify-between">
                <h4 className="text-2xl font-black text-slate-900">68.4%</h4>
                <div className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  <ArrowUpRight className="w-3 h-3" />
                  +4.2%
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Enrollees</p>
              <div className="flex items-center justify-between">
                <h4 className="text-2xl font-black text-slate-900">4,520</h4>
                <div className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  <ArrowUpRight className="w-3 h-3" />
                  +12%
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="bg-[#03396c] p-8 rounded-lg shadow-xl shadow-slate-200 text-white relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <div className="flex items-center gap-3 mb-5">
              <Sparkles className="w-5 h-5 text-[#f6ce11]" />
              <h3 className="text-xs font-black uppercase tracking-widest">Predictive Intelligence</h3>
            </div>
            <div className="space-y-5">
              <div className="p-5 bg-white/10 backdrop-blur-md rounded-lg border border-white/10">
                <p className="text-xs font-medium leading-relaxed">
                  Based on current trends, enrollment for 2027 is projected to increase by <span className="text-[#f6ce11] font-black">15%</span>. 
                  Target marketing efforts on <span className="text-[#f6ce11] font-black">STEM strands</span> in Bangar, La Union.
                </p>
              </div>
              <button className="w-full py-3.5 bg-[#f6ce11] text-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center justify-center gap-2">
                Generate Full Analysis
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsReports;