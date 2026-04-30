import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, X, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence, useAnimationControls } from 'motion/react';
import { API } from '../config/api';

const DOMAIN = '@slc-sflu.edu.ph';
const DOMAIN_ERROR = `Only ${DOMAIN} school accounts are allowed.`;

const Login = ({ onLogin, onRegister, onForgotPassword }) => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [toast, setToast]               = useState('');

  const passwordShake = useAnimationControls();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const showError = (msg) => {
    setToast(msg);
    setPassword('');
    passwordShake.start({
      x: [0, -10, 10, -10, 10, -6, 6, 0],
      transition: { duration: 0.45, ease: 'easeOut' },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.toLowerCase().endsWith(DOMAIN)) {
      showError(DOMAIN_ERROR);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userFullName', data.fullName || data.username || '');
        localStorage.setItem('userId', String(data.user_id));
        localStorage.setItem('userAvatarUrl', data.avatar_url || '');
        localStorage.setItem('cimore_auth', 'true');
        onLogin(data);
      } else {
        showError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      showError('Cannot connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 font-sans">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="login-toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-5 right-5 z-50 flex items-start gap-3 bg-white border border-red-100 shadow-xl rounded-2xl px-5 py-4 max-w-sm"
          >
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800 flex-1 leading-snug pt-1">{toast}</p>
            <button
              onClick={() => setToast('')}
              className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[15px] shadow-2xl border border-gray-100 overflow-hidden relative z-10"
      >
        {/* Branding header */}
        <div className="p-5 bg-primary text-white text-center relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight">CiMORe</h1>
            <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mt-2 font-bold">Institutional Intelligence Hub</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-10 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                Password <span className="text-red-500">*</span>
              </label>
              <motion.div animate={passwordShake} className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={`w-full bg-gray-50 border rounded-2xl py-4 pl-12 pr-12 text-sm focus:ring-2 outline-none transition-all ${
                    toast
                      ? 'border-red-300 bg-red-50 ring-2 ring-red-100 focus:ring-red-200'
                      : 'border-transparent focus:ring-primary/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </motion.div>
            </div>

            {/* Forgot password */}
            <p className="text-right">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-wider"
              >
                Forgot password?
              </button>
            </p>

            {/* Login button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Login</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              }
            </button>
          </form>

          {/* Sign up */}
          <div className="text-center">
            <button
              onClick={onRegister}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mx-auto"
            >
              Don't have an account? Sign up for free
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
