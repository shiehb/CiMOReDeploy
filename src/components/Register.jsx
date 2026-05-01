import React, { useState, useEffect } from 'react';
import { Mail, User, ArrowLeft, ArrowRight, ShieldCheck, Info, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { API } from '../config/api';

const DOMAIN = '@slc-sflu.edu.ph';
const DOMAIN_ERROR = `Only ${DOMAIN} school accounts are allowed to access this system.`;

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

const Register = ({ onBack }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors((fe) => ({ ...fe, [field]: '' }));
  };

  const validateAvatar = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, or WebP images are allowed.';
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'Avatar must be 5MB or smaller.';
    }
    return '';
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarError('');
      return;
    }

    const errorMessage = validateAvatar(file);
    if (errorMessage) {
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarError(errorMessage);
      return;
    }

    setAvatarError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (!avatarPreview) return undefined;
    return () => URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'This field is required.';
    if (!form.lastName.trim())  errs.lastName  = 'This field is required.';
    if (!form.email.trim()) {
      errs.email = 'This field is required.';
    } else if (!form.email.toLowerCase().endsWith(DOMAIN)) {
      errs.email = DOMAIN_ERROR;
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      const body = new FormData();
      body.append('first_name', form.firstName.trim());
      body.append('last_name', form.lastName.trim());
      body.append('email', form.email.trim().toLowerCase());
      if (avatarFile) {
        body.append('avatar', avatarFile);
      }

      const res = await fetch(`${API}/api/register/`, {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setApiError(data.error || 'Registration failed. Please try again.');
      }
    } catch {
      setApiError('Cannot connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success view
  if (success) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative pt-24"
        style={{ backgroundColor: THEME.bg }}
      >
        <AuthHeader />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md sm:bg-white sm:rounded-3xl sm:shadow-xl sm:shadow-slate-100 sm:border sm:border-slate-100 p-2 sm:p-10 transition-all duration-300 relative z-10 text-center"
        >
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Account Created!</h2>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            A temporary password has been sent to:<br />
            <span className="font-bold text-slate-700">{form.email}</span>
          </p>
          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            Please log in with your school email and the temporary password from your inbox.
            You'll be asked to set a new password right away.
          </p>

          <button
            onClick={onBack}
            style={{ 
              backgroundColor: THEME.primary,
              boxShadow: `0 10px 15px -3px rgba(47, 128, 237, 0.25)` 
            }}
            className="w-full mt-8 py-4 text-white font-bold rounded-2xl hover:brightness-110 active:scale-[0.99] flex items-center justify-center gap-2 transition-all duration-200 outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Login</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative pt-24"
      style={{ backgroundColor: THEME.bg }}
    >
      <AuthHeader />

      {/* Background blobs */}
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

      {/* Form Card Layout
        - Mobile: Seamless background (no cards, no shadows)
        - Tablet & Desktop: White rounded card with soft shadows
      */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md sm:bg-white sm:rounded-3xl sm:shadow-xl sm:shadow-slate-100 sm:border sm:border-slate-100 p-2 sm:p-10 transition-all duration-300 relative z-10"
      >
        {/* Responsive Section Header */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Create an Account
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Get access to the hub by entering your credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* First & Last Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2f80de] transition-colors">
                  <User 
                    className="w-4 h-4" 
                    style={{ color: form.firstName ? THEME.primary : undefined }}
                  />
                </div>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={set('firstName')}
                  placeholder="First name"
                  className={`w-full pl-10 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all duration-200 ${
                    fieldErrors.firstName 
                      ? 'border-red-300 bg-red-50 focus:ring-4 focus:ring-red-50' 
                      : 'border-slate-200 focus:border-[#2f80de] focus:ring-4 focus:ring-blue-50'
                  }`}
                />
              </div>
              {fieldErrors.firstName && (
                <p className="text-xs text-red-500 ml-1 mt-1 flex items-center gap-1 font-medium">
                  <Info className="w-3 h-3" /> {fieldErrors.firstName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2f80de] transition-colors">
                  <User 
                    className="w-4 h-4" 
                    style={{ color: form.lastName ? THEME.primary : undefined }}
                  />
                </div>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={set('lastName')}
                  placeholder="Last name"
                  className={`w-full pl-10 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all duration-200 ${
                    fieldErrors.lastName 
                      ? 'border-red-300 bg-red-50 focus:ring-4 focus:ring-red-50' 
                      : 'border-slate-200 focus:border-[#2f80de] focus:ring-4 focus:ring-blue-50'
                  }`}
                />
              </div>
              {fieldErrors.lastName && (
                <p className="text-xs text-red-500 ml-1 mt-1 flex items-center gap-1 font-medium">
                  <Info className="w-3 h-3" /> {fieldErrors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Email input field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2f80de] transition-colors">
                <Mail 
                  className="w-5 h-5" 
                  style={{ color: form.email ? THEME.primary : undefined }}
                />
              </div>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder={`yourname${DOMAIN}`}
                className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all duration-200 ${
                  fieldErrors.email 
                    ? 'border-red-300 bg-red-50 focus:ring-4 focus:ring-red-50' 
                    : 'border-slate-200 focus:border-[#2f80de] focus:ring-4 focus:ring-blue-50'
                }`}
              />
            </div>
            {fieldErrors.email ? (
              <p className="text-xs text-red-500 ml-1 mt-1 flex items-start gap-1 font-medium leading-normal">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {fieldErrors.email}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1 ml-1">Must end in {DOMAIN}</p>
            )}
          </div>

          {/* Avatar Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase ml-1">
              Profile Photo
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold border border-slate-200 transition-all duration-200 cursor-pointer text-center select-none shrink-0 outline-none">
                Select image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
              <span className="text-xs text-slate-400 leading-normal">
                Max file size: 5MB.<br className="hidden sm:block" /> Format allowed: JPEG, PNG, WebP.
              </span>
            </div>
            {avatarPreview && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 w-24 h-24 sm:w-28 sm:h-28">
                <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
              </div>
            )}
            {avatarError && (
              <p className="text-xs text-red-500 ml-1 mt-1 font-medium flex items-center gap-1">
                <Info className="w-3 h-3" /> {avatarError}
              </p>
            )}
          </div>

          {/* Toast-like API error box */}
          {apiError && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 mt-2"
            >
              <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 font-medium leading-relaxed">{apiError}</p>
            </motion.div>
          )}

          {/* Creation primary CTA */}
          <button
            type="submit"
            disabled={isLoading}
            style={{ 
              backgroundColor: THEME.primary,
              boxShadow: `0 10px 15px -3px rgba(47, 128, 237, 0.25)` 
            }}
            className="w-full py-4 text-white font-bold rounded-2xl hover:brightness-110 active:scale-[0.99] flex items-center justify-center gap-2 group transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed outline-none"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Action Link Footer */}
        <div className="mt-8 text-center">
          <button
            onClick={onBack}
            style={{ color: THEME.primary }}
            className="font-bold text-sm hover:underline flex items-center justify-center gap-2 mx-auto transition-colors outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Already have an account? Sign in</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;