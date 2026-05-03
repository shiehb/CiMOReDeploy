import React, { useState, useEffect } from 'react';
import {
  User, Bell, Shield, Database,
  ChevronRight, Eye, EyeOff, RefreshCw,
  UploadCloud, CheckCircle,
  Mail, Smartphone, Megaphone,
  Lock, Loader2, AlertCircle, Calendar, ShieldCheck, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { API } from '../config/api';
import { uploadAvatar } from '../lib/uploadAvatar';

// ─── helpers ────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={cn(
        'w-12 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 outline-none',
        on ? 'bg-[#1072b3]' : 'bg-gray-300'
      )}
    >
      <div className={cn(
        'absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm',
        on ? 'right-1' : 'left-1'
      )} />
    </button>
  );
}

const checkComplexity = (pw) => ({
  length:  pw.length >= 8,
  upper:   /[A-Z]/.test(pw),
  lower:   /[a-z]/.test(pw),
  number:  /[0-9]/.test(pw),
  special: /[^a-zA-Z0-9]/.test(pw),
});

const isStrong = (pw) => Object.values(checkComplexity(pw)).every(Boolean);

// ─── shared input style ──────────────────────────────────────────────────────
const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-lg py-4 px-5 text-sm font-bold focus:bg-white focus:border-[#1072b3] focus:ring-4 focus:ring-[#1072b3]/5 transition-all outline-none';
const labelCls = 'text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1';

// ─── panels ─────────────────────────────────────────────────────────────────

function ProfilePanel() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('userAvatarUrl') || null);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/profile/`, {
          headers: { Authorization: `Token ${localStorage.getItem('authToken')}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProfile(data);
        const url = data.avatar_url || '';
        setAvatarUrl(url || localStorage.getItem('userAvatarUrl') || null);
        if (url) localStorage.setItem('userAvatarUrl', url);
      } catch {
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!avatarPreview) return undefined;
    return () => URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  useEffect(() => {
    if (!avatarSuccess) return undefined;
    const t = setTimeout(() => setAvatarSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [avatarSuccess]);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Only JPEG, PNG, or WebP images are allowed.'); return;
    }
    if (file.size > 5 * 1024 * 1024) { setAvatarError('Image must be 5MB or smaller.'); return; }
    setAvatarError(''); setAvatarSuccess('');
    setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !profile) return;
    setAvatarUploading(true); setAvatarError('');
    try {
      // 1. Upload to Supabase Storage → get public URL
      // Use profile.id (numeric DB primary key) to avoid @ / . in the storage path
      const userId = profile.id || profile.username;
      const publicUrl = await uploadAvatar(avatarFile, userId);

      // 2. Persist the new URL in the profiles table via the backend API
      const res = await fetch(`${API}/api/profile/`, {
        method: 'PUT',
        headers: {
          Authorization: `Token ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar_url: publicUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('[handleAvatarUpload] DB update failed:', data);
        throw new Error(data.error || 'Failed to save avatar URL.');
      }

      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
      setAvatarUrl(publicUrl);
      localStorage.setItem('userAvatarUrl', publicUrl);
      window.dispatchEvent(new Event('userProfileUpdated'));
      setAvatarFile(null); setAvatarPreview(null);
      setAvatarSuccess('Photo saved successfully.');
    } catch (err) {
      setAvatarError(err.message || 'Failed to upload avatar.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() || profile.username : '';
  const initials = fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#1072b3]" />
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
      <p className="text-sm font-medium text-red-600">{error}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Avatar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 space-y-4 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-sm flex-shrink-0">
                {avatarPreview || avatarUrl ? (
                  <img
                    src={avatarPreview || avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; setAvatarUrl(null); }}
                  />
                ) : (
                  <div className="w-full h-full bg-[#1072b3]/10 text-[#1072b3] flex items-center justify-center text-2xl font-black">
                    {initials}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Profile Photo</p>
                <p className="text-xs text-gray-500 max-w-xs">Upload a JPEG, PNG, or WebP avatar (max 5MB). Auto-optimized and resized.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label htmlFor="avatar-upload-settings" className="py-3 px-4 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200 outline-none">
                Choose photo
                <input id="avatar-upload-settings" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarSelect} />
              </label>
              <button type="button" onClick={handleAvatarUpload} disabled={!avatarFile || avatarUploading}
                className="py-3 px-4 bg-[#1072b3] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#f6ce11] hover:text-black transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed outline-none">
                {avatarUploading ? 'Uploading…' : 'Save Photo'}
              </button>
            </div>
          </div>
          {avatarSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-bold text-emerald-700">{avatarSuccess}</div>}
          {avatarError  && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-700">{avatarError}</div>}
        </div>

        {/* Info cards */}
        <div className="p-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { icon: User,        label: 'Full Name',       value: fullName.toUpperCase() },
            { icon: Mail,        label: 'Email',           value: profile.email },
            { icon: Calendar,    label: 'Account Created', value: profile.date_joined ? new Date(profile.date_joined).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
            { icon: ShieldCheck, label: 'Account Role',    value: profile.role },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 bg-slate-50 rounded-lg p-4 border border-slate-100">
              <div className="w-10 h-10 bg-[#1072b3]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#1072b3]" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                <p className="text-xs font-black text-slate-800 mt-0.5 uppercase">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function SecurityPanel() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showCon,   setShowCon]   = useState(false);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const complexity = checkComplexity(newPw);

  useEffect(() => {
    if (!notification) return undefined;
    const t = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(t);
  }, [notification]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setNotification(null);
    if (!currentPw) { setNotification({ type: 'error', message: 'Current password is required.' }); return; }
    if (!isStrong(newPw)) { setNotification({ type: 'error', message: 'New password does not meet all requirements.' }); return; }
    if (newPw !== confirm) { setNotification({ type: 'error', message: 'Passwords do not match.' }); return; }
    setShowConfirm(true);
  };

  const executePasswordChange = async () => {
    setShowConfirm(false); setIsLoading(true);
    try {
      const res = await fetch(`${API}/api/profile/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ current_password: currentPw, password: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      localStorage.setItem('authToken', data.token);
      setSuccess(true);
      setNotification({ type: 'success', message: 'Password changed successfully.' });
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to change password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const pwInputCls = (extraCls = '') =>
    `w-full bg-slate-50 border border-slate-200 rounded-lg py-4 pl-11 pr-11 text-sm font-bold focus:bg-white focus:border-[#1072b3] focus:ring-4 focus:ring-[#1072b3]/5 outline-none transition-all ${extraCls}`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={cn(
              'fixed top-6 right-6 z-50 flex items-start gap-3 max-w-sm rounded-lg border px-4 py-3 shadow-2xl',
              notification.type === 'success' ? 'bg-white border-green-200 text-green-900' : 'bg-white border-red-200 text-red-900'
            )}
          >
            {notification.type === 'success'
              ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
              : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium">{notification.message}</span>
            <button type="button" onClick={() => setNotification(null)} className="ml-auto opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {success ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Password Changed!</h3>
          <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-wider">Your account credentials have been updated.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Change Password</h3>
            <p className="text-sm font-black text-slate-800 mt-1 uppercase tracking-tight">Keep your account secure.</p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-100 rounded-lg space-y-5 max-h-[calc(100dvh-315px)] overflow-y-auto">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className={labelCls}>Current Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1072b3] transition-colors" />
                <input type={showCur ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Enter your current password" className={pwInputCls()} />
                <button type="button" onClick={() => setShowCur(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1072b3] transition-colors outline-none">
                  {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className={labelCls}>New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1072b3] transition-colors" />
                <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="Min. 8 characters" className={pwInputCls()} />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1072b3] transition-colors outline-none">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPw.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {[
                    { key: 'length',  label: 'At least 8 characters' },
                    { key: 'upper',   label: 'Contains uppercase' },
                    { key: 'lower',   label: 'Contains lowercase' },
                    { key: 'number',  label: 'Contains a number' },
                    { key: 'special', label: 'Contains a special char' },
                  ].map(({ key, label }) => (
                    <div key={key} className={cn('flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider', complexity[key] ? 'text-green-600' : 'text-slate-400')}>
                      <CheckCircle className={cn('w-3 h-3', complexity[key] ? 'text-green-500' : 'text-slate-300')} />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className={labelCls}>Confirm New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1072b3] transition-colors" />
                <input type={showCon ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter your new password"
                  className={pwInputCls(confirm.length > 0 && confirm !== newPw ? 'border-red-300 bg-red-50' : '')} />
                <button type="button" onClick={() => setShowCon(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1072b3] transition-colors outline-none">
                  {showCon ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirm.length > 0 && confirm !== newPw && (
                <p className="text-[10px] font-black text-red-500 ml-1 uppercase tracking-wider">Passwords do not match.</p>
              )}
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-4 bg-[#1072b3] text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#f6ce11] hover:text-black transition-all duration-300 shadow-lg shadow-[#1072b3]/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed outline-none">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Confirm dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-8 text-center border border-slate-100">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-[#1072b3]/10">
                <ShieldCheck className="w-6 h-6 text-[#1072b3]" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Confirm Password Change</h3>
              <p className="text-[11px] font-bold text-slate-500 mt-2 leading-relaxed uppercase tracking-wide">
                Are you sure you want to change your password? This will update your credentials immediately.
              </p>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all outline-none">
                  Cancel
                </button>
                <button type="button" onClick={executePasswordChange} disabled={isLoading}
                  className="flex-1 py-3.5 bg-[#1072b3] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#f6ce11] hover:text-black transition-all duration-300 shadow-lg shadow-[#1072b3]/20 disabled:opacity-70 outline-none flex items-center justify-center gap-2">
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</> : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationsPanel() {
  const token    = localStorage.getItem('authToken');
  const headers  = { Authorization: `Token ${token}` };
  const userRole = localStorage.getItem('userRole') || 'Staff';
  const isAdmin  = userRole === 'Admin';

  const [prefs, setPrefs]             = useState({ email_notifications: true, push_notifications: true, marketing_updates: false });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState(null);
const [bc, setBc]                   = useState({ title: '', body: '', target: 'all', send_email: true });
  const [bcLoading, setBcLoading]     = useState(false);
  const [bcMsg, setBcMsg]             = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/notifications/prefs/`, { headers });
        if (res.ok) setPrefs(await res.json());
      } catch { /* silent */ }
      finally { setPrefsLoading(false); }
    })();
  }, []);

  const handleToggle = async (field, value) => {
    const updated = { ...prefs, [field]: value };
    setPrefs(updated); setSaving(true); setSaveMsg(null);
    try {
      const res = await fetch(`${API}/api/notifications/prefs/`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error();
      setSaveMsg({ type: 'success', text: 'Preferences saved.' });
    } catch {
      setPrefs(prefs);
      setSaveMsg({ type: 'error', text: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const sendBroadcast = async () => {
    if (!bc.title.trim()) { setBcMsg({ type: 'error', text: 'Title is required.' }); return; }
    setBcLoading(true); setBcMsg(null);
    try {
      const res  = await fetch(`${API}/api/notifications/send/`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(bc),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed.');
      setBcMsg({ type: 'success', text: data.message });
      setBc({ title: '', body: '', target: 'all', send_email: true });
    } catch (err) {
      setBcMsg({ type: 'error', text: err.message });
    } finally {
      setBcLoading(false);
      setTimeout(() => setBcMsg(null), 5000);
    }
  };

  const prefItems = [
    { field: 'email_notifications', icon: Mail,       label: 'Email Notifications', desc: 'Receive notification emails whenever an event targets you.' },
    { field: 'push_notifications',  icon: Smartphone, label: 'In-App Notifications', desc: 'Get real-time alerts inside the application.' },
    { field: 'marketing_updates',   icon: Megaphone,  label: 'Marketing Updates',    desc: 'Stay informed about new features and announcements.' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Notification Preferences</h3>
            <p className="text-sm font-black text-slate-800 mt-1 uppercase tracking-tight">Choose how you receive notifications.</p>
          </div>
          {saving && <Loader2 className="w-4 h-4 animate-spin text-[#1072b3] mt-1" />}
        </div>

        {prefsLoading ? (
          <div className="h-32 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#1072b3]" />
          </div>
        ) : (
          <div className="space-y-3">
            {prefItems.map(({ field, icon: Icon, label, desc }) => (
              <div key={field} className="flex items-center justify-between p-4 bg-slate-50/60 rounded-lg border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#1072b3]/10 flex items-center justify-center text-[#1072b3]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </div>
                <Toggle on={prefs[field]} onChange={v => handleToggle(field, v)} />
              </div>
            ))}
          </div>
        )}

        {saveMsg && (
          <div className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest',
            saveMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          )}>
            {saveMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {saveMsg.text}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-5">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Broadcast Notification</h3>
            <p className="text-sm font-black text-slate-800 mt-1 uppercase tracking-tight">Send to a group of users.</p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Title</label>
              <input type="text" value={bc.title} onChange={e => setBc(p => ({ ...p, title: e.target.value }))}
                placeholder="NOTIFICATION TITLE" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Message <span className="normal-case font-normal">(optional)</span></label>
              <textarea value={bc.body} onChange={e => setBc(p => ({ ...p, body: e.target.value }))}
                placeholder="Message body…" rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-4 px-5 text-sm font-bold focus:bg-white focus:border-[#1072b3] focus:ring-4 focus:ring-[#1072b3]/5 outline-none transition-all resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Target Group</label>
                <select value={bc.target} onChange={e => setBc(p => ({ ...p, target: e.target.value }))}
                  className={inputCls + ' cursor-pointer appearance-none'}>
                  <option value="all">All Users</option>
                  <option value="staff_admin">Staff & Admin</option>
                  <option value="collaborators">Collaborators</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Also Send Email</label>
                <div className="h-[58px] flex items-center px-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <Toggle on={bc.send_email} onChange={v => setBc(p => ({ ...p, send_email: v }))} />
                  <span className="ml-3 text-[10px] font-black text-slate-600 uppercase tracking-wider">{bc.send_email ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>
          {bcMsg && (
            <div className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest',
              bcMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
              {bcMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {bcMsg.text}
            </div>
          )}
          <button onClick={sendBroadcast} disabled={bcLoading || !bc.title.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-[#1072b3] text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#f6ce11] hover:text-black transition-all duration-300 shadow-lg shadow-[#1072b3]/20 disabled:opacity-60 disabled:cursor-not-allowed outline-none">
            {bcLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              : <><Megaphone className="w-4 h-4" /> Send Notification</>}
          </button>
        </div>
      )}
    </div>
  );
}


const MODEL_OPTIONS = [
  { key: 'users',              label: 'Users',               desc: 'All user accounts and roles' },
  { key: 'schools',            label: 'Schools',             desc: 'Trailblazing school records' },
  { key: 'marketing_requests', label: 'Marketing Requests',  desc: 'All submitted requests' },
  { key: 'documents',          label: 'Documents & Reports', desc: 'Uploaded files and memos' },
  { key: 'communication_logs', label: 'Communication Logs',  desc: 'Sent and received messages' },
];

async function saveFileToComputer(blob, suggestedName) {
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{ description: 'CIMOre Backup Archive', accept: { 'application/zip': ['.zip'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob); await writable.close();
      return handle.name;
    } catch (err) {
      if (err.name === 'AbortError') return null;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = suggestedName; a.click();
  URL.revokeObjectURL(url);
  return suggestedName;
}

function DatabasePanel() {
  const token   = localStorage.getItem('authToken');
  const headers = { Authorization: `Token ${token}` };

  const [selectedModels, setSelectedModels] = useState(MODEL_OPTIONS.map(m => m.key));
  const [filename, setFilename]             = useState('');
  const [backupLoading, setBackupLoading]   = useState(false);
  const [backupMsg, setBackupMsg]           = useState(null);
  const [restoreFile, setRestoreFile]       = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [restoreResult, setRestoreResult]   = useState(null);

  const allSelected = selectedModels.length === MODEL_OPTIONS.length;
  const toggleModel = (key) =>
    setSelectedModels(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const defaultFilename = () => {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[^0-9]/g, '').slice(0, 15);
    const base  = filename.trim().replace(/\.(zip|json)$/i, '') || `cimore_backup_${stamp}`;
    return `${base}.zip`;
  };

  const handleBackup = async () => {
    if (selectedModels.length === 0) {
      setBackupMsg({ type: 'error', text: 'Select at least one data type to back up.' }); return;
    }
    setBackupLoading(true); setBackupMsg(null);
    try {
      const res = await fetch(`${API}/api/backup/`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: selectedModels, filename: defaultFilename() }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Backup failed.'); }
      const blob     = await res.blob();
      const disp     = res.headers.get('Content-Disposition') || '';
      const match    = disp.match(/filename="([^"]+)"/);
      const suggested = match ? match[1] : defaultFilename();
      const saved    = await saveFileToComputer(blob, suggested);
      if (saved === null) setBackupMsg({ type: 'error', text: 'Save cancelled.' });
      else setBackupMsg({ type: 'success', text: `Backup saved as "${saved}".` });
    } catch (err) {
      setBackupMsg({ type: 'error', text: err.message });
    } finally { setBackupLoading(false); }
  };

  const handleRestore = async () => {
    setRestoreConfirm(false); setRestoreLoading(true); setRestoreResult(null);
    try {
      const form = new FormData(); form.append('backup_file', restoreFile);
      const res  = await fetch(`${API}/api/restore/`, { method: 'POST', headers, body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Restore failed.');
      setRestoreResult({ type: 'success', text: data.message, results: data.results });
    } catch (err) {
      setRestoreResult({ type: 'error', text: err.message });
    } finally { setRestoreLoading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Create Backup */}
      <div className="bg-white p-7 rounded-lg shadow-sm border border-gray-100 space-y-5">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Create Backup</h3>
          <p className="text-sm font-black text-slate-800 mt-1 uppercase tracking-tight">Export database records & media files.</p>
          <p className="text-xs text-slate-500 mt-1">Creates a <span className="font-bold">.zip</span> archive with selected records and all uploaded files.</p>
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Filename <span className="normal-case font-normal">(optional)</span></label>
          <div className="relative">
            <input type="text" value={filename} onChange={e => setFilename(e.target.value)}
              placeholder="e.g. cimore_backup_april2026"
              className={inputCls + ' pr-14'} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">.zip</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={labelCls}>What to Include</span>
            <button type="button" onClick={() => setSelectedModels(allSelected ? [] : MODEL_OPTIONS.map(m => m.key))}
              className="text-[10px] font-black text-[#1072b3] hover:text-[#f6ce11] transition-colors uppercase tracking-widest outline-none">
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MODEL_OPTIONS.map(({ key, label, desc }) => {
              const on = selectedModels.includes(key);
              return (
                <button key={key} type="button" onClick={() => toggleModel(key)}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all outline-none',
                    on ? 'border-[#1072b3]/40 bg-[#1072b3]/5' : 'border-slate-200 bg-slate-50/50 hover:border-[#f6ce11]/50'
                  )}>
                  <div className={cn('w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors',
                    on ? 'bg-[#1072b3] border-[#1072b3]' : 'border-slate-300 bg-white')}>
                    {on && (
                      <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3">
                        <path d="M1 5l3 3 7-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">{label}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {backupMsg && (
          <div className={cn('flex items-start gap-2 px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest',
            backupMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
            {backupMsg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            {backupMsg.text}
          </div>
        )}

        <button onClick={handleBackup} disabled={backupLoading || selectedModels.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-[#1072b3] text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#f6ce11] hover:text-black transition-all duration-300 shadow-lg shadow-[#1072b3]/20 disabled:opacity-60 disabled:cursor-not-allowed outline-none">
          {backupLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Packing ZIP…</>
            : <><UploadCloud className="w-4 h-4" /> Save Backup to Computer…</>}
        </button>
      </div>

      {/* Restore */}
      <div className="bg-white p-7 rounded-lg shadow-sm border border-gray-100 space-y-5">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Restore from Backup</h3>
          <p className="text-sm font-black text-slate-800 mt-1 uppercase tracking-tight">Import a previous backup archive.</p>
          <p className="text-xs text-slate-500 mt-1">Existing records are never overwritten.</p>
        </div>

        <label className={cn(
          'flex items-center gap-4 p-5 border-2 border-dashed rounded-lg cursor-pointer transition-all group',
          restoreFile ? 'border-[#1072b3]/40 bg-[#1072b3]/5' : 'border-slate-200 hover:border-[#1072b3]/30 bg-slate-50/50'
        )}>
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
            restoreFile ? 'bg-[#1072b3]/10 text-[#1072b3]' : 'bg-slate-100 text-slate-400 group-hover:text-[#1072b3]')}>
            <Database className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            {restoreFile ? (
              <>
                <p className="text-xs font-black text-slate-900 truncate uppercase">{restoreFile.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                  {restoreFile.size >= 1024 * 1024
                    ? `${(restoreFile.size / (1024 * 1024)).toFixed(1)} MB`
                    : `${(restoreFile.size / 1024).toFixed(1)} KB`} · Click to change
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-black text-slate-600 uppercase tracking-tight">Click to select a backup file</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">Accepts .zip or .json files</p>
              </>
            )}
          </div>
          {restoreFile && (
            <button type="button" onClick={e => { e.preventDefault(); setRestoreFile(null); setRestoreResult(null); }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 outline-none">
              <X className="w-4 h-4" />
            </button>
          )}
          <input type="file" accept=".zip,.json,application/zip,application/json" className="hidden"
            onChange={e => { setRestoreFile(e.target.files?.[0] || null); setRestoreResult(null); }} />
        </label>

        {restoreResult && (
          <div className={cn('rounded-lg p-4 space-y-2', restoreResult.type === 'success' ? 'bg-green-50' : 'bg-red-50')}>
            <p className={cn('text-[10px] font-black flex items-center gap-2 uppercase tracking-widest',
              restoreResult.type === 'success' ? 'text-green-700' : 'text-red-600')}>
              {restoreResult.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {restoreResult.text}
            </p>
            {restoreResult.results && (
              <ul className="text-[10px] text-slate-600 space-y-0.5 pl-6 list-disc">
                {Object.entries(restoreResult.results).map(([k, v]) => (
                  <li key={k}><span className="font-black capitalize">{k.replace(/_/g, ' ')}:</span> {v}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button onClick={() => setRestoreConfirm(true)} disabled={restoreLoading || !restoreFile}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-[#1072b3]/30 hover:text-[#1072b3] transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none">
          {restoreLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Restoring…</>
            : <><RefreshCw className="w-4 h-4" /> Restore Now</>}
        </button>
      </div>

      {/* Restore confirm dialog */}
      <AnimatePresence>
        {restoreConfirm && (
          <motion.div key="restore-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-8 text-center border border-slate-100">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-[#1072b3]/10">
                <Database className="w-6 h-6 text-[#1072b3]" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Confirm Restore</h3>
              <p className="text-[11px] font-bold text-slate-500 mt-2 leading-relaxed uppercase tracking-wide">
                Import data from "{restoreFile?.name}"? Existing records will be skipped. This cannot be undone.
              </p>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setRestoreConfirm(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all outline-none">
                  Cancel
                </button>
                <button type="button" onClick={handleRestore}
                  className="flex-1 py-3.5 bg-[#1072b3] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#f6ce11] hover:text-black transition-all duration-300 shadow-lg shadow-[#1072b3]/20 outline-none">
                  Yes, Restore
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ─── main component ──────────────────────────────────────────────────────────

const ALL_SECTIONS = [
  { id: 'profile',       label: 'Profile Settings', icon: User,     desc: 'Manage your personal info and photo.',          roles: ['Admin', 'Staff', 'Collaborator'] },
  { id: 'notifications', label: 'Notifications',    icon: Bell,     desc: 'Configure alerts, updates, and preferences.',   roles: ['Admin', 'Staff', 'Collaborator'] },
  { id: 'security',      label: 'Password',         icon: Shield,   desc: 'Change your account password.',                 roles: ['Admin', 'Staff', 'Collaborator'] },
  { id: 'database',      label: 'Database Management', icon: Database, desc: 'Backup, restore, and manage system data.',   roles: ['Admin'] },
];

const PANELS = {
  profile:       ProfilePanel,
  notifications: NotificationsPanel,
  security:      SecurityPanel,
  database:      DatabasePanel,
};

const Settings = ({ initialPanel = 'profile' }) => {
  const role = localStorage.getItem('userRole') || 'Staff';
  const sections = ALL_SECTIONS.filter(s => s.roles.includes(role));
  const [active, setActive] = useState(initialPanel);
  const Panel = PANELS[active] ?? ProfilePanel;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-secondary uppercase tracking-tight">System Settings</h2>
        <p className="text-slate-500 text-sm mt-1 font-medium">Configure and manage your CiMORe experience.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map(({ id, label, icon: Icon, desc }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  'w-full p-4 rounded-lg flex items-center gap-4 text-left transition-all duration-300 group outline-none',
                  isActive
                    ? 'bg-[#1072b3] text-white shadow-lg shadow-[#1072b3]/20'
                    : 'bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#f6ce11]/50'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-50 text-slate-400 group-hover:bg-[#f6ce11] group-hover:text-black'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-[11px] font-black uppercase tracking-widest',
                    isActive ? 'text-white' : 'text-slate-900 group-hover:text-[#1072b3]')}>
                    {label}
                  </p>
                  <p className={cn('text-[10px] font-bold mt-0.5 line-clamp-1 uppercase tracking-tighter',
                    isActive ? 'text-white/60' : 'text-slate-400')}>
                    {desc}
                  </p>
                </div>
                <ChevronRight className={cn(
                  'w-4 h-4 flex-shrink-0 transition-all duration-300',
                  isActive ? 'text-white/50' : 'text-slate-300 group-hover:text-[#f6ce11] group-hover:translate-x-1'
                )} />
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Panel />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;