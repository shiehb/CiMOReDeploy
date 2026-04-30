import React, { useState, useEffect } from 'react';
import {
  User, Bell, Shield, Globe, Database, Cloud,
  ChevronRight, Eye, EyeOff, RefreshCw,
  UploadCloud, CheckCircle, Copy, Key,
  HardDrive, Wifi, Mail, Smartphone, Megaphone,
  Lock, Loader2, AlertCircle, Calendar, ShieldCheck, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const API = 'http://127.0.0.1:8000';

// ─── helpers ────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={cn(
        'w-12 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0',
        on ? 'bg-primary' : 'bg-gray-300'
      )}
    >
      <div className={cn(
        'absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300',
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

// ─── panels ─────────────────────────────────────────────────────────────────

function ProfilePanel() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [prefs, setPrefs] = useState({ emailNotif: true, realtime: true, publicProfile: false });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/profile/`, {
          headers: { Authorization: `Token ${localStorage.getItem('authToken')}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProfile(data);
        localStorage.setItem('userAvatarUrl', data.avatar_url || '');
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
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { setAvatarError('Only JPEG, PNG, or WebP images are allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { setAvatarError('Image must be 5MB or smaller.'); return; }
    setAvatarError('');
    setAvatarSuccess('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarUploading(true);
    setAvatarError('');
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await fetch(`${API}/api/profile/`, {
        method: 'PUT',
        headers: { Authorization: `Token ${localStorage.getItem('authToken')}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload avatar.');
      setProfile(data);
      localStorage.setItem('userAvatarUrl', data.avatar_url || '');
      window.dispatchEvent(new Event('userProfileUpdated'));
      setAvatarFile(null);
      setAvatarPreview(null);
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
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
      <p className="text-sm font-medium text-red-600">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Avatar section */}
        <div className="p-8 space-y-4 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-28 h-28 rounded-3xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm flex-shrink-0">
                {avatarPreview || profile?.avatar_url ? (
                  <img src={avatarPreview || profile.avatar_url} alt="Profile avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900">Profile Photo</p>
                <p className="text-xs text-gray-500 max-w-xs">Upload a JPEG, PNG, or WebP avatar (max 5MB). The image will be optimized and resized automatically.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label htmlFor="avatar-upload-settings" className="py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer border border-gray-200">
                Choose photo
                <input id="avatar-upload-settings" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarSelect} />
              </label>
              <button type="button" onClick={handleAvatarUpload} disabled={!avatarFile || avatarUploading}
                className="py-3 px-4 bg-primary text-white rounded-2xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {avatarUploading ? 'Uploading…' : 'Save Photo'}
              </button>
            </div>
          </div>
          {avatarSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-700">{avatarSuccess}</div>}
          {avatarError  && <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">{avatarError}</div>}
        </div>

        {/* Info cards */}
        <div className="p-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { icon: User,        label: 'Full Name',       value: fullName },
            { icon: Mail,        label: 'Email',           value: profile.email },
            { icon: Calendar,    label: 'Account Created', value: profile.date_joined ? new Date(profile.date_joined).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
            { icon: ShieldCheck, label: 'Account Role',    value: profile.role },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <h4 className="text-sm font-bold text-gray-900">Preferences</h4>
        <div className="space-y-3">
          {[
            { key: 'emailNotif',    label: 'Email Notifications', desc: 'Receive daily summary reports via email.' },
            { key: 'realtime',      label: 'Real-time Alerts',    desc: 'Get instant notifications for new marketing requests.' },
            { key: 'publicProfile', label: 'Public Profile',      desc: 'Allow other staff members to view your profile.' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50/60 rounded-2xl">
              <div>
                <p className="text-sm font-bold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
              <Toggle on={prefs[key]} onChange={v => setPrefs(p => ({ ...p, [key]: v }))} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecurityPanel() {
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw,     setNewPw]       = useState('');
  const [confirm,   setConfirm]     = useState('');
  const [showCur,   setShowCur]     = useState(false);
  const [showNew,   setShowNew]     = useState(false);
  const [showCon,   setShowCon]     = useState(false);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading]   = useState(false);
  const [success,   setSuccess]     = useState(false);
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
    setShowConfirm(false);
    setIsLoading(true);
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

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Toast notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={cn(
              'fixed top-6 right-6 z-50 flex items-start gap-3 max-w-sm rounded-3xl border px-4 py-3 shadow-2xl',
              notification.type === 'success' ? 'bg-white border-green-200 text-green-900' : 'bg-white border-red-200 text-red-900'
            )}
          >
            {notification.type === 'success'
              ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
              : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium">{notification.message}</span>
            <button type="button" onClick={() => setNotification(null)} className="ml-auto opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {success ? (
        <div className="p-12 text-center ">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">Password Changed!</h3>
          <p className="text-sm text-gray-500 mt-2">Your account credentials have been updated.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
            <p className="text-sm text-gray-500 mt-1">Keep your account secure with a strong password.</p>
          </div>

          <div className="p-5 bg-gray-50 rounded space-y-5 mx-auto max-w-md h-[calc(100dvh-315px)] overflow-y-auto">

          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input type={showCur ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                placeholder="Enter your current password"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-11 pr-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              <button type="button" onClick={() => setShowCur(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5 ">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-11 pr-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
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
                  { key: 'special', label: 'Contains a special character' },
                ].map(({ key, label }) => (
                  <div key={key} className={cn('flex items-center gap-1.5 text-[10px] font-semibold', complexity[key] ? 'text-green-600' : 'text-gray-400')}>
                    <CheckCircle className={cn('w-3 h-3', complexity[key] ? 'text-green-500' : 'text-gray-300')} />
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Confirm New Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input type={showCon ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter your new password"
                className={cn(
                  'w-full bg-gray-50 rounded-2xl py-4 pl-11 pr-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                  confirm.length > 0 && confirm !== newPw ? 'border border-red-300 bg-red-50' : 'border border-gray-200'
                )} />
              <button type="button" onClick={() => setShowCon(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                {showCon ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirm.length > 0 && confirm !== newPw && (
              <p className="text-xs text-red-500 ml-1">Passwords do not match.</p>
            )}
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </button>
          </div>
        </form>
      )}

      {/* Confirm dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Password Change</h3>
              <p className="text-sm text-gray-500 mt-2">Are you sure you want to change your password? This will update your account credentials immediately.</p>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all">
                  Cancel
                </button>
                <button type="button" onClick={executePasswordChange} disabled={isLoading}
                  className="flex-1 py-3.5 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70">
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
  const token   = localStorage.getItem('authToken');
  const headers = { Authorization: `Token ${token}` };
  const userRole = localStorage.getItem('userRole') || 'Staff';
  const isAdmin  = userRole === 'Admin';

  const [prefs, setPrefs]       = useState({ email_notifications: true, push_notifications: true, marketing_updates: false });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState(null);

  // test email state
  const [testLoading, setTestLoading] = useState(false);
  const [testMsg,     setTestMsg]     = useState(null);

  // broadcast state (admin only)
  const [bc, setBc] = useState({ title: '', body: '', target: 'all', send_email: true });
  const [bcLoading, setBcLoading] = useState(false);
  const [bcMsg,     setBcMsg]     = useState(null);

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
    setPrefs(updated);
    setSaving(true);
    setSaveMsg(null);
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

  const sendTestEmail = async () => {
    setTestLoading(true);
    setTestMsg(null);
    try {
      const res  = await fetch(`${API}/api/notifications/test-email/`, { method: 'POST', headers });
      const data = await res.json();
      setTestMsg({ type: res.ok ? 'success' : 'error', text: data.message || data.error || 'Unknown error.' });
    } catch {
      setTestMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setTestLoading(false);
      setTimeout(() => setTestMsg(null), 5000);
    }
  };

  const sendBroadcast = async () => {
    if (!bc.title.trim()) { setBcMsg({ type: 'error', text: 'Title is required.' }); return; }
    setBcLoading(true);
    setBcMsg(null);
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
    <div className="space-y-5">

      {/* ── Preferences ── */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Notification Preferences</h3>
            <p className="text-sm text-gray-500 mt-1">Choose how and when you receive notifications.</p>
          </div>
          {saving && <Loader2 className="w-4 h-4 animate-spin text-primary mt-1" />}
        </div>

        {prefsLoading ? (
          <div className="h-32 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {prefItems.map(({ field, icon: Icon, label, desc }) => (
              <div key={field} className="flex items-center justify-between p-5 bg-gray-50/60 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
                <Toggle on={prefs[field]} onChange={v => handleToggle(field, v)} />
              </div>
            ))}
          </div>
        )}

        {saveMsg && (
          <div className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold',
            saveMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          )}>
            {saveMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {saveMsg.text}
          </div>
        )}
      </div>

      {/* ── Test Email ── */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Test Email Delivery</h3>
          <p className="text-sm text-gray-500 mt-1">Send a test notification to your account email to verify delivery settings.</p>
        </div>
        {testMsg && (
          <div className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold',
            testMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          )}>
            {testMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {testMsg.text}
          </div>
        )}
        <button
          onClick={sendTestEmail}
          disabled={testLoading}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl text-sm font-bold hover:border-primary/30 hover:text-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {testLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Mail className="w-4 h-4" /> Send Test Email</>}
        </button>
      </div>

      {/* ── Admin Broadcast ── */}
      {isAdmin && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">Broadcast Notification</h3>
            <p className="text-sm text-gray-500 mt-1">Send an in-app notification (and optionally an email) to a group of users.</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Title</label>
              <input
                type="text"
                value={bc.title}
                onChange={e => setBc(p => ({ ...p, title: e.target.value }))}
                placeholder="Notification title…"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Message <span className="normal-case font-normal">(optional)</span></label>
              <textarea
                value={bc.body}
                onChange={e => setBc(p => ({ ...p, body: e.target.value }))}
                placeholder="Message body…"
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Group</label>
                <select
                  value={bc.target}
                  onChange={e => setBc(p => ({ ...p, target: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="all">All Users</option>
                  <option value="staff_admin">Staff & Admin</option>
                  <option value="collaborators">Collaborators</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Also Send Email</label>
                <div className="h-[46px] flex items-center px-4 bg-gray-50 border border-gray-200 rounded-2xl">
                  <Toggle on={bc.send_email} onChange={v => setBc(p => ({ ...p, send_email: v }))} />
                  <span className="ml-3 text-xs text-gray-600 font-medium">{bc.send_email ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>

          {bcMsg && (
            <div className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold',
              bcMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            )}>
              {bcMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {bcMsg.text}
            </div>
          )}

          <button
            onClick={sendBroadcast}
            disabled={bcLoading || !bc.title.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {bcLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              : <><Megaphone className="w-4 h-4" /> Send Notification</>}
          </button>
        </div>
      )}
    </div>
  );
}

function SystemPanel() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    debugLogs: false,
    autoBackup: true,
    twoFactor: false,
  });

  const items = [
    { key: 'maintenanceMode', icon: Wifi, label: 'Maintenance Mode', desc: 'Temporarily disable access for non-admins.' },
    { key: 'debugLogs', icon: HardDrive, label: 'Debug Logging', desc: 'Enable verbose system logs for troubleshooting.' },
    { key: 'autoBackup', icon: RefreshCw, label: 'Automatic Backups', desc: 'Schedule daily automated database snapshots.' },
    { key: 'twoFactor', icon: Shield, label: 'Require 2FA', desc: 'Enforce two-factor authentication for all users.' },
  ];

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">System Configuration</h3>
        <p className="text-sm text-gray-500 mt-1">Adjust global system settings and defaults.</p>
      </div>
      <div className="space-y-3">
        {items.map(({ key, icon: Icon, label, desc }) => (
          <div key={key} className="flex items-center justify-between p-5 bg-gray-50/60 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
            <Toggle on={settings[key]} onChange={v => setSettings(s => ({ ...s, [key]: v }))} />
          </div>
        ))}
      </div>
    </div>
  );
}

const MODEL_OPTIONS = [
  { key: 'users',               label: 'Users',               desc: 'All user accounts and roles' },
  { key: 'schools',             label: 'Schools',             desc: 'Trailblazing school records' },
  { key: 'marketing_requests',  label: 'Marketing Requests',  desc: 'All submitted requests' },
  { key: 'documents',           label: 'Documents & Reports', desc: 'Uploaded files and memos' },
  { key: 'communication_logs',  label: 'Communication Logs',  desc: 'Sent and received messages' },
];

// Opens a native "Save As" dialog (Chrome/Edge File System Access API).
// Falls back to a browser download (Firefox/Safari) which saves to the default Downloads folder.
async function saveFileToComputer(blob, suggestedName) {
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{ description: 'CIMOre Backup Archive', accept: { 'application/zip': ['.zip'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return handle.name;
    } catch (err) {
      if (err.name === 'AbortError') return null;  // user cancelled — not an error
      // unexpected failure — fall through to legacy download
    }
  }
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url);
  return suggestedName;
}

function DatabasePanel() {
  const token   = localStorage.getItem('authToken');
  const headers = { Authorization: `Token ${token}` };

  // ── backup state ──
  const [selectedModels, setSelectedModels] = useState(MODEL_OPTIONS.map(m => m.key));
  const [filename, setFilename]             = useState('');
  const [backupLoading, setBackupLoading]   = useState(false);
  const [backupMsg, setBackupMsg]           = useState(null);   // { type, text }

  // ── restore state ──
  const [restoreFile, setRestoreFile]       = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [restoreResult, setRestoreResult]   = useState(null);   // { type, text, results? }

  const allSelected = selectedModels.length === MODEL_OPTIONS.length;

  const toggleModel = (key) =>
    setSelectedModels(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );

  const defaultFilename = () => {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[^0-9]/g, '').slice(0, 15);
    const base  = filename.trim().replace(/\.(zip|json)$/i, '') || `cimore_backup_${stamp}`;
    return `${base}.zip`;
  };

  const handleBackup = async () => {
    if (selectedModels.length === 0) {
      setBackupMsg({ type: 'error', text: 'Select at least one data type to back up.' });
      return;
    }
    setBackupLoading(true);
    setBackupMsg(null);
    try {
      const res = await fetch(`${API}/api/backup/`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: selectedModels, filename: defaultFilename() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Backup failed.');
      }

      const blob = await res.blob();
      const disp  = res.headers.get('Content-Disposition') || '';
      const match = disp.match(/filename="([^"]+)"/);
      const suggested = match ? match[1] : defaultFilename();

      const saved = await saveFileToComputer(blob, suggested);
      if (saved === null) {
        setBackupMsg({ type: 'error', text: 'Save cancelled.' });
      } else {
        setBackupMsg({ type: 'success', text: `Backup saved as "${saved}".` });
      }
    } catch (err) {
      setBackupMsg({ type: 'error', text: err.message });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoreConfirm(false);
    setRestoreLoading(true);
    setRestoreResult(null);
    try {
      const form = new FormData();
      form.append('backup_file', restoreFile);
      const res  = await fetch(`${API}/api/restore/`, { method: 'POST', headers, body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Restore failed.');
      setRestoreResult({ type: 'success', text: data.message, results: data.results });
    } catch (err) {
      setRestoreResult({ type: 'error', text: err.message });
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Create Backup ── */}
      <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div>
          <h3 className="text-base font-bold text-gray-900">Create Backup</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Creates a <span className="font-semibold">.zip</span> archive containing the selected database records <span className="font-semibold">and all uploaded files</span> (avatars, attachments, documents). A "Save As" dialog lets you pick the folder and filename.
          </p>
        </div>

        {/* Filename */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Filename <span className="normal-case font-normal text-gray-400">(optional — rename in the Save As dialog)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              placeholder="e.g. cimore_backup_april2026"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-4 pr-14 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">.zip</span>
          </div>
        </div>

        {/* What to backup */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">What to Include</span>
            <button
              type="button"
              onClick={() => setSelectedModels(allSelected ? [] : MODEL_OPTIONS.map(m => m.key))}
              className="text-xs font-bold text-primary hover:underline"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MODEL_OPTIONS.map(({ key, label, desc }) => {
              const on = selectedModels.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleModel(key)}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all',
                    on ? 'border-primary/40 bg-primary/5' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-md flex items-center justify-center border-2 flex-shrink-0 transition-colors',
                    on ? 'bg-primary border-primary' : 'border-gray-300 bg-white'
                  )}>
                    {on && (
                      <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3">
                        <path d="M1 5l3 3 7-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {backupMsg && (
          <div className={cn(
            'flex items-start gap-2 px-4 py-3 rounded-2xl text-xs font-semibold',
            backupMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          )}>
            {backupMsg.type === 'success'
              ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            {backupMsg.text}
          </div>
        )}

        <button
          onClick={handleBackup}
          disabled={backupLoading || selectedModels.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {backupLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Packing ZIP…</>
            : <><UploadCloud className="w-4 h-4" /> Save Backup to Computer…</>}
        </button>
      </div>

      {/* ── Restore ── */}
      <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100 space-y-5">
        <div>
          <h3 className="text-base font-bold text-gray-900">Restore from Backup</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Select a <span className="font-semibold">.zip</span> backup from your computer. Database records and media files are both restored. Existing records and files are never overwritten.
          </p>
        </div>

        {/* File picker */}
        <label className={cn(
          'flex items-center gap-4 p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all group',
          restoreFile
            ? 'border-primary/40 bg-primary/5'
            : 'border-gray-200 hover:border-primary/30 bg-gray-50/50'
        )}>
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors',
            restoreFile ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400 group-hover:text-primary'
          )}>
            <Database className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            {restoreFile ? (
              <>
                <p className="text-sm font-bold text-gray-900 truncate">{restoreFile.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {restoreFile.size >= 1024 * 1024
                    ? `${(restoreFile.size / (1024 * 1024)).toFixed(1)} MB`
                    : `${(restoreFile.size / 1024).toFixed(1)} KB`} · Click to choose a different file
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-600">Click to select a backup file</p>
                <p className="text-xs text-gray-400 mt-0.5">Accepts <span className="font-semibold">.zip</span> (full backup) or <span className="font-semibold">.json</span> (data-only) files</p>
              </>
            )}
          </div>
          {restoreFile && (
            <button
              type="button"
              onClick={e => { e.preventDefault(); setRestoreFile(null); setRestoreResult(null); }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <input
            type="file"
            accept=".zip,.json,application/zip,application/json"
            className="hidden"
            onChange={e => { setRestoreFile(e.target.files?.[0] || null); setRestoreResult(null); }}
          />
        </label>

        {restoreResult && (
          <div className={cn(
            'rounded-2xl p-4 space-y-2',
            restoreResult.type === 'success' ? 'bg-green-50' : 'bg-red-50'
          )}>
            <p className={cn('text-xs font-bold flex items-center gap-2', restoreResult.type === 'success' ? 'text-green-700' : 'text-red-600')}>
              {restoreResult.type === 'success'
                ? <CheckCircle className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              {restoreResult.text}
            </p>
            {restoreResult.results && (
              <ul className="text-[10px] text-gray-600 space-y-0.5 pl-6 list-disc">
                {Object.entries(restoreResult.results).map(([k, v]) => (
                  <li key={k}><span className="font-bold capitalize">{k.replace(/_/g, ' ')}:</span> {v}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          onClick={() => setRestoreConfirm(true)}
          disabled={restoreLoading || !restoreFile}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl text-sm font-bold hover:border-primary/30 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {restoreLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Restoring…</>
            : <><RefreshCw className="w-4 h-4" /> Restore Now</>}
        </button>
      </div>

      {/* ── Restore confirmation dialog ── */}
      <AnimatePresence>
        {restoreConfirm && (
          <motion.div key="restore-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-50 text-yellow-500">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Restore</h3>
              <p className="text-sm text-gray-500 mt-2">
                This will import data from <span className="font-semibold text-gray-700">"{restoreFile?.name}"</span>.
                Records that already exist will be skipped. This cannot be undone.
              </p>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setRestoreConfirm(false)}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all">
                  Cancel
                </button>
                <button type="button" onClick={handleRestore}
                  className="flex-1 py-3.5 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
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

function ApiPanel() {
  const [keys] = useState([
    { name: 'Google Analytics', key: 'GA-XXXXXXXX-1', active: true },
    { name: 'SMTP Mailer', key: 'smtp-key-9f3a2...', active: true },
    { name: 'SMS Gateway', key: 'sms-prod-token-7b...', active: false },
  ]);
  const [copied, setCopied] = useState(null);

  const copyKey = (name) => {
    setCopied(name);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">API & Integrations</h3>
        <p className="text-sm text-gray-500 mt-1">Manage third-party connections and API keys.</p>
      </div>

      <div className="space-y-3">
        {keys.map(({ name, key, active }) => (
          <div key={name} className="flex items-center justify-between p-5 bg-gray-50/60 rounded-2xl gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{name}</p>
                <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{key}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={cn(
                'text-xs font-bold px-2.5 py-1 rounded-full',
                active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
              )}>
                {active ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => copyKey(name)}
                className="p-2 rounded-xl hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                title="Copy key"
              >
                {copied === name ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
        <Cloud className="w-4 h-4" /> Connect New Integration
      </button>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

const ALL_SECTIONS = [
  { id: 'profile',       label: 'Profile Settings',      icon: User,     desc: 'Manage your personal information and preferences.',  roles: ['Admin', 'Staff', 'Collaborator'] },
  { id: 'notifications', label: 'Notifications',          icon: Bell,     desc: 'Configure how you receive alerts and updates.',       roles: ['Admin', 'Staff', 'Collaborator'] },
  { id: 'security',      label: 'Security & Privacy',     icon: Shield,   desc: 'Update your password and manage account security.',   roles: ['Admin', 'Staff', 'Collaborator'] },
  { id: 'system',        label: 'System Configuration',   icon: Globe,    desc: 'Adjust global system settings and defaults.',         roles: ['Admin', 'Staff'] },
  { id: 'database',      label: 'Database Management',    icon: Database, desc: 'Backup, restore, and manage system data.',            roles: ['Admin'] },
  { id: 'api',           label: 'API & Integrations',     icon: Cloud,    desc: 'Manage third-party connections and API keys.',        roles: ['Admin'] },
];

const PANELS = {
  profile:       ProfilePanel,
  notifications: NotificationsPanel,
  security:      SecurityPanel,
  system:        SystemPanel,
  database:      DatabasePanel,
  api:           ApiPanel,
};

const Settings = ({ initialPanel = 'profile' }) => {
  const role = localStorage.getItem('userRole') || 'Staff';
  const sections = ALL_SECTIONS.filter(s => s.roles.includes(role));
  const [active, setActive] = useState(initialPanel);
  const Panel = PANELS[active] ?? ProfilePanel;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Configure and manage your CIMORe experience.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ── Sidebar ── */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map(({ id, label, icon: Icon, desc }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  'w-full p-5 rounded-3xl flex items-center gap-4 text-left transition-all group',
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110',
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-400 group-hover:text-primary'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-bold', isActive ? 'text-white' : 'text-gray-900')}>
                    {label}
                  </p>
                  <p className={cn('text-xs mt-0.5 line-clamp-1', isActive ? 'text-white/70' : 'text-gray-500')}>
                    {desc}
                  </p>
                </div>
                <ChevronRight className={cn(
                  'w-4 h-4 flex-shrink-0 transition-colors',
                  isActive ? 'text-white/60' : 'text-gray-300 group-hover:text-primary'
                )} />
              </button>
            );
          })}
        </div>

        {/* ── Content panel ── */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
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
