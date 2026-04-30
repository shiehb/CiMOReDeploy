import React, { useState, useEffect } from 'react';
import { Mail, User, ArrowLeft, ArrowRight, ShieldCheck, Info, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { API } from '../config/api';

const DOMAIN = '@slc-sflu.edu.ph';
const DOMAIN_ERROR = `Only ${DOMAIN} school accounts are allowed to access this system.`;

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

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[15px] shadow-2xl border border-gray-100 overflow-hidden"
        >
          <div className="p-10 bg-primary text-white text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Account Created!</h2>
            <p className="text-white/70 text-sm mt-2">
              A temporary password has been sent to<br />
              <span className="font-bold text-white">{form.email}</span>
            </p>
          </div>
          <div className="p-10 text-center space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Log in with your school email and the temporary password from your inbox.
              You will be asked to set a new password right away.
            </p>
            <button
              onClick={onBack}
              className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Go to Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
        {/* Header */}
        <div className="p-5 bg-primary text-white text-center relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight">CiMORe</h1>
            <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mt-2 font-bold">Create an Account</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-10 space-y-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text" value={form.firstName} onChange={set('firstName')}
                    placeholder="First name"
                    className={`w-full bg-gray-50 border rounded-2xl py-4 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${fieldErrors.firstName ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                  />
                </div>
                {fieldErrors.firstName && (
                  <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> {fieldErrors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text" value={form.lastName} onChange={set('lastName')}
                    placeholder="Last name"
                    className={`w-full bg-gray-50 border rounded-2xl py-4 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${fieldErrors.lastName ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                  />
                </div>
                {fieldErrors.lastName && (
                  <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="email" value={form.email} onChange={set('email')}
                  placeholder={`yourname${DOMAIN}`}
                  className={`w-full bg-gray-50 border rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                />
              </div>
              {fieldErrors.email ? (
                <p className="text-xs text-red-500 ml-1 flex items-start gap-1">
                  <Info className="w-3 h-3 flex-shrink-0 mt-0.5" /> {fieldErrors.email}
                </p>
              ) : (
                <p className="text-[10px] text-gray-400 ml-1">Must end in {DOMAIN}</p>
              )}
            </div>

            {/* Avatar Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                Profile Photo
              </label>
              <div className="flex items-center gap-4">
                <label
                  className="py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer border border-gray-200"
                >
                  Select image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
                <span className="text-sm text-gray-500">Max 5MB. JPEG, PNG, WebP.</span>
              </div>
              {avatarPreview && (
                <div className="mt-3 rounded-3xl overflow-hidden border border-gray-200 w-32 h-32">
                  <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                </div>
              )}
              {avatarError && (
                <p className="text-xs text-red-500 ml-1">{avatarError}</p>
              )}
            </div>

            {/* API-level error */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3"
              >
                <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 font-medium leading-relaxed">{apiError}</p>
              </motion.div>
            )}

            <button
              type="submit" disabled={isLoading}
              className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="text-center space-y-2">
            <button
              onClick={onBack}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3 h-3" /> Already have an account? Sign in
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
