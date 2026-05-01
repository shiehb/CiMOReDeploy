import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle, CheckCircle, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { API } from '../config/api';

// Exact Color Theme Mapping
const THEME = {
  primary: '#2f80de',
  secondary: '#2F80ED',
  light: '#56CCF2',
  accent: '#FFD600',
  bg: '#F5F7FA',
};

const checkComplexity = (pw) => ({
  length:  pw.length >= 8,
  upper:   /[A-Z]/.test(pw),
  lower:   /[a-z]/.test(pw),
  number:  /[0-9]/.test(pw),
  special: /[^a-zA-Z0-9]/.test(pw),
});

const isStrong = (pw) => Object.values(checkComplexity(pw)).every(Boolean);

const ChangePasswordPage = ({ onBack }) => {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success,   setSuccess]   = useState(false);

  const complexity = checkComplexity(newPw);

  const handleSubmit = (e) => {
    e.preventDefault();
    setNotification(null);

    if (!currentPw) {
      setNotification({ type: 'error', message: 'Current password is required.' });
      return;
    }
    if (!isStrong(newPw)) {
      setNotification({ type: 'error', message: 'New password does not meet all requirements.' });
      return;
    }
    if (newPw !== confirm) {
      setNotification({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setShowConfirm(true);
  };

  const executePasswordChange = async () => {
    setShowConfirm(false);
    setIsLoading(true);

    try {
      const res = await fetch(`${API}/api/profile/change-password/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ current_password: currentPw, password: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      localStorage.setItem('authToken', data.token);
      setSuccess(true);
      setNotification({ type: 'success', message: 'Password changed successfully.' });
      setTimeout(() => onBack(), 2000);
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to change password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!notification) return undefined;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Page Header Navigation */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={onBack}
          className="p-3 hover:bg-slate-100 bg-white sm:bg-transparent rounded-2xl transition-all duration-200 text-slate-600 hover:text-slate-800 border border-slate-100 sm:border-none shadow-sm sm:shadow-none outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Change Password
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">Update your security credentials</p>
        </div>
      </div>

      {/* Floating Notifications (Toasts) */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className={cn(
              'fixed top-6 right-6 z-50 flex items-start gap-3 max-w-sm rounded-2xl border px-4 py-3.5 shadow-2xl backdrop-blur-md transition-all',
              notification.type === 'success'
                ? 'bg-white/95 border-green-200 text-green-900 shadow-green-50'
                : 'bg-white/95 border-red-200 text-red-900 shadow-red-50'
            )}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-slate-800">
                {notification.type === 'success' ? 'Success' : 'Error'}
              </span>
              <span className="text-xs font-medium text-slate-600 leading-normal">
                {notification.message}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="ml-auto text-slate-400 hover:text-slate-600 transition-colors duration-200 outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Card */}
      <div className="bg-white sm:rounded-3xl sm:shadow-xl sm:shadow-slate-100 sm:border sm:border-slate-100 p-1 sm:p-10 transition-all duration-300">
        {success ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Password Changed!</h3>
            <p className="text-sm text-slate-400 mt-2 leading-normal">
              Your credentials have been updated. Redirecting you back shortly...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2f80de] transition-colors">
                  <Lock 
                    className="w-5 h-5" 
                    style={{ color: currentPw ? THEME.primary : undefined }}
                  />
                </div>
                <input
                  type={showCur ? 'text' : 'password'}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2f80de] focus:ring-4 focus:ring-blue-50 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowCur(!showCur)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2f80de] transition-colors">
                  <Lock 
                    className="w-5 h-5" 
                    style={{ color: newPw ? THEME.primary : undefined }}
                  />
                </div>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2f80de] focus:ring-4 focus:ring-blue-50 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Inlined real-time validation criteria */}
              {newPw.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 ml-1">
                  {[
                    { key: 'length',  label: 'At least 8 characters' },
                    { key: 'upper',   label: 'Uppercase letter' },
                    { key: 'lower',   label: 'Lowercase letter' },
                    { key: 'number',  label: 'Includes a number' },
                    { key: 'special', label: 'Special character' },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className={cn(
                        'flex items-center gap-2 text-[11px] font-bold transition-colors duration-200',
                        complexity[key] ? 'text-green-600' : 'text-slate-400'
                      )}
                    >
                      <CheckCircle 
                        className={cn('w-3.5 h-3.5 shrink-0 transition-colors', complexity[key] ? 'text-green-500' : 'text-slate-300')} 
                      />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2f80de] transition-colors">
                  <Lock 
                    className="w-5 h-5" 
                    style={{ color: confirm ? THEME.primary : undefined }}
                  />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your new password"
                  className={cn(
                    'w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all duration-200',
                    confirm.length > 0 && confirm !== newPw
                      ? 'border-red-300 bg-red-50 focus:ring-4 focus:ring-red-50'
                      : 'border-slate-200 focus:border-[#2f80de] focus:ring-4 focus:ring-blue-50'
                  )}
                />
              </div>
              {confirm.length > 0 && confirm !== newPw && (
                <p className="text-xs text-red-500 ml-1 mt-1 font-medium">Passwords do not match.</p>
              )}
            </div>

            {/* Submitting Actions Row */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold transition-all duration-200 outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{ 
                  backgroundColor: THEME.primary,
                  boxShadow: `0 10px 15px -3px rgba(47, 128, 237, 0.25)` 
                }}
                className="flex-1 py-3.5 text-white rounded-2xl text-sm font-bold hover:brightness-110 active:scale-[0.99] flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed outline-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Modern Centered Backdrop Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            key="confirm-dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 text-center border border-slate-50"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                Confirm Update
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to change your password? This updates your access credentials immediately.
              </p>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold transition-all duration-200 outline-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executePasswordChange}
                  disabled={isLoading}
                  style={{ backgroundColor: THEME.primary }}
                  className="flex-1 py-3.5 text-white rounded-2xl text-sm font-bold hover:brightness-110 active:scale-[0.99] transition-all duration-200 outline-none flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <span>Confirm</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChangePasswordPage;