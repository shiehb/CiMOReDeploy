import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API } from '../config/api';
import logo from '../assets/logo.png';

const DOMAIN = '@slc-sflu.edu.ph';

// Exact Color Theme Mapping to match Login
const THEME = {
  primary: '#1072b3',
  secondary: '#03396c',
  light: '#bdd4e5',
  accent: '#f6ce11',
  bg: '#F5F7FA',
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
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans"
      style={{ backgroundColor: THEME.bg }}
    >
      {/* Subtle background blur blobs for depth */}
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
        {/* Card Header with Logo */}
        <div className="flex flex-col items-center">
          <img src={logo} alt="Logo" className="h-20 w-auto object-contain" />
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
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    If <span className="font-semibold text-gray-700">{email}</span> is registered,
                    you'll receive a password reset link shortly.
                  </p>
                </div>
                <p className="text-xs text-gray-400">Be sure to check your spam folder.</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="text-center mb-2">
                  <h2 className="text-xl font-bold text-secondary uppercase">Password Recovery</h2>
                  <p className="text-slate-500 text-sm mt-1 ">
                    Enter your email to receive a reset link.
                  </p>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1072b3] transition-colors">
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
                      placeholder={`user${DOMAIN}`}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#1072b3] focus:ring-4 focus:ring-blue-50 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3"
                  >
                    <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
                  </motion.div>
                )}

                {/* Submit Button with Blue-to-Yellow Effect */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border-2 border-transparent rounded-lg bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed outline-none"
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

          {/* Navigation Back with Blue-to-Yellow Text Transition */}
          <div className="pt-2 text-center">
            <button
              onClick={onBack}
              className="font-black text-xs uppercase tracking-widest transition-all duration-300 outline-none text-[#1072b3] hover:text-[#f6ce11] flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;