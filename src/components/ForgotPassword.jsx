import React, { useState } from 'react';
import { Mail, ArrowLeft, ShieldCheck, Send, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API } from '../config/api';

const DOMAIN = '@slc-sflu.edu.ph';

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
            <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mt-2 font-bold">Password Recovery</p>
          </div>
        </div>

        <div className="p-10 space-y-6">
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
                className="space-y-4"
              >
                <div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Enter your school email and we'll send you a link to reset your password.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">School Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={`yourname${DOMAIN}`}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                </div>

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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Send className="w-4 h-4" /> Send Reset Link</>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <button
            onClick={onBack}
            className="w-full py-3 border-2 border-primary/20 text-primary rounded-2xl text-sm font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>
          </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
