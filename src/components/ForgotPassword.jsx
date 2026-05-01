import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API } from '../config/api';

const DOMAIN = '@slc-sflu.edu.ph';

// Exact Color Theme Mapping
const THEME = {
  primary: '#2f80de',
  secondary: '#2F80ED',
  light: '#56CCF2',
  accent: '#FFD600',
  bg: '#F5F7FA',
};

// Top Header: Logo and Title only (no profile or notification icons)
const AuthHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 flex items-center justify-between z-50">
      <div className="flex items-center gap-3">
        <div 
          style={{ background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.light})` }}
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-blue-100"
        >
          <span className="text-white font-bold text-lg">C</span>
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-800 leading-none tracking-tight">CiMORe</h1>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 tracking-wider uppercase">
            Institutional Intelligence Hub
          </p>
        </div>
      </div>
    </header>
  );
};

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.toLowerCase().endsWith(DOMAIN)) {
      setError(`Only ${DOMAIN} campus accounts are supported.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API}/api/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
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
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative pt-24"
      style={{ backgroundColor: THEME.bg }}
    >
      <AuthHeader />

      {/* Subtle background blur blobs */}
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

      {/* Password Recovery Card Container
        - Mobile: Seamless background (no shadow/card border)
        - Tablet/Desktop: Centered white card with rounded corners and soft shadow
      */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md sm:bg-white sm:rounded-3xl sm:shadow-xl sm:shadow-slate-100 sm:border sm:border-slate-100 p-2 sm:p-10 transition-all duration-300 relative z-10"
      >
        {/* Descriptive form header instead of internal banner */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Password Recovery
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Enter your school email and we'll send you a reset link.
          </p>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {sent ? (
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
                  <h3 className="text-lg font-bold text-gray-900">Check your email</h3>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    If <span className="font-semibold text-gray-700">{email}</span> is registered in our system,
                    you'll receive a password reset link shortly. The link expires in <strong>2 hours</strong>.
                  </p>
                </div>
                <p className="text-xs text-gray-400">Didn't receive it? Check your spam folder.</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Email input field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
                    School Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2f80de] transition-colors">
                      <Mail 
                        className="w-5 h-5" 
                        style={{ color: email ? THEME.primary : undefined }}
                      />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={`yourname${DOMAIN}`}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2f80de] focus:ring-4 focus:ring-blue-50 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Toast-like localized error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3"
                  >
                    <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
                  </motion.div>
                )}

                {/* Primary action button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ 
                    backgroundColor: THEME.primary,
                    boxShadow: `0 10px 15px -3px rgba(47, 128, 237, 0.25)` 
                  }}
                  className="w-full py-4 px-6 text-white font-bold rounded-2xl hover:brightness-110 active:scale-[0.99] flex items-center justify-center gap-2 group transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Secondary back action */}
          <button
            onClick={onBack}
            style={{ borderColor: `${THEME.primary}33`, color: THEME.primary }}
            className="w-full py-3.5 bg-white border-2 hover:bg-slate-50 text-sm font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;