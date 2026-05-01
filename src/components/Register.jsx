import React, { useState, useEffect } from 'react';
import { Mail, User, ArrowLeft, ArrowRight, Info, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API } from '../config/api';
import logo from '../assets/logo.png';

const DOMAIN = '@slc-sflu.edu.ph';
const DOMAIN_ERROR = `Only ${DOMAIN} school accounts are allowed to access this system.`;

const THEME = {
  primary: '#1072b3',
  secondary: '#03396c',
  light: '#bdd4e5',
  accent: '#f6ce11',
  bg: '#F5F7FA',
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

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans"
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

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Account Created!</h2>
              <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                A temporary password has been sent to:<br />
                <span className="font-bold text-slate-700">{form.email}</span>
              </p>
              
              {/* EFFECT: Blue to Yellow */}
              <button
                onClick={onBack}
                className="w-full mt-8 py-4 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border-2 border-transparent rounded-lg bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 outline-none"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go to Login</span>
              </button>
            </motion.div>
          ) : (
            <motion.div key="form-container">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-slate-800">Create Account</h2>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1072b3] transition-colors">
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
                        className={`w-full pl-10 pr-4 py-3.5 bg-slate-50 border rounded-lg text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all duration-200 ${
                          fieldErrors.firstName 
                            ? 'border-red-300 bg-red-50 focus:ring-4 focus:ring-red-50' 
                            : 'border-slate-200 focus:border-[#1072b3] focus:ring-4 focus:ring-blue-50'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1072b3] transition-colors">
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
                        className={`w-full pl-10 pr-4 py-3.5 bg-slate-50 border rounded-lg text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all duration-200 ${
                          fieldErrors.lastName 
                            ? 'border-red-300 bg-red-50 focus:ring-4 focus:ring-red-50' 
                            : 'border-slate-200 focus:border-[#1072b3] focus:ring-4 focus:ring-blue-50'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 ml-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1072b3] transition-colors">
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
                      className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-lg text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all duration-200 ${
                        fieldErrors.email 
                          ? 'border-red-300 bg-red-50 focus:ring-4 focus:ring-red-50' 
                          : 'border-slate-200 focus:border-[#1072b3] focus:ring-4 focus:ring-blue-50'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase ml-1">
                    Profile Photo
                  </label>
                  <div className="flex flex-col gap-3">
                    {/* EFFECT: Bureau style Ghost Button to Yellow */}
                    <label className="w-full py-3 px-4 bg-white border-2 border-[#1072b3] text-[#1072b3] hover:bg-[#f6ce11] hover:border-[#f6ce11] hover:text-black rounded-lg text-sm font-black uppercase tracking-widest transition-all duration-300 cursor-pointer text-center select-none outline-none">
                      Select image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>
                    {avatarPreview && (
                      <div className="flex justify-center">
                        <div className="rounded-lg overflow-hidden border border-slate-200 w-20 h-20 shadow-sm">
                          <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 mt-2"
                  >
                    <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 font-medium leading-relaxed">{apiError}</p>
                  </motion.div>
                )}

                {/* EFFECT: Blue to Yellow */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border-2 border-transparent rounded-lg bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed outline-none"
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

              <div className="mt-8 text-center">
                {/* EFFECT: Link Color Transition */}
                <button
                  onClick={onBack}
                  className="font-black text-xs uppercase tracking-widest transition-all duration-300 outline-none text-[#1072b3] hover:text-[#f6ce11] flex items-center justify-center gap-2 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Already have an account? Sign in</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Register;