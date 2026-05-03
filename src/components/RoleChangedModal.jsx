import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert } from 'lucide-react';

const COUNTDOWN_SECS = 5;
const CIRCUMFERENCE = 2 * Math.PI * 26; // r=26

export default function RoleChangedModal({ newRole, onLogout }) {
  const [count, setCount] = useState(COUNTDOWN_SECS);

  const logout = useCallback(() => onLogout(), [onLogout]);

  useEffect(() => {
    if (count <= 0) { logout(); return; }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, logout]);

  const progress = CIRCUMFERENCE * (1 - count / COUNTDOWN_SECS);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[500] p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden"
      >
        {/* amber accent bar — mirrors the "system" notif style */}
        <div className="h-1.5 w-full bg-amber-400" />

        <div className="px-8 pt-8 pb-7 text-center">
          {/* icon */}
          <div className="w-16 h-16 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>

          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-3">
            Permissions Update Required
          </h3>

          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Your account role has been updated to{' '}
            <span className="font-black text-[#1072b3]">{newRole}</span>.
            {' '}To apply these changes, you will be logged out automatically.
          </p>

          {/* countdown ring */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                <circle
                  cx="32" cy="32" r="26"
                  fill="none"
                  stroke="#1072b3"
                  strokeWidth="5"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={progress}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-[#1072b3]">
                {count}
              </span>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 text-left leading-relaxed">
              Logging out<br />in {count} second{count !== 1 ? 's' : ''}…
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full py-3.5 bg-[#1072b3] text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg transition-all duration-300 hover:bg-[#f6ce11] hover:text-black"
          >
            Logout Now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
