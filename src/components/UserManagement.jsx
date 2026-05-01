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
  const [searchQuery, setSearchQuery]       = useState('');
  const [filterRoles, setFilterRoles]       = useState(new Set());
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterRef = useRef(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [focusedRowId, setFocusedRowId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  // pendingAction: { type: 'create' | 'edit' | 'delete', userId?, userName? }
  const [successMessage, setSuccessMessage] = useState(null);
  const [warnMessage, setWarnMessage] = useState(null);

  // Database States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Staff'
  });

  const initialFormState = {
    firstName: '',
    lastName: '',
    email: '',
    role: 'Staff'
  };

  const actionButtonBase = 'inline-flex items-center justify-center h-10 w-10 rounded-xl transition-colors duration-200 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20';

  const capitalize = (str) => str
    ? str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    : '';

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
    'Authorization': `Token ${localStorage.getItem('authToken')}`
  });

  const ALL_ROLES = ['Staff', 'Collaborator'];

  const toggleRole = (role) => {
    setFilterRoles(prev => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
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

  // 1. Fetch Users
  const fetchUsers = async () => {
    try {
      setError(null);
      const response = await fetch(`${API}/api/users/`, { headers: authHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError(`Failed to load users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRoles, pageSize]);

  // 2. Form submit — triggers confirm dialog instead of immediate API call
  const handleFormSubmit = (e) => {
    e.preventDefault();
    const userName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
    if (editingUser) {
      setPendingAction({ type: 'edit', userName });
    } else {
      setPendingAction({ type: 'create', userName });
    }
  };

  // 3. Execute Create
  const executeCreate = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const userData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        username: formData.email.trim(),
        role: formData.role,
        is_active: true
      };
      const response = await fetch(`${API}/api/users/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(userData)
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.detail || responseData.error || `HTTP ${response.status}`);

      const name = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      setFormData(initialFormState);
      await fetchUsers();
      setShowModal(false);
      setPendingAction(null);

      if (responseData.email_delivered === false) {
        showWarn(`User ${name} was created, but the welcome email could not be delivered. Please provide the temporary password manually.`);
      } else {
        showSuccess(`User ${name} was created. A temporary password was sent to ${formData.email.trim()}.`);
      }
    } catch (error) {
      setError(`Failed to create user: ${error.message}`);
      setPendingAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Execute Edit
  const executeEdit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const userData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        username: formData.email.trim(),
        role: formData.role,
      };
      const response = await fetch(`${API}/api/users/${editingUser.id}/`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(userData)
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.detail || responseData.error || `HTTP ${response.status}`);

      const name = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      await fetchUsers();
      setShowModal(false);
      setEditingUser(null);
      setPendingAction(null);
      showSuccess(`User ${name} was updated successfully.`);
    } catch (error) {
      setError(`Failed to update user: ${error.message}`);
      setPendingAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Execute Deactivate
  const executeDelete = async () => {
    const userId = pendingAction?.userId;
    const user = users.find(u => u.id === userId);
    setIsSubmitting(true);
    try {
      setError(null);
      const response = await fetch(`${API}/api/users/${userId}/`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      await fetchUsers();
      setPendingAction(null);
      showSuccess(`User ${user?.first_name} ${user?.last_name} has been deactivated.`);
    } catch (error) {
      setError(`Failed to deactivate user: ${error.message}`);
      setPendingAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5b. Execute Reactivate
  const executeReactivate = async () => {
    const userId = pendingAction?.userId;
    const user = users.find(u => u.id === userId);
    setIsSubmitting(true);
    try {
      setError(null);
      const response = await fetch(`${API}/api/users/${userId}/`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ is_active: true })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      await fetchUsers();
      setPendingAction(null);
      showSuccess(`User ${user?.first_name} ${user?.last_name} has been reactivated.`);
    } catch (error) {
      setError(`Failed to reactivate user: ${error.message}`);
      setPendingAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Confirm dispatcher
  const handleConfirm = () => {
    if (pendingAction?.type === 'create') executeCreate();
    else if (pendingAction?.type === 'edit') executeEdit();
    else if (pendingAction?.type === 'delete') executeDelete();
    else if (pendingAction?.type === 'reactivate') executeReactivate();
  };

  // Confirm dialog content per action type
  const confirmConfig = {
    create: {
      icon: <UserPlus className="w-7 h-7 text-primary" />,
      iconBg: 'bg-primary/10',
      title: 'Create User',
      message: (name) => `Create a new account for ${name}?`,
      confirmLabel: 'Create',
      confirmClass: 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20'
    },
    edit: {
      icon: <Edit2 className="w-7 h-7 text-amber-500" />,
      iconBg: 'bg-amber-50',
      title: 'Save Changes',
      message: (name) => `Save the changes made to ${name}'s account?`,
      confirmLabel: 'Save Changes',
      confirmClass: 'bg-amber-500 hover:bg-amber-600'
    },
    delete: {
      icon: <UserX className="w-7 h-7 text-amber-500" />,
      iconBg: 'bg-amber-50',
      title: 'Deactivate User',
      message: (name) => `Are you sure you want to deactivate ${name}? They will no longer be able to log in.`,
      confirmLabel: 'Deactivate',
      confirmClass: 'bg-amber-500 hover:bg-amber-600'
    },
    reactivate: {
      icon: <UserCheck className="w-7 h-7 text-green-600" />,
      iconBg: 'bg-green-50',
      title: 'Reactivate User',
      message: (name) => `Reactivate ${name}'s account? They will regain access to the system.`,
      confirmLabel: 'Reactivate',
      confirmClass: 'bg-green-600 hover:bg-green-700'
    }
  };

  // 7. Filter logic — Admin is always excluded from the list
  const filteredUsers = users.filter(user => {
    if (user.role === 'Admin') return false;
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRoles.size === 0 || filterRoles.has(user.role);
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleOpenModal = () => {
    setFormData(initialFormState);
    setEditingUser(null);
    setError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (user) => {
    setFormData({
      firstName: (user.first_name || '').toUpperCase(),
      lastName: (user.last_name || '').toUpperCase(),
      email: user.email || '',
      role: user.role || 'Staff'
    });
    setEditingUser(user);
    setError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData(initialFormState);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Success Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[300] bg-primary text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-3"
          >
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="opacity-70 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning Toast (email delivery failure) */}
      <AnimatePresence>
        {warnMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-500 text-sm mt-1">Manage institutional access and roles.</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-md text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group"
        >
          <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Add New User
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded shadow-sm border border-gray-100 flex flex-col md:flex-row items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-none rounded py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>

        {/* Role checklist filter */}
        <div className="relative w-full md:w-56 border-t md:border-t-0 md:border-l border-gray-100" ref={filterRef}>
          <button
            onClick={() => setShowFilterPanel(p => !p)}
            className="w-full flex items-center justify-between gap-2 py-3.5 px-4 text-sm text-gray-600 hover:bg-gray-50 transition-colors outline-none cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">
                {filterRoles.size === 0 ? 'All Roles' : [...filterRoles].join(', ')}
              </span>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-gray-400 transition-transform shrink-0",
              showFilterPanel && "rotate-180"
            )} />
          </button>

          <AnimatePresence>
            {showFilterPanel && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg w-48 p-2"
              >
                {ALL_ROLES.map(role => (
                  <label
                    key={role}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={filterRoles.has(role)}
                      onChange={() => toggleRole(role)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 font-medium">{role}</span>
                  </label>
                ))}
                {filterRoles.size > 0 && (
                  <button
                    onClick={() => setFilterRoles(new Set())}
                    className="w-full mt-1 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors text-center"
                  >
                    Clear filter
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Table Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key="users"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="bg-white rounded shadow-sm border border-gray-100 flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 320px)' }}
        >
          {/* Scrollable body */}
          <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-400">
              <Search className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No users found</p>
              <p className="text-xs mt-1 opacity-70">Try adjusting your search or filter.</p>
            </div>
          ) : (
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-gray-100 shadow-[0_2px_0_0_#e5e7eb]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[8%]">Avatar</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[18%]">Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[24%]">Email</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[12%]">Role</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[12%]">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[16%]">Last Login</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-[10%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => setFocusedRowId(focusedRowId === user.id ? null : user.id)}
                      className={cn(
                        "cursor-pointer transition-all duration-200 group",
                        focusedRowId === user.id
                          ? "bg-primary/5 hover:bg-primary/10 border-l-4 border-primary"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={`${capitalize(user.first_name)} ${capitalize(user.last_name)}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-bold text-gray-900">
                            {capitalize(user.first_name)} {capitalize(user.last_name)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.role}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5',
                          user.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', user.is_active ? 'bg-green-600' : 'bg-gray-400')} />
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setViewingUser(user); }}
                            className={`${actionButtonBase} hover:text-blue-600`}
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(user); }}
                            className={`${actionButtonBase} hover:text-green-600`}
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {user.is_active ? (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPendingAction({ type: 'delete', userId: user.id, userName: `${user.first_name} ${user.last_name}` }); }}
                              className={`${actionButtonBase} hover:text-amber-600`}
                              title="Deactivate"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPendingAction({ type: 'reactivate', userId: user.id, userName: `${user.first_name} ${user.last_name}` }); }}
                              className={`${actionButtonBase} hover:text-green-600`}
                              title="Activate"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          )}
          </div>

          {/* Pagination — pinned to bottom */}
          <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>entries</span>
              <span className="text-gray-400 ml-2">({filteredUsers.length} total)</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-semibold">Page</span>
                <span>{currentPage}</span>
                <span>of</span>
                <span>{totalPages}</span>
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Unified Confirmation Dialog */}
      <AnimatePresence>
        {pendingAction && (() => {
          const cfg = confirmConfig[pendingAction.type];
          return (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isSubmitting && setPendingAction(null)}
                className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl p-8"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className={cn("w-16 h-16 rounded-full flex items-center justify-center", cfg.iconBg)}>
                    {cfg.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{cfg.title}</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                      {cfg.message(pendingAction.userName)}
                    </p>
                  </div>
                  <div className="flex gap-3 w-full mt-2">
                    <button
                      onClick={() => setPendingAction(null)}
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-gray-100 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={isSubmitting}
                      className={cn(
                        "flex-1 px-6 py-3 text-white rounded-2xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2",
                        cfg.confirmClass
                      )}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                      ) : cfg.confirmLabel}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setViewingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="bg-primary p-8 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center text-xl font-bold uppercase">
                    {viewingUser.avatar_url ? (
                      <img
                        src={viewingUser.avatar_url}
                        alt={`${capitalize(viewingUser.first_name)} ${capitalize(viewingUser.last_name)}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      `${viewingUser.first_name?.[0] || ''}${viewingUser.last_name?.[0] || ''}`.toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{capitalize(viewingUser.first_name)} {capitalize(viewingUser.last_name)}</h3>
                    <p className="text-white/60 text-xs mt-0.5">{viewingUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingUser(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Role</p>
                    <div className="flex items-center gap-2">
                      <Shield className={cn("w-4 h-4", viewingUser.role === 'Admin' ? 'text-primary' : 'text-gray-400')} />
                      <p className="text-sm font-semibold text-gray-800">{viewingUser.role}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5",
                      viewingUser.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", viewingUser.is_active ? 'bg-green-600' : 'bg-gray-400')} />
                      {viewingUser.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-800">{viewingUser.email}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Login</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {viewingUser.last_login
                      ? new Date(viewingUser.last_login).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Never logged in'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Welcome Email</p>
                    <span className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5',
                      viewingUser.email_delivered === false ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', viewingUser.email_delivered === false ? 'bg-red-500' : 'bg-green-500')} />
                      {viewingUser.email_delivered === false ? 'Not Delivered' : 'Delivered'}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Password</p>
                    <span className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5',
                      viewingUser.must_change_password ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', viewingUser.must_change_password ? 'bg-amber-500' : 'bg-gray-400')} />
                      {viewingUser.must_change_password ? 'Pending Change' : 'Set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 pb-8">
                <button
                  onClick={() => setViewingUser(null)}
                  className="w-full py-3.5 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit User Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleFormSubmit}>
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-primary text-white">
                  <div>
                    <h3 className="text-xl font-bold">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                    <p className="text-white/60 text-xs mt-1 uppercase tracking-widest font-bold">Institutional Access</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">First Name</label>
                      <input
                        required
                        type="text"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value.replace(/[^a-zA-Z\s\-']/g, '').toUpperCase()})}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
                      <input
                        required
                        type="text"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value.replace(/[^a-zA-Z\s\-']/g, '').toUpperCase()})}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Institutional Email</label>
                    <input
                      required
                      type="email"
                      placeholder="example@slc.edu.ph"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="Staff">Staff</option>
                        <option value="Admin">Admin</option>
                        <option value="Collaborator">Collaborator</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gray-50 flex gap-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    {editingUser ? 'Save Changes' : 'Create User'}
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
