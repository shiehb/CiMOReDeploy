import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  Edit2,
  Eye,
  UserX,
  UserCheck,
  UserPlus,
  Archive,
  RotateCcw,
  Shield,
  Mail,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { API } from '../config/api';

const UserManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [filterRoles, setFilterRoles]         = useState(new Set());
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterRef = useRef(null);
  const [pageSize, setPageSize]       = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [focusedRowId, setFocusedRowId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [warnMessage, setWarnMessage]       = useState(null);

  // ── Archive state (mirrors SchoolIntelligence) ──
  const [showArchived, setShowArchived]       = useState(false);
  const [archivedUsers, setArchivedUsers]     = useState([]);
  const [archivedLoading, setArchivedLoading] = useState(false);

  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]           = useState(null);
  const [formData, setFormData]     = useState({ firstName: '', lastName: '', email: '', role: 'Staff' });

  const initialFormState = { firstName: '', lastName: '', email: '', role: 'Staff' };

  const actionButtonBase =
    'inline-flex items-center justify-center h-10 w-10 rounded-xl transition-colors duration-200 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1072b3]/20';

  const capitalize = (str) =>
    str ? str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '';

  const formatTimestamp = (value) => {
    if (!value) return 'Never';
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const showWarn = (message) => {
    setWarnMessage(message);
    setTimeout(() => setWarnMessage(null), 6000);
  };

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Token ${localStorage.getItem('authToken')}`,
  });

  const ALL_ROLES = ['Staff', 'Collaborator'];

  const toggleRole = (role) => {
    setFilterRoles(prev => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role); else next.add(role);
      return next;
    });
  };

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target))
        setShowFilterPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch active users ──
  const fetchUsers = async () => {
    try {
      setError(null);
      const response = await fetch(`${API}/api/users/`, { headers: authHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      setUsers(await response.json());
    } catch (error) {
      setError(`Failed to load users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch archived users ──
  const fetchArchivedUsers = async () => {
    setArchivedLoading(true);
    try {
      setError(null);
      const response = await fetch(`${API}/api/users/?archived=true`, { headers: authHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      setArchivedUsers(await response.json());
    } catch (error) {
      setError(`Failed to load archived users: ${error.message}`);
    } finally {
      setArchivedLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { if (showArchived) fetchArchivedUsers(); }, [showArchived]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterRoles, pageSize, showArchived]);

  // ── Display logic (mirrors SchoolIntelligence) ──
  const displayUsers = showArchived ? archivedUsers : users;
  const filteredUsers = displayUsers.filter(user => {
    if (user.role === 'Admin') return false;
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRoles.size === 0 || filterRoles.has(user.role);
    return matchesSearch && matchesRole;
  });

  const totalPages    = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // ── Form handlers ──
  const handleFormSubmit = (e) => {
    e.preventDefault();
    const userName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
    setPendingAction({ type: editingUser ? 'edit' : 'create', userName });
  };

  const executeCreate = async () => {
    setIsSubmitting(true); setError(null);
    try {
      const userData = {
        first_name: formData.firstName.trim(),
        last_name:  formData.lastName.trim(),
        email:      formData.email.trim(),
        username:   formData.email.trim(),
        role:       formData.role,
        is_active:  true,
      };
      const response    = await fetch(`${API}/api/users/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(userData) });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.detail || responseData.error || `HTTP ${response.status}`);
      const name = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      setFormData(initialFormState);
      await fetchUsers();
      setShowModal(false); setPendingAction(null);
      if (responseData.email_delivered === false) {
        showWarn(`User ${name} was created, but the welcome email could not be delivered. Please provide the temporary password manually.`);
      } else {
        showSuccess(`User ${name} was created. A temporary password was sent to ${formData.email.trim()}.`);
      }
    } catch (error) {
      setError(`Failed to create user: ${error.message}`); setPendingAction(null);
    } finally { setIsSubmitting(false); }
  };

  const executeEdit = async () => {
    setIsSubmitting(true); setError(null);
    try {
      const userData = {
        first_name: formData.firstName.trim(),
        last_name:  formData.lastName.trim(),
        email:      formData.email.trim(),
        username:   formData.email.trim(),
        role:       formData.role,
      };
      const response    = await fetch(`${API}/api/users/${editingUser.id}/`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(userData) });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.detail || responseData.error || `HTTP ${response.status}`);
      const name = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      await fetchUsers(); setShowModal(false); setEditingUser(null); setPendingAction(null);
      showSuccess(`User ${name} was updated successfully.`);
    } catch (error) {
      setError(`Failed to update user: ${error.message}`); setPendingAction(null);
    } finally { setIsSubmitting(false); }
  };

  // ── Archive (soft-delete, mirrors SchoolIntelligence) ──
  const executeArchive = async () => {
    const userId = pendingAction?.userId;
    const name   = pendingAction?.userName;
    setIsSubmitting(true); setError(null);
    try {
      const response = await fetch(`${API}/api/users/${userId}/`, { method: 'DELETE', headers: authHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await fetchUsers(); setPendingAction(null);
      showSuccess(`User "${name}" has been archived.`);
    } catch (error) {
      setError(`Failed to archive user: ${error.message}`); setPendingAction(null);
    } finally { setIsSubmitting(false); }
  };

  // ── Unarchive (restore, mirrors SchoolIntelligence) ──
  const executeUnarchive = async () => {
    const userId = pendingAction?.userId;
    const name   = pendingAction?.userName;
    setIsSubmitting(true); setError(null);
    try {
      const response = await fetch(`${API}/api/users/${userId}/`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ is_archived: false }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await Promise.all([fetchUsers(), fetchArchivedUsers()]);
      setPendingAction(null);
      showSuccess(`User "${name}" has been restored.`);
    } catch (error) {
      setError(`Failed to restore user: ${error.message}`); setPendingAction(null);
    } finally { setIsSubmitting(false); }
  };

  const handleConfirm = () => {
    if (pendingAction?.type === 'create')    executeCreate();
    else if (pendingAction?.type === 'edit') executeEdit();
    else if (pendingAction?.type === 'archive')   executeArchive();
    else if (pendingAction?.type === 'unarchive') executeUnarchive();
  };

  const confirmConfig = {
    create: {
      icon: <UserPlus className="w-7 h-7 text-[#1072b3]" />,
      iconBg: 'bg-[#1072b3]/10',
      title: 'Create User',
      message: (name) => `Create a new account for ${name}?`,
      confirmLabel: 'Create',
    },
    edit: {
      icon: <Edit2 className="w-7 h-7 text-[#1072b3]" />,
      iconBg: 'bg-[#1072b3]/10',
      title: 'Save Changes',
      message: (name) => `Save the changes made to ${name}'s account?`,
      confirmLabel: 'Save Changes',
    },
    archive: {
      icon: <Archive className="w-7 h-7 text-[#1072b3]" />,
      iconBg: 'bg-[#1072b3]/10',
      title: 'Archive User',
      message: (name) => `Are you sure you want to archive "${name}"? They will be hidden from the active list.`,
      confirmLabel: 'Archive',
    },
    unarchive: {
      icon: <RotateCcw className="w-7 h-7 text-[#1072b3]" />,
      iconBg: 'bg-[#1072b3]/10',
      title: 'Restore User',
      message: (name) => `Restore "${name}" and make them active again?`,
      confirmLabel: 'Restore',
    },
  };

  const handleOpenModal = () => {
    setFormData(initialFormState); setEditingUser(null); setError(null); setShowModal(true);
  };

  const handleOpenEditModal = (user) => {
    setFormData({
      firstName: (user.first_name || '').toUpperCase(),
      lastName:  (user.last_name  || '').toUpperCase(),
      email:     user.email || '',
      role:      user.role  || 'Staff',
    });
    setEditingUser(user); setError(null); setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false); setEditingUser(null); setFormData(initialFormState);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Success Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[300] bg-[#1072b3] text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-3"
          >
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="opacity-70 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning Toast */}
      <AnimatePresence>
        {warnMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[300] bg-amber-500 text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-3 max-w-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{warnMessage}</span>
            <button onClick={() => setWarnMessage(null)} className="opacity-70 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-secondary uppercase tracking-tight">User Management</h2>
          <p className="text-slate-500 text-sm font-medium">Manage institutional access and roles.</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center gap-2 px-6 py-2.5 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border-2 border-transparent rounded-lg bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.99] group outline-none"
        >
          <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Search & Filter Bar — with Archive toggle matching SchoolIntelligence */}
      <div className="bg-white rounded shadow-sm border border-gray-100 flex flex-col md:flex-row items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#1072b3] transition-colors" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-none rounded py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#1072b3]/20 transition-all outline-none"
          />
        </div>

        {/* Archive toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 px-4 py-3">
          <button
            onClick={() => { setShowArchived(v => !v); setSearchQuery(''); setFilterRoles(new Set()); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border outline-none',
              showArchived
                ? 'bg-[#1072b3]/10 text-[#1072b3] border-[#1072b3]/20 hover:bg-[#1072b3]/20'
                : 'bg-white text-slate-500 border-gray-200 hover:border-[#f6ce11]/60 hover:text-[#1072b3]'
            )}
          >
            <Archive className="w-4 h-4" />
            {showArchived ? 'View Active' : 'View Archived'}
          </button>

          {/* Role filter — only shown when viewing active */}
          {!showArchived && (
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilterPanel(p => !p)}
                className="flex items-center gap-2 py-2 px-3 text-xs text-slate-600 border border-gray-200 rounded bg-white hover:border-[#f6ce11]/60 hover:text-[#1072b3] transition-colors outline-none cursor-pointer"
              >
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="font-black uppercase tracking-wider truncate max-w-[80px]">
                  {filterRoles.size === 0 ? 'Roles' : [...filterRoles].join(', ')}
                </span>
                <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform shrink-0', showFilterPanel && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {showFilterPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg w-48 p-2"
                  >
                    {ALL_ROLES.map(role => (
                      <label key={role} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer select-none">
                        <input type="checkbox" checked={filterRoles.has(role)} onChange={() => toggleRole(role)}
                          className="w-4 h-4 rounded accent-[#1072b3] cursor-pointer" />
                        <span className="text-xs font-black text-gray-700 uppercase tracking-wider">{role}</span>
                      </label>
                    ))}
                    {filterRoles.size > 0 && (
                      <button onClick={() => setFilterRoles(new Set())}
                        className="w-full mt-1 py-1.5 text-[10px] font-black text-gray-400 hover:text-gray-600 transition-colors text-center uppercase tracking-widest outline-none">
                        Clear filter
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Table Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={showArchived ? 'archived' : 'active'}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="bg-white rounded shadow-sm border border-gray-100 flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 350px)' }}
        >
          <div className="flex-1 overflow-auto min-h-[250px]">
            {(loading || (showArchived && archivedLoading)) ? (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1072b3]" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-400">
                <Search className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-black uppercase tracking-widest">
                  {searchQuery
                    ? 'No users match your search.'
                    : showArchived
                      ? 'No archived users.'
                      : 'No users found.'}
                </p>
                {!searchQuery && !showArchived && (
                  <button onClick={handleOpenModal}
                    className="mt-4 px-5 py-2.5 bg-[#1072b3] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#f6ce11] hover:text-black transition-all duration-300 outline-none">
                    Add First User
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-gray-100 shadow-[0_2px_0_0_#e5e7eb]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[8%]">Avatar</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[18%]">Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[24%]">Email</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[12%]">Role</th>
                    {!showArchived && (
                      <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[12%]">Status</th>
                    )}
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[16%]">Last Login</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => setFocusedRowId(focusedRowId === user.id ? null : user.id)}
                      className={cn(
                        'cursor-pointer transition-all duration-200 group',
                        focusedRowId === user.id
                          ? 'bg-[#1072b3]/5 hover:bg-[#1072b3]/10 border-l-4 border-[#1072b3]'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={`${capitalize(user.first_name)} ${capitalize(user.last_name)}`} className="w-full h-full object-cover" />
                          ) : (
                            `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                          {capitalize(user.first_name)} {capitalize(user.last_name)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider">{user.role}</span>
                      </td>
                      {!showArchived && (
                        <td className="px-6 py-4">
                          <span className={cn(
                            'px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5',
                            user.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                          )}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', user.is_active ? 'bg-green-600' : 'bg-gray-400')} />
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatTimestamp(user.last_login)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setViewingUser(user); }}
                            className={`${actionButtonBase} hover:text-[#1072b3]`} title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {showArchived ? (
                            /* ── Archived row: only show Restore ── */
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPendingAction({ type: 'unarchive', userId: user.id, userName: `${user.first_name} ${user.last_name}` }); }}
                              className={`${actionButtonBase} hover:text-[#1072b3]`} title="Restore User"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            /* ── Active row: Edit + Archive ── */
                            <>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleOpenEditModal(user); }}
                                className={`${actionButtonBase} hover:text-green-600`} title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setPendingAction({ type: 'archive', userId: user.id, userName: `${user.first_name} ${user.last_name}` }); }}
                                className={`${actionButtonBase} hover:text-amber-600`} title="Archive"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination footer */}
          <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1072b3]/20"
              >
                {[10, 25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
              </select>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">entries</span>
              <span className="text-gray-400 ml-2 text-xs font-bold">({filteredUsers.length} {showArchived ? 'archived' : 'total'})</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-black uppercase tracking-widest text-gray-600 disabled:opacity-50 hover:border-[#1072b3]/30 hover:text-[#1072b3] transition-colors outline-none"
              >
                Previous
              </button>
              <div className="flex items-center gap-2 text-xs text-gray-700 font-black uppercase tracking-wider">
                <span>Page {currentPage} of {totalPages}</span>
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-black uppercase tracking-widest text-gray-600 disabled:opacity-50 hover:border-[#1072b3]/30 hover:text-[#1072b3] transition-colors outline-none"
              >
                Next
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Unified Confirmation Dialog ── */}
      <AnimatePresence>
        {pendingAction && (() => {
          const cfg = confirmConfig[pendingAction.type];
          if (!cfg) return null;
          return (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => !isSubmitting && setPendingAction(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-white rounded-lg shadow-2xl p-8 border border-slate-100"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className={cn('w-16 h-16 rounded-lg flex items-center justify-center', cfg.iconBg)}>
                    {cfg.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{cfg.title}</h3>
                    <p className="text-[11px] font-bold text-slate-500 mt-2 leading-relaxed uppercase tracking-wide">
                      {cfg.message(pendingAction.userName)}
                    </p>
                  </div>
                  <div className="flex gap-3 w-full mt-4">
                    <button
                      onClick={() => setPendingAction(null)} disabled={isSubmitting}
                      className="flex-1 px-4 py-3.5 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-50 outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm} disabled={isSubmitting}
                      className="flex-1 px-4 py-3.5 bg-[#1072b3] text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 hover:bg-[#f6ce11] hover:text-black hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 outline-none active:scale-[0.99]"
                    >
                      {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing</> : cfg.confirmLabel}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ── View Details Modal ── */}
      <AnimatePresence>
        {viewingUser && (
          <motion.div
            key="user-view"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setViewingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="bg-[#03396c] p-8 text-white flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/20 flex items-center justify-center text-xl font-black uppercase shadow-inner">
                    {viewingUser.avatar_url ? (
                      <img src={viewingUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      `${viewingUser.first_name?.[0] || ''}${viewingUser.last_name?.[0] || ''}`.toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight leading-none">{viewingUser.first_name} {viewingUser.last_name}</h3>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1.5">{viewingUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setViewingUser(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors relative z-10 outline-none">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Role</p>
                    <div className="flex items-center gap-2">
                      <Shield className={cn('w-3.5 h-3.5', viewingUser.role === 'Admin' ? 'text-[#1072b3]' : 'text-slate-400')} />
                      <p className="text-xs font-black text-slate-800 uppercase">{viewingUser.role}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Status</p>
                    <span className={cn(
                      'px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 border',
                      viewingUser.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                    )}>
                      <div className={cn('w-1.5 h-1.5 rounded-full', viewingUser.is_active ? 'bg-green-600' : 'bg-slate-400')} />
                      {viewingUser.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Institutional Link</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-xs font-bold text-slate-800">{viewingUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Last Activity</p>
                    <p className="text-[10px] font-black text-slate-800 uppercase">
                      {viewingUser.last_login ? formatTimestamp(viewingUser.last_login) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Security</p>
                    <span className={cn(
                      'px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5',
                      viewingUser.must_change_password ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', viewingUser.must_change_password ? 'bg-amber-500' : 'bg-slate-400')} />
                      {viewingUser.must_change_password ? 'Temp Pwd' : 'Verified'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 flex gap-3">
                {!showArchived && (
                  <button
                    onClick={() => { setViewingUser(null); handleOpenEditModal(viewingUser); }}
                    className="flex-1 py-4 bg-[#1072b3] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#f6ce11] hover:text-black transition-all duration-300 outline-none"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => setViewingUser(null)}
                  className="flex-1 py-4 bg-white border-2 border-[#1072b3] text-[#1072b3] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#f6ce11] hover:border-[#f6ce11] hover:text-black transition-all duration-300 outline-none"
                >
                  Close Record
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add / Edit User Modal ── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-200"
            >
              <form onSubmit={handleFormSubmit}>
                <div className="p-8 bg-[#1072b3] text-white flex items-center justify-between relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-black uppercase tracking-tight">{editingUser ? 'Update Profile' : 'New Institutional Access'}</h3>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">User Identity Management</p>
                  </div>
                  <button type="button" onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-lg transition-colors relative z-10 outline-none">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Given Name</label>
                      <input
                        required type="text" placeholder="FIRST NAME"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value.replace(/[^a-zA-Z\s\-']/g, '').toUpperCase() })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-4 px-5 text-sm font-bold uppercase focus:bg-white focus:border-[#1072b3] focus:ring-4 focus:ring-[#1072b3]/5 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Surname</label>
                      <input
                        required type="text" placeholder="LAST NAME"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value.replace(/[^a-zA-Z\s\-']/g, '').toUpperCase() })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-4 px-5 text-sm font-bold uppercase focus:bg-white focus:border-[#1072b3] focus:ring-4 focus:ring-[#1072b3]/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Email</label>
                    <input
                      required type="email" placeholder="NAME@SLC-SFLU.EDU.PH"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-4 px-5 text-sm font-bold focus:bg-white focus:border-[#1072b3] focus:ring-4 focus:ring-[#1072b3]/5 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hub Designation</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-4 px-5 text-[11px] font-black uppercase tracking-widest focus:bg-white focus:border-[#1072b3] transition-all outline-none cursor-pointer appearance-none"
                    >
                      <option value="Staff">Staff</option>
                      <option value="Admin">Admin</option>
                      <option value="Collaborator">Collaborator</option>
                    </select>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                  <button type="button" onClick={handleCloseModal}
                    className="flex-1 px-6 py-4 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all outline-none">
                    Discard
                  </button>
                  <button type="submit"
                    className="flex-1 px-6 py-4 bg-[#1072b3] text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#f6ce11] hover:text-black transition-all duration-300 shadow-lg shadow-[#1072b3]/20 flex items-center justify-center gap-2 outline-none">
                    {editingUser ? 'Commit Changes' : 'Initialize Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;