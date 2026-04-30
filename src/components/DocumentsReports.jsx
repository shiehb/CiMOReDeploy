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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const DocumentsReports = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const documents = [
    { id: 1, name: 'Marketing Plan 2026.pdf', type: 'PDF', size: '2.4 MB', date: 'Apr 05, 2026', icon: FileText, color: 'text-red-500 bg-red-50' },
    { id: 2, name: 'Campus Event Photo.jpg', type: 'Image', size: '4.1 MB', date: 'Apr 04, 2026', icon: FileImage, color: 'text-blue-500 bg-blue-50' },
    { id: 3, name: 'Enrollment Data.xlsx', type: 'Excel', size: '1.2 MB', date: 'Apr 03, 2026', icon: FileText, color: 'text-green-500 bg-green-50' },
    { id: 4, name: 'Social Media Assets.zip', type: 'Archive', size: '15.8 MB', date: 'Apr 02, 2026', icon: FileCode, color: 'text-purple-500 bg-purple-50' },
    { id: 5, name: 'Institutional Report.pdf', type: 'PDF', size: '5.6 MB', date: 'Apr 01, 2026', icon: FileText, color: 'text-red-500 bg-red-50' },
  ];

  const enrollmentData = [
    { name: '2022', value: 3200 },
    { name: '2023', value: 3500 },
    { name: '2024', value: 3800 },
    { name: '2025', value: 4200 },
    { name: '2026', value: 4500 },
  ];

  const COLORS = ['#1E4FA3', '#2F80ED', '#56CCF2', '#FFD600'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents & Reports</h2>
          <p className="text-gray-500 text-sm mt-1">Centralized repository for institutional intelligence and analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <Download className="w-5 h-5" />
            Export All
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group">
            <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
            Upload Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Side: Document Management */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Document Management</h3>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <Filter className="w-4 h-4 text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search documents..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {documents.map((doc) => {
              const Icon = doc.icon;
              return (
                <div key={doc.id} className="p-4 bg-gray-50/50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 rounded-2xl transition-all group flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", doc.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{doc.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{doc.type}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">•</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{doc.size}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">•</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{doc.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors" title="Print">
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Reports & Analytics */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Enrollment Trends</h3>
                <p className="text-sm text-gray-500">Annual institutional growth</p>
              </div>
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <BarChart2 className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#F1F5F9' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {enrollmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Conversion Rate</p>
              <div className="flex items-center justify-between">
                <h4 className="text-2xl font-bold text-gray-900">68.4%</h4>
                <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <ArrowUpRight className="w-3 h-3" />
                  +4.2%
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Enrollees</p>
              <div className="flex items-center justify-between">
                <h4 className="text-2xl font-bold text-gray-900">4,520</h4>
                <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <ArrowUpRight className="w-3 h-3" />
                  +12%
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary to-secondary p-8 rounded-3xl shadow-lg shadow-primary/20 text-white relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-accent" />
              <h3 className="text-lg font-bold">AI Predictive Insights</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <p className="text-sm font-medium leading-relaxed">
                  Based on current trends, enrollment for 2027 is projected to increase by <span className="text-accent font-bold">15%</span>. 
                  We recommend focusing marketing efforts on <span className="text-accent font-bold">STEM strands</span> in Bangar, La Union.
                </p>
              </div>
              <button className="w-full py-3 bg-accent text-primary rounded-xl text-sm font-bold hover:bg-white hover:text-primary transition-all flex items-center justify-center gap-2">
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
