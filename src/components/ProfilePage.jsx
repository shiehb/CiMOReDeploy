import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, ShieldCheck, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { API, authHeaders } from '../config/api';

const ProfilePage = ({ onBack }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/api/profile/`, {
          headers: { Authorization: `Token ${localStorage.getItem('authToken')}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const profileData = await res.json();
        setProfile(profileData);
        localStorage.setItem('userAvatarUrl', profileData.avatar_url || '');
      } catch {
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!avatarPreview) return undefined;
    return () => URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const validateAvatar = (file) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return 'Only JPEG, PNG, or WebP images are allowed.';
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'Image must be 5MB or smaller.';
    }
    return '';
  };

  const handleAvatarSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationMessage = validateAvatar(file);
    if (validationMessage) {
      setAvatarError(validationMessage);
      setAvatarSuccess('');
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }

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
      setAvatarSuccess('');
    } finally {
      setAvatarUploading(false);
    }
  };

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.username
    : '';
  const initials = fullName.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  useEffect(() => {
    if (!avatarSuccess) return undefined;
    const timer = window.setTimeout(() => setAvatarSuccess(''), 4000);
    return () => window.clearTimeout(timer);
  }, [avatarSuccess]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
          <p className="text-gray-500 text-sm mt-0.5">Your account information</p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden max-w-8xl mx-auto"
        >
          <div className="p-8 space-y-4 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-28 h-28 rounded-3xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                  {avatarPreview || profile?.avatar_url ? (
                    <img
                      src={avatarPreview || profile.avatar_url}
                      alt="Profile avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-900">Profile Photo</p>
                  <p className="text-sm text-gray-500 max-w-xs">
                    Upload a JPEG, PNG, or WebP avatar (max 5MB). The image will be optimized and resized automatically.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label
                  htmlFor="avatar-upload"
                  className="py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer border border-gray-200"
                >
                  Choose photo
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleAvatarUpload}
                  disabled={!avatarFile || avatarUploading}
                  className="py-3 px-4 bg-primary text-white rounded-2xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {avatarUploading ? 'Uploading…' : 'Save Photo'}
                </button>
              </div>
            </div>

            {(avatarError || avatarSuccess || profile?.avatar_url) && (
              <div className="flex flex-col gap-2">
                {avatarSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-700">
                    {avatarSuccess}
                  </div>
                )}
                {avatarError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
                    {avatarError}
                  </div>
                )}
                {profile?.avatar_url && !avatarPreview && (
                  <p className="text-xs text-gray-500">Current uploaded avatar is displayed above.</p>
                )}
              </div>
            )}
          </div>

          <div className="p-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{fullName}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Created</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">
                  {profile.date_joined
                    ? new Date(profile.date_joined).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Role</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{profile.role}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProfilePage;
