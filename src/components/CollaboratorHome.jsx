import React, { useState, useEffect } from 'react';
import { Home, Clock, ChevronRight, FileText, Image as ImageIcon, ArrowRight, ExternalLink, HelpCircle, Megaphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { API, authHeaders } from '../config/api';

// SLC Corporate Theme Mapping
const THEME = {
  primary: '#1072b3',   // SLC Corporate Blue
  secondary: '#03396c', // SLC Deep Navy
  light: '#bdd4e5',     // Soft Sky Blue
  accent: '#f6ce11',    // SLC Gold
  bg: '#F5F7FA',
};

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

const CollaboratorHome = ({ onNavigate }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnn, setSelectedAnn] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`${API}/api/announcements/`, { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        setAnnouncements(
          (Array.isArray(data) ? data : data.results ?? []).map(a => ({
            id:    a.id,
            tag:   a.target === 'All Collaborators' ? 'Collaborators' : a.target === 'All Staff' ? 'Staff' : 'Announcement',
            title: a.title  || 'Announcement',
            body:  a.message || '',
            date:  a.created_at
              ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
              : '',
          }))
        );
      } catch {
        // silently ignore; section stays hidden when empty
      }
    };
    fetchAnnouncements();
  }, []);

  const services = [
    {
      title: "Information Dissemination",
      type: "NEWS & PUBLICITY",
      desc: "Submit official articles and announcements for Social Media and Website publication (250-500 words).",
      icon: <FileText className="w-6 h-6" />,
      action: "Submit Content",
      accent: "border-[#1072b3]",
      image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070" 
    },
    {
      title: "Production Request",
      type: "MULTIMEDIA & DESIGN",
      desc: "Official request for Social Cards, Videos, Photography, and Graphic Design for institutional events.",
      icon: <ImageIcon className="w-6 h-6" />,
      action: "Start Production",
      accent: "border-[#03396c]",
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070" 
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) {
        setActiveService((prev) => (prev + 1) % services.length);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [services.length, isPaused]);

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

  const InformationBureauContent = () => (
    <div className="border border-slate-200/80 p-8 space-y-8 bg-white shadow rounded-lg">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-secondary/70 flex items-center gap-2 border-b border-slate-50 pb-2">
        <HelpCircle className="w-4 h-4" style={{ color: THEME.primary }} /> Information Bureau
      </h3>
      <nav className="space-y-4">
        {[
          { title: 'Content Protocols', desc: 'Editorial 250-500 words rule' },
          { title: 'Headline Standards', desc: 'Active voice, 10 words limit' },
          { title: 'Identity Guidelines', desc: 'Official Media & Branding specs' }
        ].map((item, idx) => (
          <a key={idx} href="#" className="block group border-b border-slate-50 pb-4 last:border-0 hover:translate-x-1 transition-transform outline-none">
            <span className="flex items-center justify-between text-sm font-black text-slate-900 group-hover:text-[#1072b3] transition-colors uppercase tracking-tight">
              {item.title} <ExternalLink className="w-3 h-3 opacity-50" />
            </span>
            <span className="text-[11px] text-slate-500 font-medium">{item.desc}</span>
          </a>
        ))}
      </nav>
      {/* EFFECT: Reverse Ghost (White/Blue to Yellow/Black) */}
      <button 
        style={{ color: THEME.primary, borderColor: THEME.primary }}
        className="w-full py-4 bg-white border-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 hover:bg-[#f6ce11] hover:border-[#f6ce11] hover:text-black active:scale-95 outline-none rounded-lg"
      >
        Contact CIMO Helpdesk
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-700 min-h-screen" style={{ backgroundColor: THEME.bg }}>
      
      {/* Branding Header */}
      <div className="border-b-2 pb-3" style={{ borderColor: THEME.primary }}>
        <div className="flex items-center gap-2 mb-1 uppercase tracking-widest text-[11px] font-black" style={{ color: THEME.primary }}>
          <Home className="w-3.5 h-3.5" />
          <span>Saint Louis College • CiMORe</span>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* CAROUSEL SECTION */}
          <div 
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="bg-white border border-slate-200/80 shadow relative overflow-hidden h-[400px] md:h-[350px] rounded-lg"
          >
            {services.map((service, idx) => {
              const isActive = activeService === idx;
              return (
                <div key={idx} className={cn(
                    "absolute inset-0 w-full h-full p-8 md:p-12 border-l-[8px] transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col justify-center",
                    service.accent,
                    isActive ? "translate-x-0 opacity-100 z-10" : "-translate-x-full opacity-0 z-0"
                )}>
                  <div className="absolute inset-0 z-0 opacity-[0.15] bg-cover bg-center pointer-events-none grayscale mix-blend-overlay"
                    style={{ backgroundImage: `url(${service.image})`, backgroundColor: THEME.light }} />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div 
                        style={{ backgroundColor: THEME.primary }}
                        className="p-4 text-white shadow rounded-lg"
                      >
                        {service.icon}
                      </div>
                      <div className="flex gap-2 bg-slate-100/50 p-2 backdrop-blur-sm rounded-lg">
                        {services.map((_, i) => (
                          <div 
                            key={i} 
                            className="relative h-1.5 overflow-hidden bg-slate-200 rounded-lg" 
                            style={{ width: activeService === i ? '40px' : '12px' }}
                          >
                            {activeService === i && (
                              <div 
                                style={{ backgroundColor: THEME.primary }}
                                className={cn("absolute inset-0 origin-left animate-[progress_10s_linear_forwards]", isPaused && "pause")} 
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={cn("transition-all duration-1000 delay-300", isActive ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0")}>
                      <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-1">{service.title}</h2>
                      <p className="text-xs font-black uppercase tracking-widest mb-4 opacity-70" style={{ color: THEME.secondary }}>{service.type}</p>
                      <p className="text-slate-600 text-sm font-medium mb-8 max-w-lg leading-relaxed">{service.desc}</p>
                      
                      {/* EFFECT: Blue (White text) to Yellow (Black text) */}
                      <button 
                        onClick={() => onNavigate?.('new-request', service.title)} 
                        className="flex items-center gap-3 px-10 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] group outline-none select-none rounded-lg"
                      >
                        {service.action} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SUBMISSION LOG SECTION */}
          <div className="border border-slate-200/80 shadow overflow-hidden bg-white rounded-lg">
            <div className="text-white px-8 py-5 flex items-center justify-between" style={{ backgroundColor: THEME.primary }}>
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">Live Submission Log</h3>
              <span className="text-[10px] font-bold opacity-80 bg-white/20 px-3 py-1 rounded-lg">{requests.length} RECORDS</span>
            </div>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-16 text-center text-xs font-bold text-slate-300 animate-pulse tracking-widest uppercase">Fetching Portal Data...</div>
              ) : requests.length === 0 ? (
                <div className="p-20 text-center text-slate-400 text-sm italic">No active requests found in your history.</div>
              ) : (
                requests.slice(0, 5).map((req) => (
                  <div key={req.id} className="p-8 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer">
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-slate-900 uppercase group-hover:text-[#1072b3] transition-colors">{req.title || req.type}</h4>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Filed: {new Date(req.created_at).toLocaleDateString()} • ID: #{req.id}
                      </p>
                    </div>
                    <div className={cn('px-4 py-1.5 text-[10px] font-black uppercase border-l-4 shadow-sm flex items-center gap-2 rounded-lg', STATUS_STYLES[req.status] || 'bg-slate-100 text-slate-500 border-slate-300')}>
                      <span className={cn('w-2 h-2 rounded-full animate-pulse', STATUS_DOT[req.status] || 'bg-slate-400')} /> {req.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {announcements.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 ml-2">
                <Megaphone className="w-4 h-4 text-amber-500" /> Announcements
              </h3>
              <div className="max-h-[400px] overflow-y-auto space-y-2 [&::-webkit-scrollbar]:hidden">
                {announcements.map((ann) => (
                  <button
                    key={ann.id}
                    onClick={() => setSelectedAnn(ann)}
                    className="cursor-pointer w-full relative bg-white border border-slate-200/80 rounded-lg shadow-sm overflow-hidden flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-amber-50 hover:border-amber-200"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
                    <div className="pl-2 flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-2 py-0.5 rounded shrink-0">{ann.tag}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">{ann.date}</span>
                      </div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight leading-tight truncate">{ann.title}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <InformationBureauContent />
        </div>

      </div>

      {/* ── Announcement Detail Modal ── */}
      <AnimatePresence>
        {selectedAnn && (
          <motion.div
            key="ann-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedAnn(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
          >
            <motion.div
              key="ann-modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden"
            >
              {/* Amber accent bar */}
              <div className="h-1.5 w-full bg-amber-400" />

              {/* Header */}
              <div className="flex items-start justify-between px-8 pt-7 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Announcement</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{selectedAnn.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAnn(null)}
                  className="cursor-pointer p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors outline-none shrink-0 ml-4"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-8 py-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase px-2.5 py-1 rounded-lg">
                    {selectedAnn.tag}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                  {selectedAnn.title}
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                  {selectedAnn.body}
                </p>
              </div>

              {/* Footer */}
              <div className="px-8 pb-7 pt-2">
                <button
                  onClick={() => setSelectedAnn(null)}
                  className="cursor-pointer w-full py-3 font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black rounded-lg shadow-md outline-none"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollaboratorHome;