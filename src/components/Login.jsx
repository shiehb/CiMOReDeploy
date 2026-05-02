import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, useAnimationControls } from 'motion/react';
import { API } from '../config/api';
import logo from '../assets/logo.png';

const DOMAIN = '@slc-sflu.edu.ph';
const DOMAIN_ERROR = `Only ${DOMAIN} school accounts are allowed.`;

const THEME = {
  primary: '#1072b3',
  secondary: '#03396c',
  light: '#bdd4e5',
  accent: '#f6ce11',
  bg: '#F5F7FA',
};

const Login = ({ onLogin, onRegister, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState('');

  const passwordShake = useAnimationControls();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email') || '';
    const passwordParam = params.get('password') || '';
    if (emailParam || passwordParam) {
      setEmail(emailParam);
      setPassword(passwordParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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

        // Check if the user is required to change their password
        if (data.must_change_password || data.mustChangePassword) {
          localStorage.setItem('mustChangePassword', 'true');
        }

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
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans"
      style={{ backgroundColor: THEME.bg }}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="login-toast"
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
          <h2 className="text-xl font-bold text-[#03396c] uppercase">Login to Your Account</h2>
          <p className="text-slate-500 text-sm mt-1">Enter your credentials to access your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2">
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
                placeholder=""
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#1072b3] focus:ring-4 focus:ring-blue-50 transition-all duration-200"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase">
                Password <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs font-bold tracking-wide transition-all duration-300 outline-none text-[#1072b3] hover:text-[#f6ce11]"
              >
                Forgot Password?
              </button>
            </div>
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
                placeholder=""
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
          </div>

          {/* Login Button with Blue-to-Yellow Effect */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border-2 border-transparent rounded-lg bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed outline-none"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <button
              onClick={onRegister}
              className="font-black text-xs uppercase tracking-widest transition-all duration-300 outline-none text-[#1072b3] hover:text-[#f6ce11]"
            >
              Sign up for free
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;