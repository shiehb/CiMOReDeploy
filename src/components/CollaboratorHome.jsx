import React, { useState, useEffect } from 'react';
import { Home, Clock, AlertCircle, ChevronRight, FileText, Image, ArrowRight, ExternalLink, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils'; // Assuming you have a cn utility, otherwise use template literals
import { API, authHeaders } from '../config/api';

// Matching constants from your MyRequests page for consistency
const STATUS_STYLES = {
  Pending:  'bg-amber-50 text-amber-600 border-amber-200',
  Approved: 'bg-green-50 text-green-600 border-green-200',
  Rejected: 'bg-red-50 text-red-600 border-red-200',
  'Returned for Revision': 'bg-red-50 text-red-700 border-red-300',
};

const STATUS_DOT = {
  Pending:  'bg-amber-500',
  Approved: 'bg-green-500',
  Rejected: 'bg-red-500',
  'Returned for Revision': 'bg-red-600',
};

const CollaboratorHome = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState(0);

  const services = [
    {
      title: "Information Dissemination",
      type: "NEWS & PUBLICITY",
      desc: "Submit official articles and announcements for Social Media and Website publication (250-500 words).",
      icon: <FileText className="w-6 h-6" />,
      action: "Submit Content",
      accent: "border-primary"
    },
    {
      title: "Production Request",
      type: "MULTIMEDIA & DESIGN",
      desc: "Request for Social Cards, Videos, Photography, and Graphic Design for institutional events.",
      icon: <Image className="w-6 h-6" />,
      action: "Start Production",
      accent: "border-secondary"
    }
  ];

  // 10-Second Auto-cycle (Left-to-Right logic)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveService((prev) => (prev + 1) % services.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [services.length]);

  // Connect live data from the same endpoint as MyRequests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch(`${API}/api/marketing/`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          setRequests(Array.isArray(data) ? data : data.requests || []);
        }
      } catch (err) {
        console.error('Failed to load requests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const actionRequired = requests.filter(r => r.status === 'Returned for Revision');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-700 bg-bg min-h-screen">
      
      {/* Page Header */}
      <div className="border-b-2 border-primary pb-6">
        <div className="flex items-center gap-2 text-primary mb-2 uppercase tracking-widest text-[10px] font-black">
          <Home className="w-3 h-3" />
          <span>Official Portal</span>
        </div>
        <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-wide font-sans">
          College Information and Marketing Office
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          {/* Animated Service Slider */}
          <div className="bg-white border border-gray-200 shadow-sm relative overflow-hidden h-[360px] md:h-[320px]">
            {services.map((service, idx) => {
              const isActive = activeService === idx;
              return (
                <div 
                  key={idx} 
                  className={cn(
                    "absolute inset-0 w-full h-full p-8 border-l-[6px] transition-all duration-1000 ease-in-out flex flex-col justify-center",
                    service.accent,
                    isActive ? "translate-x-0 opacity-100 z-10" : "-translate-x-full opacity-0 z-0"
                  )}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-primary text-white shadow-lg animate-in zoom-in duration-700">
                      {service.icon}
                    </div>
                    
                    {/* 10s Timer Dots */}
                    <div className="flex gap-2">
                      {services.map((_, i) => (
                        <div 
                          key={i}
                          className="relative h-1.5 overflow-hidden rounded-full bg-gray-100 transition-all"
                          style={{ width: activeService === i ? '40px' : '16px' }}
                        >
                          {activeService === i && (
                            <div className="absolute inset-0 bg-primary origin-left animate-[progress_10s_linear_forwards]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className={cn(
                    "transition-all duration-1000 delay-300",
                    isActive ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"
                  )}>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-1">{service.title}</h2>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-4 opacity-80">{service.type}</p>
                    <p className="text-gray-600 text-sm leading-relaxed mb-8 max-w-lg">{service.desc}</p>

                    <button className="flex items-center gap-3 bg-primary text-white px-8 py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-secondary transition-all group shadow-md shadow-primary/20">
                      {service.action} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connected System Notifications */}
          <div className={cn(
            "p-6 border flex items-center justify-between transition-all duration-500",
            actionRequired.length > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200 opacity-80"
          )}>
            <div className="flex items-center gap-4">
              <AlertCircle className={cn("w-6 h-6", actionRequired.length > 0 ? "text-red-600" : "text-gray-400")} />
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400">System Notifications</span>
                <span className="text-lg font-bold text-gray-900">
                  {actionRequired.length} Items Awaiting Revision
                </span>
              </div>
            </div>
            {actionRequired.length > 0 && <ChevronRight className="w-5 h-5 text-red-600 animate-pulse" />}
          </div>

          {/* Connected Submission Log (Live Data) */}
          <div className="border border-gray-200 shadow-sm overflow-hidden bg-white">
            <div className="bg-primary text-white px-6 py-4 flex items-center justify-between font-sans">
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">Submission Log</h3>
              <span className="text-[10px] font-bold opacity-80">{requests.length} RECORDS FOUND</span>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-10 text-center text-xs font-bold uppercase text-gray-300 animate-pulse">Synchronizing Data...</div>
              ) : requests.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm italic">No active records found.</div>
              ) : (
                requests.slice(0, 5).map((req) => (
                  <div key={req.id} className="p-6 hover:bg-bg transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer">
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-gray-900 uppercase tracking-tight group-hover:text-primary transition-colors">
                        {req.title || req.type}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3" /> 
                        Filed: {new Date(req.created_at).toLocaleDateString()} • REF: #{req.id}
                      </p>
                    </div>
                    <span className={cn(
                      'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 border-l-4 shadow-sm',
                      STATUS_STYLES[req.status] || 'bg-gray-100 text-gray-500 border-gray-300'
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[req.status] || 'bg-gray-400')} />
                      {req.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Bureau */}
        <div className="lg:col-span-4">
          <div className="border border-gray-200 p-8 space-y-8 bg-white shadow-sm sticky top-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2 border-b border-gray-50 pb-2">
              <HelpCircle className="w-4 h-4 text-primary" /> Information Bureau
            </h3>
            <nav className="space-y-4">
              {[
                { title: 'Content Protocols', desc: 'Editorial 250-500 words rule' },
                { title: 'Headline Standards', desc: 'Active voice, 10 words limit' },
                { title: 'Identity Guidelines', desc: 'Official Media & Branding specs' }
              ].map((item, idx) => (
                <a key={idx} href="#" className="block group border-b border-gray-50 pb-4 last:border-0 hover:translate-x-1 transition-transform">
                  <span className="flex items-center justify-between text-sm font-black text-gray-900 group-hover:text-primary transition-colors uppercase tracking-tight">
                    {item.title} <ExternalLink className="w-3 h-3 text-light" />
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">{item.desc}</span>
                </a>
              ))}
            </nav>
            <button className="w-full py-4 bg-white border-2 border-primary text-primary font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all">
              Contact CIMO Helpdesk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorHome;