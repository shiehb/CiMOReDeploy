import React, { useState, useEffect, useCallback } from 'react';
import { Home, Megaphone, ClipboardList, Settings as SettingsIcon, Eye, EyeOff, Lock, Loader2, AlertCircle, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence, useAnimationControls } from 'motion/react';
import { cn } from '../lib/utils';
import { API } from '../config/api';
import logo from '../assets/logo.png';
import Header from './Header';
import ChatSheet from './ChatSheet';
import CollaboratorHome from './CollaboratorHome';
import NewRequest from './NewRequest';
import MyRequests from './MyRequests';
import RequestDetail from './RequestDetail';
import Settings from './Settings';

const THEME = {
  primary: '#1072b3',
  secondary: '#03396c',
  accent: '#f6ce11',
  bg: '#F5F7FA',
};

const VALID_TABS = new Set(['home', 'new-request', 'my-requests', 'request-detail', 'settings']);

const getInitialRoute = () => {
  const rawPath = window.location.pathname.replace(/^\/+/g, '').replace(/\/+$/g, '');
  if (!rawPath || rawPath === 'home') {
    return { tab: 'home', requestType: null, requestId: null };
  }
  if (rawPath.startsWith('new-request')) {
    const [, type] = rawPath.split('/');
    return { tab: 'new-request', requestType: type ? decodeURIComponent(type) : null, requestId: null };
  }
  if (rawPath.startsWith('request-detail')) {
    const [, id] = rawPath.split('/');
    return { tab: 'request-detail', requestType: null, requestId: id || null };
  }
  if (rawPath === 'my-requests' || rawPath === 'settings') {
    return { tab: rawPath, requestType: null, requestId: null };
  }
  return { tab: 'home', requestType: null, requestId: null };
};

// ---------------------------------------------------------------------------
// Password complexity check
// ---------------------------------------------------------------------------
const checkComplexity = (pw) => ({
  length:  pw.length >= 8,
  letter:  /[a-zA-Z]/.test(pw),
  number:  /[0-9]/.test(pw),
  special: /[^a-zA-Z0-9]/.test(pw),
});

const isStrong = (pw) => Object.values(checkComplexity(pw)).every(Boolean);

// ---------------------------------------------------------------------------
// First-login forced password change (Styled exactly like the Login card)
// ---------------------------------------------------------------------------
const FirstLoginChangePage = ({ onChanged }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState('');

  const passwordShake = useAnimationControls();
  const complexity = checkComplexity(password);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const showError = (msg) => {
    setToast(msg);
    setPassword('');
    setConfirm('');
    passwordShake.start({
      x: [0, -10, 10, -10, 10, -6, 6, 0],
      transition: { duration: 0.45, ease: 'easeOut' },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isStrong(password)) {
      showError('Password does not meet the requirements.');
      return;
    }
    if (password !== confirm) {
      showError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API}/api/profile/set-password/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      localStorage.setItem('authToken', data.token);
      
      // Clean up persistence flags upon success
      localStorage.removeItem('mustChangePassword');
      
      onChanged();
    } catch (err) {
      showError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans"
      style={{ backgroundColor: THEME.bg }}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="password-toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-6 right-4 left-4 sm:left-auto sm:w-96 bg-white border-l-4 border-red-500 shadow p-4 flex items-start gap-3 z-50 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-slate-600 font-medium">{toast}</p>
            </div>
            <button 
              onClick={() => setToast('')} 
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md sm:bg-white shadow border border-slate-100 p-6 sm:p-10 transition-all duration-300 relative z-10 rounded-lg"
      >
        {/* Logo at the top of the card */}
        <div className="flex flex-col items-center">
          <img src={logo} alt="Logo" className="h-20 w-auto object-contain" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-[#03396c] uppercase">Change Your Password</h2>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">
            You logged in with a temporary password.<br />
            Set a new one to continue — you cannot skip this step.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <motion.div animate={passwordShake} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1072b3] transition-colors">
                <Lock 
                  className="w-5 h-5"
                  style={{ color: password ? THEME.primary : undefined }}
                />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border rounded-lg text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all duration-200 ${
                  toast
                    ? 'border-red-300 bg-red-50 ring-4 ring-red-100 focus:ring-red-200'
                    : 'border-slate-200 focus:border-[#1072b3] focus:ring-4 focus:ring-blue-50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </motion.div>

            {/* Password Validation Checklist */}
            {password.length > 0 && (
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-3 px-1">
                {[
                  { key: 'length',  label: '8+ characters' },
                  { key: 'letter',  label: 'Contains letter' },
                  { key: 'number',  label: 'Contains number' },
                  { key: 'special', label: 'Special character' },
                ].map(({ key, label }) => (
                  <div 
                    key={key} 
                    className={`flex items-center gap-1.5 text-[11px] font-bold tracking-wide transition-colors duration-200 ${
                      complexity[key] ? 'text-green-600' : 'text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                      complexity[key] ? 'bg-green-500' : 'bg-slate-300'
                    }`} />
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1072b3] transition-colors">
                <Lock 
                  className="w-5 h-5"
                  style={{ color: confirm ? THEME.primary : undefined }}
                />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your new password"
                className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-lg text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all duration-200 ${
                  confirm.length > 0 && confirm !== password
                    ? 'border-red-300 bg-red-50 focus:ring-red-200'
                    : 'border-slate-200 focus:border-[#1072b3] focus:ring-4 focus:ring-blue-50'
                }`}
              />
            </div>
            {confirm.length > 0 && confirm !== password && (
              <p className="text-xs font-semibold text-red-500 mt-1.5 ml-1">
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border-2 border-transparent rounded-lg bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed outline-none"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Set Password & Continue'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// User Dashboard
// ---------------------------------------------------------------------------
const NAV = [
  { id: 'home',        label: 'Home',        icon: Home },
  { id: 'new-request', label: 'New Request', icon: Megaphone },
  { id: 'my-requests', label: 'My Requests', icon: ClipboardList },
  { id: 'settings',    label: 'Settings',    icon: SettingsIcon },
];

const UserDashboard = ({ onLogout, mustChangePassword, onPasswordChanged }) => {
  const initialRoute = getInitialRoute();
  const [activeTab, setActiveTab]             = useState(initialRoute.tab);
  const [detailRequestId, setDetailRequestId] = useState(initialRoute.requestId);
  const [settingsPanel, setSettingsPanel]     = useState('profile');
  const [settingsNavKey, setSettingsNavKey]   = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [requestTypeParam, setRequestTypeParam] = useState(initialRoute.requestType);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRequestId, setChatRequestId] = useState(null);
  const [chatRequestTitle, setChatRequestTitle] = useState('');
  const [chatRequests, setChatRequests] = useState([]);

  // Track forced password state across refreshes
  const [isForcedChange, setIsForcedChange] = useState(
    mustChangePassword || localStorage.getItem('mustChangePassword') === 'true'
  );

  // Sync forced change state from parent props
  useEffect(() => {
    if (mustChangePassword) {
      localStorage.setItem('mustChangePassword', 'true');
      setIsForcedChange(true);
    }
  }, [mustChangePassword]);

  const openChat = useCallback((requestId, title = '', requests = []) => {
    setChatRequestId(requestId);
    setChatRequestTitle(title);
    setChatRequests(requests);
    setChatOpen(true);
  }, []);

  const getUrlForTab = () => {
    if (activeTab === 'home') return '/home';
    if (activeTab === 'new-request') {
      return requestTypeParam ? `/new-request/${encodeURIComponent(requestTypeParam)}` : '/new-request';
    }
    if (activeTab === 'my-requests') return '/my-requests';
    if (activeTab === 'request-detail') {
      return detailRequestId ? `/request-detail/${detailRequestId}` : '/request-detail';
    }
    if (activeTab === 'settings') return '/settings';
    return '/home';
  };

  const navigateTo = (tab, routeOptions = {}) => {
    setActiveTab(tab);
    setDetailRequestId(tab === 'request-detail' ? routeOptions.requestId || null : null);
    setRequestTypeParam(tab === 'new-request' ? routeOptions.requestType || null : null);
  };

  const handleViewDetail = (id) => {
    navigateTo('request-detail', { requestId: id });
  };

  const navigateToSettings = (panel) => {
    setSettingsPanel(panel);
    setSettingsNavKey((k) => k + 1);
    navigateTo('settings');
  };

  // ---------------------------------------------------------------------------
  // INTERCEPTOR: If true, enforce screen and lock all tabs and URLs
  // ---------------------------------------------------------------------------
  if (isForcedChange) {
    return (
      <FirstLoginChangePage 
        onChanged={() => {
          setIsForcedChange(false);
          onPasswordChanged();
        }} 
      />
    );
  }

  const handleNavigate = (tab, requestType) => {
    navigateTo(tab, { requestType });
    setIsOpen(false);
  };

  useEffect(() => {
    const targetUrl = getUrlForTab();
    if (window.location.pathname !== targetUrl) {
      if (window.location.pathname === '/home' && activeTab === 'home') {
        window.history.replaceState({ tab: activeTab }, document.title, targetUrl);
      } else {
        window.history.pushState({ tab: activeTab }, document.title, targetUrl);
      }
    } else {
      window.history.replaceState({ tab: activeTab }, document.title, targetUrl);
    }
  }, [activeTab, detailRequestId, requestTypeParam]);

  useEffect(() => {
    const handlePopState = () => {
      const rawPath = window.location.pathname.replace(/^\/+/g, '').replace(/\/+$/g, '');
      if (!rawPath || rawPath === 'home') {
        navigateTo('home', { requestId: null, requestType: null });
        return;
      }
      if (rawPath.startsWith('new-request')) {
        const [, type] = rawPath.split('/');
        navigateTo('new-request', { requestType: type ? decodeURIComponent(type) : null, requestId: null });
        return;
      }
      if (rawPath.startsWith('request-detail')) {
        const [, id] = rawPath.split('/');
        navigateTo('request-detail', { requestId: id || null, requestType: null });
        return;
      }
      if (rawPath === 'my-requests' || rawPath === 'settings') {
        navigateTo(rawPath, { requestId: null, requestType: null });
        return;
      }
      navigateTo('home', { requestId: null, requestType: null });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':          return <CollaboratorHome onNavigate={handleNavigate} />;
      case 'new-request':    return <NewRequest initialRequestType={requestTypeParam} />;
      case 'my-requests':    return <MyRequests onViewDetail={handleViewDetail} onOpenChat={openChat} />;
      case 'request-detail': return (
        <RequestDetail
          requestId={detailRequestId}
          onBack={() => navigateTo('my-requests')}
          canManage={false}
          onOpenChat={openChat}
        />
      );
      case 'settings':       return <Settings key={settingsNavKey} initialPanel={settingsPanel} />;
      default:               return <CollaboratorHome />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans text-gray-900 selection:bg-[#1072b3]/10 selection:text-[#1072b3]">
      <Header onLogout={onLogout} onNavigate={navigateTo} onNavigateToSettings={navigateToSettings} setIsOpen={setIsOpen} onOpenChat={openChat} />

      <div className="flex pt-15">
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        <aside className={`
          fixed left-0 z-50 w-64 bg-white shadow-sm border-r border-slate-100 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:fixed md:top-15 md:h-[calc(100vh-3.75rem)] md:block
          top-0 h-full
        `}>
          <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
            {NAV.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => { navigateTo(id); setIsOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group outline-none',
                    isActive
                      ? 'bg-[#f6ce11] text-[#1072b3] font-bold shadow-sm'
                      : 'hover:bg-[#1072b3] text-slate-600 hover:text-white'
                  )}
                >
                  <Icon className={cn(
                    'w-5 h-5 transition-transform duration-200 group-hover:scale-105',
                    isActive ? 'text-[#1072b3]' : 'text-slate-400 group-hover:text-white'
                  )} />
                  <span className="text-sm tracking-tight">{label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1072b3]" />}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
          <div className="flex-1 px-4">
            <div className="py-2 w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      <ChatSheet
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        requestId={chatRequestId}
        requestTitle={chatRequestTitle}
        requests={chatRequests}
      />
    </div>
  );
};

export default UserDashboard;