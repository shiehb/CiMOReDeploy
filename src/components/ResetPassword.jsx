import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, Info, ArrowLeft, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API } from '../config/api';
import logo from '../assets/logo.png';

// SLC Corporate Theme Mapping
const THEME = {
  primary: '#1072b3',
  secondary: '#03396c',
  light: '#bdd4e5',
  accent: '#f6ce11',
  bg: '#F5F7FA',
};

// ---------------------------------------------------------------------------
// Strength helpers
// ---------------------------------------------------------------------------
const getStrength = (pwd) => {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8)            score++;
  if (pwd.length >= 12)           score++;
  if (/[A-Z]/.test(pwd))          score++;
  if (/[0-9]/.test(pwd))          score++;
  if (/[^A-Za-z0-9]/.test(pwd))  score++;
  return Math.min(score, 4);
};

const STRENGTH_META = [
  { label: '',       bar: 'bg-gray-200',   text: 'text-gray-400'   },
  { label: 'Weak',   bar: 'bg-red-400',    text: 'text-red-500'    },
  { label: 'Fair',   bar: 'bg-amber-400',  text: 'text-amber-500'  },
  { label: 'Good',   bar: 'bg-blue-400',   text: 'text-blue-500'   },
  { label: 'Strong', bar: 'bg-green-500',  text: 'text-green-600'  },
];

const StrengthMeter = ({ password }) => {
  const score = getStrength(password);
  const meta  = STRENGTH_META[score];
  if (!password) return null;
  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-lg transition-all duration-300 ${
              i <= score ? meta.bar : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-bold uppercase tracking-wider ml-0.5 ${meta.text}`}>
        {meta.label}
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------

const ResetPassword = ({ token, onBack }) => {
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [isLoading, setIsLoading]             = useState(false);
  const [success, setSuccess]                 = useState(false);
  const [error, setError]                     = useState('');

  const passwordsMatch   = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API}/api/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Cannot connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative"
      style={{ backgroundColor: THEME.bg }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <div 
          style={{ backgroundColor: THEME.primary, opacity: 0.05 }} 
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl" 
        />
        <div 
          style={{ backgroundColor: THEME.secondary, opacity: 0.05 }} 
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md sm:bg-white shadow border border-slate-100 p-6 sm:p-10 transition-all duration-300 relative z-10 rounded-lg"
      >
        <div className="flex flex-col items-center mb-10">
          <img src={logo} alt="Logo" className="h-20 w-auto object-contain" />
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-4 py-4"
              >
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Password reset!</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Your password has been changed successfully. You can now log in with your new credentials.
                  </p>
                </div>

                {/* EFFECT: Blue to Yellow */}
                <button
                  onClick={onBack}
                  className="w-full mt-4 py-4 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border-2 border-transparent rounded-lg bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] outline-none shadow"
                >
                  Go to Login
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Set New Password</h2>
                  <p className="text-slate-500 text-sm mt-1">Choose a strong password for your account.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1072b3] transition-colors">
                      <Lock 
                        className="w-5 h-5" 
                        style={{ color: newPassword ? THEME.primary : undefined }}
                      />
                    </div>
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#1072b3] focus:ring-4 focus:ring-blue-50 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(p => !p)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <StrengthMeter password={newPassword} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1072b3] transition-colors">
                      <Lock 
                        className="w-5 h-5" 
                        style={{ color: confirmPassword ? THEME.primary : undefined }}
                      />
                    </div>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border rounded-lg text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all duration-200 ${
                        passwordsMismatch
                          ? 'border-red-300 bg-red-50 focus:ring-4 focus:ring-red-100'
                          : passwordsMatch
                            ? 'border-green-300 focus:ring-4 focus:ring-green-50'
                            : 'border-slate-200 focus:border-[#1072b3] focus:ring-4 focus:ring-blue-50'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(p => !p)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {passwordsMatch && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1 text-[11px] font-bold text-green-600 ml-1 mt-1"
                      >
                        <Check className="w-3 h-3" /> Passwords match
                      </motion.p>
                    )}
                    {passwordsMismatch && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1 text-[11px] font-bold text-red-500 ml-1 mt-1"
                      >
                        <X className="w-3 h-3" /> Passwords do not match
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 mt-2"
                  >
                    <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
                  </motion.div>
                )}

                {/* EFFECT: Blue to Yellow */}
                <button
                  type="submit"
                  disabled={isLoading || passwordsMismatch}
                  className="w-full py-4 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border-2 border-transparent rounded-lg bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 outline-none shadow"
                >
                  {isLoading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>

                <div className="pt-2 text-center">
                  {/* EFFECT: Text Color Transition */}
                  <button
                    type="button"
                    onClick={onBack}
                    className="font-black text-xs uppercase tracking-widest transition-all duration-300 outline-none text-[#1072b3] hover:text-[#f6ce11] flex items-center justify-center gap-2 mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Login</span>
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;