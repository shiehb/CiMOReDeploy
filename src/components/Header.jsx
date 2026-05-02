import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Bell,
  ChevronDown,
  User,
  Lock,
  LogOut,
  X,
  CheckCircle,
  Megaphone,
  UserPlus,
  FileText,
  Settings,
  Menu,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/logo.png';
import { API } from '../config/api';

const THEME = {
  primary: '#1072b3',
  secondary: '#03396c',
  accent: '#f6ce11',
};

const NOTIF_ICONS = {
  request:      FileText,
  user:         UserPlus,
  announcement: Megaphone,
  system:       Settings,
  message:      MessageCircle,
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 30)    return 'Just now';
  if (diff < 90)    return '1 min ago';
  if (diff < 3600)  return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 7200)  return '1 hr ago';
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  const d = new Date(iso);
  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  const t = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === yest.toDateString()) return `Yesterday at ${t}`;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' }) + ` at ${t}`;
}

const Header = ({ onLogout, onNavigate, onNavigateToSettings, setIsOpen, onOpenChat }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutNotification, setShowLogoutNotification] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('userAvatarUrl') || null);
  const profileRef = useRef(null);

  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const notifRef = useRef(null);

  const fullName = localStorage.getItem('userFullName') || 'Admin User';
  const userRole = localStorage.getItem('userRole') || 'Staff';
  const initials = fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AU';

  const fetchNotifs = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/notifications/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnread(data.unread || 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  useEffect(() => {
    if (!showNotifs) return undefined;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

  // Collapse consecutive same-sender message notifications into one grouped entry
  const groupedNotifications = useMemo(() => {
    const result = [];
    let i = 0;
    while (i < notifications.length) {
      const n = notifications[i];
      if (n.type !== 'message') { result.push(n); i++; continue; }
      let j = i + 1;
      while (j < notifications.length && notifications[j].type === 'message' && notifications[j].title === n.title) j++;
      if (j - i > 1) {
        const count = j - i;
        const sender = n.title.replace(/^New message from /, '');
        result.push({
          ...n,
          title: `${sender} sent ${count} new messages`,
          is_read: notifications.slice(i, j).every(x => x.is_read),
          _groupIds: notifications.slice(i, j).map(x => x.id),
        });
      } else {
        result.push(n);
      }
      i = j;
    }
    return result;
  }, [notifications]);

  const markRead = async (id) => {
    const token = localStorage.getItem('authToken');
    try {
      await fetch(`${API}/api/notifications/${id}/read/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem('authToken');
    try {
      await fetch(`${API}/api/notifications/read-all/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const handleLogoutClick = () => {
    setShowProfile(false);
    setShowLogoutConfirm(true);
  };

  useEffect(() => {
    if (!showProfile) return undefined;
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showProfile]);

  useEffect(() => {
    const updateAvatar = () => setAvatarUrl(localStorage.getItem('userAvatarUrl') || null);
    window.addEventListener('userProfileUpdated', updateAvatar);
    return () => window.removeEventListener('userProfileUpdated', updateAvatar);
  }, []);

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
    setShowLogoutNotification(true);
    setTimeout(() => setShowLogoutNotification(false), 3000);
  };

  const parseNotifLink = (link) => {
    if (!link) return null;
    try {
      const url   = new URL(link, window.location.origin);
      const parts = url.pathname.replace(/^\//, '').split('/').filter(Boolean);
      if (!parts.length) return null;
      if (parts[0] === 'request-detail' && parts[1]) {
        return { type: 'request-detail', requestId: parts[1] };
      }
      // Generic single-segment tab links e.g. /users, /marketing, /documents
      return { type: 'tab', tab: parts[0] };
    } catch { return null; }
  };

  return (
    <header className="h-15 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-100 flex items-center justify-between px-4 pr-2 shadow-md">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsOpen(v => !v)}
          className="md:hidden p-2 text-gray-500 transition-all duration-300 hover:text-[#f6ce11] rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img src={logo} alt="CIMO Logo" className="h-12 w-auto object-contain" />
        <p className="text-xs text-gray-500 font-black uppercase tracking-[0.2em] hidden md:block">Institutional Intelligence Hub</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(v => !v)}
            className="relative p-2 text-gray-500 transition-all duration-300 hover:bg-[#1072b3] hover:text-white rounded-lg"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white leading-none">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                className="absolute right-0 mt-4 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#1072b3]" />
                    <span className="text-xs font-black uppercase tracking-wider text-gray-900">Notifications</span>
                  </div>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-black uppercase tracking-widest text-[#1072b3] hover:text-[#f6ce11] transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {groupedNotifications.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest">No notifications</div>
                  ) : (
                    groupedNotifications.map(n => {
                      const Icon = NOTIF_ICONS[n.type] || Bell;
                      return (
                        <button
                          key={n._groupIds ? `grp-${n.id}` : n.id}
                          onClick={() => {
                            if (n._groupIds) {
                              n._groupIds.forEach(id => markRead(id));
                            } else if (!n.is_read) {
                              markRead(n.id);
                            }
                            setShowNotifs(false);

                            if (n.type === 'message') {
                              const parsed = parseNotifLink(n.link);
                              if (parsed?.requestId && onOpenChat) {
                                onOpenChat(parsed.requestId, `Request #${parsed.requestId}`);
                              }
                              return;
                            }

                            if (n.type === 'request') {
                              const parsed = parseNotifLink(n.link);
                              if (parsed?.type === 'request-detail' && parsed.requestId) {
                                onNavigate?.('request-detail', { requestId: parsed.requestId });
                              } else if (parsed?.type === 'tab') {
                                onNavigate?.(parsed.tab);
                              } else {
                                onNavigate?.('marketing');
                              }
                              return;
                            }

                            if (n.type === 'user') {
                              const parsed = parseNotifLink(n.link);
                              if (parsed?.type === 'tab') {
                                onNavigate?.(parsed.tab);
                              } else {
                                onNavigate?.('users');
                              }
                              return;
                            }

                            setSelectedNotif(n);
                          }}
                          className={`cursor-pointer w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${!n.is_read ? 'bg-[#1072b3]/[0.03]' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.is_read ? 'bg-[#1072b3]/10 text-[#1072b3]' : 'bg-gray-100 text-gray-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold leading-tight ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                            {n.body && <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2 leading-snug">{n.body}</p>}
                            <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-px bg-gray-200 mx-1" />
        
        {/* Profile Trigger */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(v => !v)}
            className="flex items-center gap-3 p-1.5 rounded-lg transition-all duration-300 hover:bg-[#1072b3]/5"
          >
            <div className={`w-10 h-10 rounded-lg overflow-hidden shadow-sm ${avatarUrl ? '' : 'bg-[#03396c] flex items-center justify-center text-white font-black uppercase'}`}>
              {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-black text-gray-800 uppercase tracking-wider leading-none mb-1">{fullName}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{userRole}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl border border-gray-200 p-2 overflow-hidden z-50"
              >
                <button
                  onClick={() => { setShowProfile(false); onNavigateToSettings?.('profile'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all duration-300 hover:bg-[#1072b3] hover:text-white rounded-lg"
                >
                  <User className="w-4 h-4" /> My Profile
                </button>
                <button
                  onClick={() => { setShowProfile(false); onNavigateToSettings?.('security'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all duration-300 hover:bg-[#1072b3] hover:text-white rounded-lg"
                >
                  <Lock className="w-4 h-4" /> Security
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-600 transition-all duration-300 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Logout Confirmation */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full text-center border border-slate-100"
            >
              <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Confirm Logout</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">Are you sure you want to exit the hub?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 px-6 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black rounded-lg shadow-lg"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notification Detail Modal ── */}
      <AnimatePresence>
        {selectedNotif && (
          <motion.div
            key="notif-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedNotif(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
          >
            <motion.div
              key="notif-modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden"
            >
              {/* Top accent bar — colour by type */}
              <div className={`h-1.5 w-full ${
                selectedNotif.type === 'announcement' ? 'bg-amber-400' :
                selectedNotif.type === 'request'      ? 'bg-[#1072b3]' :
                selectedNotif.type === 'user'         ? 'bg-orange-400' :
                'bg-slate-300'
              }`} />

              {/* Header */}
              <div className="flex items-start justify-between px-8 pt-7 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = NOTIF_ICONS[selectedNotif.type] || Bell;
                    return (
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedNotif.type === 'announcement' ? 'bg-amber-50 text-amber-500' :
                        selectedNotif.type === 'request'      ? 'bg-[#1072b3]/10 text-[#1072b3]' :
                        selectedNotif.type === 'user'         ? 'bg-orange-50 text-orange-500' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {selectedNotif.type === 'announcement' ? 'Announcement' :
                       selectedNotif.type === 'request'      ? 'Request Update' :
                       selectedNotif.type === 'user'         ? 'User Activity' :
                       'System'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                      {new Date(selectedNotif.created_at).toLocaleString('en-US', {
                        month: 'short', day: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="cursor-pointer p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors outline-none shrink-0 ml-4"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-8 py-6 space-y-3">
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">
                  {selectedNotif.title}
                </h2>
                {selectedNotif.body ? (
                  <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                    {selectedNotif.body}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No additional details.</p>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 pb-7 pt-2">
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="cursor-pointer w-full py-3 font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black rounded-lg shadow-md outline-none"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Success */}
      <AnimatePresence>
        {showLogoutNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[300] bg-green-600 text-white px-6 py-3.5 rounded-lg shadow-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Logged Out</span>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;