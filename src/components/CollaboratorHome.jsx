import React, { useState, useEffect } from 'react';
import { Home, Clock, AlertCircle, ChevronRight, FileText, Image as ImageIcon, ArrowRight, ExternalLink, HelpCircle, Megaphone } from 'lucide-react';
import { cn } from '../lib/utils';
import { API, authHeaders } from '../config/api';

const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-600 border-amber-200',
  Approved: 'bg-green-50 text-green-600 border-green-200',
  Rejected: 'bg-red-50 text-red-600 border-red-200',
  'Returned for Revision': 'bg-red-50 text-red-700 border-red-300',
};

const STATUS_DOT = {
  Pending: 'bg-amber-500',
  Approved: 'bg-green-500',
  Rejected: 'bg-red-500',
  'Returned for Revision': 'bg-red-600',
};

const CollaboratorHome = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState(0);
  
  const [announcements] = useState([
    {
      id: 1,
      tag: "Urgent",
      title: "Quarterly Marketing Review",
      body: "Please ensure all pending Graphic Design requests for the upcoming Foundation Week are submitted by Friday for priority processing.",
      date: "May 05, 2026"
    }
  ]);

  const services = [
    {
      title: "Information Dissemination",
      type: "NEWS & PUBLICITY",
      desc: "Submit official articles and announcements for Social Media and Website publication (250-500 words).",
      icon: <FileText className="w-6 h-6" />,
      action: "Submit Content",
      accent: "border-primary",
      image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070" 
    },
    {
      title: "Production Request",
      type: "MULTIMEDIA & DESIGN",
      desc: "Official request for Social Cards, Videos, Photography, and Graphic Design for institutional events.",
      icon: <ImageIcon className="w-6 h-6" />,
      action: "Start Production",
      accent: "border-secondary",
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070" 
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveService((prev) => (prev + 1) % services.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [services.length]);

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
    <div className="max-w-8xl mx-auto px-2 sm:px-2 lg:px-4 py-2 space-y-4 animate-in fade-in duration-700 bg-bg min-h-screen">
      
      {/* 1. Header */}
      <div className="border-b-2 border-primary pb-2">
        <div className="flex items-center gap-2 text-primary mb-2 uppercase tracking-widest text-[10px] font-black">
          <Home className="w-3 h-3" />
          <span>College Information and Marketing Office</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          
          {/* 2. Service Slider (Carousel) */}
          <div className="bg-white border border-gray-200 shadow-sm relative overflow-hidden h-[340px] md:h-[300px]">
            {services.map((service, idx) => {
              const isActive = activeService === idx;
              return (
                <div 
                  key={idx} 
                  className={cn(
                    "absolute inset-0 w-full h-full p-8 border-l-[6px] transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col justify-center",
                    service.accent,
                    isActive ? "translate-x-0 opacity-100 z-10" : "-translate-x-full opacity-0 z-0"
                  )}
                >
                  {/* Background Image Layer */}
                  <div 
                    className="absolute inset-0 z-0 opacity-[0.20] bg-cover bg-center grayscale pointer-events-none mix-blend-multiply bg-yellow-100 transition-opacity duration-500"
                    style={{ backgroundImage: `url(${service.image})` }}
                  />

                  {/* Foreground Content */}
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-primary text-white shadow-lg animate-in zoom-in duration-700">
                        {service.icon}
                      </div>
                      <div className="flex gap-2">
                        {services.map((_, i) => (
                          <div key={i} className="relative h-1.5 overflow-hidden rounded-full bg-gray-100" style={{ width: activeService === i ? '40px' : '16px' }}>
                            {activeService === i && (
                              <div className="absolute inset-0 bg-primary origin-left animate-[progress_10s_linear_forwards]" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className={cn("transition-all duration-1000 delay-300", isActive ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0")}>
                      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-1">{service.title}</h2>
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-4 opacity-80">{service.type}</p>
                      <p className="text-gray-600 text-sm font-medium leading-relaxed mb-8 max-w-lg">{service.desc}</p>
                      
                      {/* UPDATED BUTTON: Yellow hover effect */}
                      <button className="flex items-center gap-3 bg-primary text-white px-8 py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-gray-900 transition-all duration-300 group shadow-md shadow-primary/20">
                        {service.action} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={cn(
            "p-6 border flex items-center justify-between transition-all duration-500",
            actionRequired.length > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200 opacity-80"
          )}>
            <div className="flex items-center gap-4">
              <AlertCircle className={cn("w-6 h-6", actionRequired.length > 0 ? "text-red-600" : "text-gray-400")} />
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400">System Notifications</span>
                <span className="text-lg font-bold text-gray-900">
                  {actionRequired.length > 0 ? `${actionRequired.length} Items Awaiting Revision` : '0 Items Awaiting Revision'}
                </span>
              </div>
            </div>
            {actionRequired.length > 0 && <ChevronRight className="w-5 h-5 text-red-600 animate-pulse" />}
          </div>

          <div className="border border-gray-200 shadow-sm overflow-hidden bg-white">
            <div className="bg-primary text-white px-6 py-4 flex items-center justify-between font-sans">
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">Submission Log</h3>
              <span className="text-[10px] font-bold opacity-80">{requests.length} RECORDS FOUND</span>
            </div>
            <div className="divide-y divide-gray-100 min-h-[200px]">
              {loading ? (
                <div className="p-12 text-center text-xs font-bold uppercase text-gray-300 animate-pulse">Syncing Portal Data...</div>
              ) : requests.length === 0 ? (
                <div className="p-16 text-center text-gray-400 text-sm font-medium italic">No active records found.</div>
              ) : (
                requests.slice(0, 5).map((req) => (
                  <div key={req.id} className="p-6 hover:bg-bg transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer">
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-gray-900 uppercase tracking-tight group-hover:text-primary transition-colors">
                        {req.title || req.type}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3" /> 
                        Submitted: {new Date(req.created_at).toLocaleDateString()} • REF: #{req.id}
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

        <div className="lg:col-span-4 space-y-4">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-500" /> Announcements
            </h3>
            {announcements.map((ann) => (
              <div key={ann.id} className="relative bg-white border border-gray-200 p-6 shadow-sm overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase px-2 py-0.5 rounded">{ann.tag}</span>
                  <span className="text-[10px] font-bold text-gray-400">{ann.date}</span>
                </div>
                <h3 className="text-sm font-black text-gray-900 uppercase mb-2 tracking-tight">{ann.title}</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">{ann.body}</p>
                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-yellow-500 transition-colors">
                  Read Details <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="border border-gray-200 p-8 space-y-8 bg-white shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2 border-b border-gray-50 pb-2">
              <HelpCircle className="w-4 h-4 text-primary" /> Information Bureau
            </h3>
            <nav className="space-y-4">
              {[
                { title: 'Content Protocols', desc: 'Editorial 250-500 words rule' },
                { title: 'Headline Standards', desc: 'Active voice, 10 words limit' },
                { title: 'Identity Guidelines', desc: 'Official Media & Branding specs' }
              ].map((item, idx) => (
                <a key={idx} href="#" className="block group border-b border-gray-50 pb-4 last:border-0 hover:translate-x-1 transition-transform">
                  <span className="flex items-center justify-between text-sm font-black text-gray-900 group-hover:text-yellow-500 transition-colors uppercase tracking-tight">
                    {item.title} <ExternalLink className="w-3 h-3 text-light" />
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">{item.desc}</span>
                </a>
              ))}
            </nav>
            <button className="w-full py-4 bg-white border-2 border-primary text-primary font-black text-[10px] uppercase tracking-[0.2em] hover:bg-yellow-400 hover:border-yellow-400 hover:text-gray-900 transition-all active:scale-95">
              Contact CIMO Helpdesk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorHome;