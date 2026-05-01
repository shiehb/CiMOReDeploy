import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle, CheckCircle, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { API } from '../config/api';
// Import the logo asset
import logo from '../assets/logo.png';

// Exact Color Theme Mapping
const THEME = {
  primary: '#1072b3',
  secondary: '#03396c',
  light: '#bdd4e5',
  accent: '#f6ce11',
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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

    setShowConfirmModal(true);
  };

  const executePasswordChange = async () => {
    setShowConfirmModal(false);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans" style={{ backgroundColor: THEME.bg }}>
      
      {/* Floating Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              'fixed top-6 right-4 left-4 sm:left-auto sm:w-96 z-50 flex items-start gap-3 rounded-lg border px-4 py-3.5 shadow backdrop-blur-md transition-all',
              notification.type === 'success' ? 'bg-white border-green-200 text-green-900' : 'bg-white border-red-200 text-red-900'
            )}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            )}
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-sm font-bold text-slate-800">{notification.type === 'success' ? 'Success' : 'Error'}</span>
              <span className="text-xs font-medium text-slate-600">{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 outline-none">
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
        {/* Logo at top of card */}
        <div className="flex flex-col items-center mb-10">
          <img src={logo} alt="Logo" className="h-20 w-auto object-contain" />
        </div>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-secondary tracking-tight">Password Changed!</h3>
            <p className="text-sm text-slate-400 mt-2">Redirecting you back shortly...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-secondary">Change Password</h2>
              <p className="text-slate-500 text-sm mt-1">Update your security credentials</p>
            </div>

            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1072b3] transition-colors">
                  <Lock className="w-5 h-5" style={{ color: currentPw ? THEME.primary : undefined }} />
                </div>
                <input
                  type={showCur ? 'text' : 'password'}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-[#1072b3] focus:ring-4 focus:ring-blue-50 transition-all"
                />
                <button type="button" onClick={() => setShowCur(!showCur)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 outline-none">
                  {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1072b3] transition-colors">
                  <Lock className="w-5 h-5" style={{ color: newPw ? THEME.primary : undefined }} />
                </div>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-[#1072b3] focus:ring-4 focus:ring-blue-50 transition-all"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 outline-none">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Complexity indicators */}
              {newPw.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3 ml-1">
                  {[
                    { key: 'length',  label: '8+ chars' },
                    { key: 'upper',   label: 'Uppercase' },
                    { key: 'lower',   label: 'Lowercase' },
                    { key: 'number',  label: 'Number' },
                  ].map(({ key, label }) => (
                    <div key={key} className={cn('flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight transition-colors', complexity[key] ? 'text-green-600' : 'text-slate-300')}>
                      <CheckCircle className={cn('w-3 h-3', complexity[key] ? 'text-green-500' : 'text-slate-200')} />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
                className={cn(
                  'w-full px-4 py-3.5 bg-slate-50 border rounded-lg text-slate-800 text-sm focus:outline-none focus:bg-white transition-all',
                  confirm.length > 0 && confirm !== newPw ? 'border-red-300 bg-red-50 focus:ring-4 focus:ring-red-50' : 'border-slate-200 focus:border-[#1072b3] focus:ring-4 focus:ring-blue-50'
                )}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              {/* EFFECT: Blue to Yellow */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border-2 border-transparent rounded-lg bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 outline-none"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Changes</span>}
              </button>

              {/* EFFECT: Text Color Transition */}
              <button
                type="button"
                onClick={onBack}
                className="w-full py-3 font-black text-xs uppercase tracking-widest transition-all duration-300 outline-none text-[#1072b3] hover:text-[#f6ce11] flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> <span>Back to Profile</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-8 text-center border border-slate-50">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Confirm Update</h3>
              <p className="text-sm text-slate-500 mt-2">Are you sure you want to update your password?</p>
              
              <div className="flex gap-3 mt-8">
                {/* EFFECT: Bureau style Ghost to Yellow */}
                <button 
                  onClick={() => setShowConfirmModal(false)} 
                  className="flex-1 py-3.5 bg-white border-2 border-[#1072b3] text-[#1072b3] hover:bg-[#f6ce11] hover:border-[#f6ce11] hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 outline-none"
                >
                  Cancel
                </button>

                {/* EFFECT: Yellow to Blue */}
                <button 
                  onClick={executePasswordChange} 
                  className="flex-1 py-3.5 font-black text-[10px] uppercase tracking-widest transition-all duration-300 border-2 border-transparent rounded-lg bg-[#f6ce11] text-black hover:bg-[#1072b3] hover:text-white active:scale-95 outline-none shadow"
                >
                  Confirm
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