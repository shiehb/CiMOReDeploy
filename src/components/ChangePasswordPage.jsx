import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle, CheckCircle, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { API, authHeaders } from '../config/api';

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
          <p className="text-gray-500 text-sm mt-0.5">Update your account password</p>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden max-w-lg mx-auto">

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                'fixed top-6 right-6 z-50 flex items-start gap-3 max-w-sm rounded-3xl border px-4 py-3 shadow-2xl',
                notification.type === 'success'
                  ? 'bg-white border-green-200 text-green-900'
                  : 'bg-white border-red-200 text-red-900'
              )}
            >
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{notification.message}</span>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="ml-auto text-current opacity-70 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {success ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Password Changed!</h3>
            <p className="text-sm text-gray-500 mt-2">Redirecting you back...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type={showCur ? 'text' : 'password'}
                  value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-11 pr-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <button type="button" onClick={() => setShowCur(!showCur)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                  {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-11 pr-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {newPw.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {[
                    { key: 'length',  label: 'At least 8 characters' },
                    { key: 'upper',   label: 'Contains uppercase' },
                    { key: 'lower',   label: 'Contains lowercase' },
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Confirm New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your new password"
                  className={cn(
                    'w-full bg-gray-50 rounded-2xl py-4 pl-11 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                    confirm.length > 0 && confirm !== newPw
                      ? 'border-red-300 bg-red-50'
                      : 'border border-gray-200'
                  )}
                />
              </div>
              {confirm.length > 0 && confirm !== newPw && (
                <p className="text-xs text-red-500 ml-1">Passwords do not match.</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button" onClick={onBack}
                className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit" disabled={isLoading}
                className="flex-1 py-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            key="confirm-dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Password Change</h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to change your password? This action will update your account credentials immediately.
              </p>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executePasswordChange}
                  disabled={isLoading}
                  className="flex-1 py-3.5 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</> : 'Confirm'}
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
