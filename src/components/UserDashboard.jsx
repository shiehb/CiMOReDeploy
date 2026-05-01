import React, { useState } from 'react';
import { Megaphone, ClipboardList, Settings as SettingsIcon, Eye, EyeOff, Lock, Loader2, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { API, authHeaders } from '../config/api';
import Header from './Header';
import NewRequest from './NewRequest';
import MyRequests from './MyRequests';
import RequestDetail from './RequestDetail';
import Settings from './Settings';

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
// First-login forced password change — full page, shown before any other page
// ---------------------------------------------------------------------------
const FirstLoginChangePage = ({ onChanged }) => {
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error,    setError]    = useState('');

  const complexity = checkComplexity(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isStrong(password)) {
      setError('Password does not meet the requirements below.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API}/api/profile/`, {
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
      onChanged();
    } catch (err) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[15px] shadow-2xl border border-gray-100 overflow-hidden relative z-10"
      >
        <div className="p-10 bg-primary text-white text-center relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <h1 className="text-2xl font-bold">Change Your Password</h1>
            <p className="text-white/60 text-xs mt-2 leading-relaxed">
              You logged in with a temporary password.<br />
              Set a new one to continue — you cannot skip this step.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">New Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input
                type={showPw ? 'text' : 'password'} required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-11 pr-11 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {password.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {[
                  { key: 'length',  label: 'At least 8 characters' },
                  { key: 'letter',  label: 'Contains a letter' },
                  { key: 'number',  label: 'Contains a number' },
                  { key: 'special', label: 'Contains a special character' },
                ].map(({ key, label }) => (
                  <div key={key} className={cn(
                    'flex items-center gap-1.5 text-[10px] font-semibold',
                    complexity[key] ? 'text-green-600' : 'text-gray-400'
                  )}>
                    <CheckCircle className={cn('w-3 h-3', complexity[key] ? 'text-green-500' : 'text-gray-300')} />
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Confirm Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input
                type={showPw ? 'text' : 'password'} required
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your new password"
                className={cn(
                  'w-full bg-gray-50 border rounded-2xl py-4 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                  confirm.length > 0 && confirm !== password ? 'border-red-300 bg-red-50' : 'border-transparent'
                )}
              />
            </div>
            {confirm.length > 0 && confirm !== password && (
              <p className="text-xs text-red-500 ml-1">Passwords do not match.</p>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </motion.div>
          )}

          <button
            type="submit" disabled={isLoading}
            className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : 'Set Password & Continue'}
          </button>

          <p className="text-center text-xs text-gray-400">
            © 2026 Saint Louis College • CIMORe
          </p>
        </form>
      </motion.div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// User Dashboard — layout for Collaborator role
// ---------------------------------------------------------------------------
const NAV = [
  { id: 'new-request', label: 'New Request', icon: Megaphone },
  { id: 'my-requests', label: 'My Requests', icon: ClipboardList },
  { id: 'settings',    label: 'Settings',    icon: SettingsIcon },
];

const UserDashboard = ({ onLogout, mustChangePassword, onPasswordChanged }) => {
  const [activeTab, setActiveTab]           = useState('new-request');
  const [detailRequestId, setDetailRequestId] = useState(null);
  const [settingsPanel, setSettingsPanel]   = useState('profile');
  const [settingsNavKey, setSettingsNavKey] = useState(0);
  const [isOpen, setIsOpen] = useState(false); // mobile sidebar toggle

  const handleViewDetail = (id) => {
    setDetailRequestId(id);
    setActiveTab('request-detail');
  };

  const navigateToSettings = (panel) => {
    setSettingsPanel(panel);
    setSettingsNavKey(k => k + 1);
    setActiveTab('settings');
  };

  if (mustChangePassword) {
    return <FirstLoginChangePage onChanged={onPasswordChanged} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'new-request':    return <NewRequest />;
      case 'my-requests':    return <MyRequests onViewDetail={handleViewDetail} />;
      case 'request-detail': return (
        <RequestDetail
          requestId={detailRequestId}
          onBack={() => setActiveTab('my-requests')}
          canManage={false}
        />
      );
      case 'settings':       return <Settings key={settingsNavKey} initialPanel={settingsPanel} />;
      default:               return <NewRequest />;
    }
  };

  const isMainTab = true;

  return (
    <div className="min-h-screen bg-bg font-sans text-gray-900 selection:bg-primary/10 selection:text-primary">
      <Header onLogout={onLogout} onNavigate={setActiveTab} onNavigateToSettings={navigateToSettings} setIsOpen={setIsOpen} />

      <div className="flex pt-15">
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Simplified sidebar — two pages only */}
        <aside className={`
          fixed left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:fixed md:top-15 md:h-[calc(100vh-3.75rem)] md:block
          top-0 h-full
        `}>
          <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
            {NAV.map(({ id, label, icon: Icon }) => {
              const isActive = isMainTab && activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setIsOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group',
                    isActive
                      ? 'bg-accent text-primary font-semibold shadow-lg scale-[1.02]'
                      : 'hover:bg-primary text-gray-800 hover:text-white'
                  )}
                >
                  <Icon className={cn('w-5 h-5 transition-transform duration-300 group-hover:scale-110', isActive ? 'text-primary' : 'text-gray-400')} />
                  <span className="text-sm">{label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
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
    </div>
  );
};

export default UserDashboard;
