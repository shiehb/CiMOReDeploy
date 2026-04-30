import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/logo.png';

const API = 'https://ci-mo-re-deploy-isra.vercel.app';

const NOTIF_ICONS = {
  request:      FileText,
  user:         UserPlus,
  announcement: Megaphone,
  system:       Settings,
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const Header = ({ onLogout, onNavigate, onNavigateToSettings }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutNotification, setShowLogoutNotification] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('userAvatarUrl') || null);
  const profileRef = useRef(null);

  // Notification state
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
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
    } catch {
      // silent — network may be unavailable
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Close notif dropdown when clicking outside
  useEffect(() => {
    if (!showNotifs) return undefined;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    if (!showProfile) return undefined;
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
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

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <header className="h-15 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pr-0 shadow-md">
      <div className="flex items-center gap-4">
        <img src={logo} alt="CIMO Logo" className="h-12 w-auto object-contain" />
        <p className="text-base text-gray-600 uppercase tracking-widest hidden md:block">Institutional Intelligence Hub</p>
      </div>
      <div className="flex items-center gap-2">
        {/* ── Notification Bell ── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(v => !v)}
            className="relative p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-full transition-all"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white leading-none">
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
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-gray-900">Notifications</span>
                    {unread > 0 && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                        {unread} new
                      </span>
                    )}
                  </div>
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-xs text-gray-400 font-medium">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(n => {
                      const Icon = NOTIF_ICONS[n.type] || Bell;
                      return (
                        <button
                          key={n.id}
                          onClick={() => { if (!n.is_read) markRead(n.id); }}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${!n.is_read ? 'bg-primary/[0.03]' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.is_read ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold leading-tight ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {n.title}
                            </p>
                            {n.body && (
                              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-snug">{n.body}</p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                          {!n.is_read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                  <button
                    onClick={() => { setShowNotifs(false); onNavigateToSettings?.('notifications'); }}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Notification settings →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="h-8 w-px bg-gray-200 mx-2" />
        
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(v => !v)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-50 transition-all group"
          >
            <div className={`w-10 h-10 rounded-full overflow-hidden shadow-md ${avatarUrl ? '' : 'bg-secondary flex items-center justify-center text-white font-bold'}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={`${fullName} avatar`} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-800">{fullName}</p>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 overflow-hidden"
              >
                {/* Identity header */}
                <div className="flex items-center gap-3 px-3 py-3 mb-1">
                  <div className={`w-9 h-9 rounded-full overflow-hidden flex-shrink-0 shadow ${avatarUrl ? '' : 'bg-secondary flex items-center justify-center text-white text-xs font-bold'}`}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      : initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{userRole}</p>
                  </div>
                </div>

                <div className="h-px bg-gray-100 mx-2 mb-1" />

                <button
                  onClick={() => { setShowProfile(false); onNavigateToSettings?.('profile'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-primary/5 hover:text-primary rounded-xl transition-colors"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>
                <button
                  onClick={() => { setShowProfile(false); onNavigateToSettings?.('security'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-primary/5 hover:text-primary rounded-xl transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Change Password
                </button>

                <div className="h-px bg-gray-100 mx-2 my-1" />

                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
            onClick={handleCancelLogout}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
                <p className="text-gray-600 text-sm mb-8">
                  Are you sure you want to log out? You'll need to sign in again to access your account.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelLogout}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmLogout}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-2xl font-semibold hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Success Notification */}
      <AnimatePresence>
        {showLogoutNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[300] bg-green-600 text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Successfully logged out</span>
            <button onClick={() => setShowLogoutNotification(false)} className="opacity-70 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
