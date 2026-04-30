import React, { useState, useEffect } from 'react';
import {
  Search, MapPin, Users, GraduationCap, Calendar, Plus, Edit2, Archive,
  School, ChevronRight, TrendingUp, Filter, X, Phone, User, Loader2,
  AlertCircle, Eye, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const API = 'http://127.0.0.1:8000';
const STRAND_OPTIONS = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL', 'ICT'];

const initialForm = {
  schoolName: '', street: '', barangay: '', city: '', province: '',
  contactInfo: '', principalName: '', strands: [],
  estimatedStudents: '', lastVisited: '',
};

const SchoolIntelligence = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [archivedSchools, setArchivedSchools] = useState([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [viewingSchool, setViewingSchool] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [focusedRowId, setFocusedRowId] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const actionButtonBase = 'inline-flex items-center justify-center h-10 w-10 rounded-xl transition-colors duration-200 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20';

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Token ${localStorage.getItem('authToken')}`,
  });

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const fetchSchools = async () => {
    try {
      setError(null);
      const res = await fetch(`${API}/api/schools/`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      setSchools(await res.json());
    } catch (e) {
      setError(`Failed to load schools: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedSchools = async () => {
    setArchivedLoading(true);
    try {
      setError(null);
      const res = await fetch(`${API}/api/schools/?archived=true`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      setArchivedSchools(await res.json());
    } catch (e) {
      setError(`Failed to load archived schools: ${e.message}`);
    } finally {
      setArchivedLoading(false);
    }
  };

  useEffect(() => { fetchSchools(); }, []);

  useEffect(() => {
    if (showArchived) fetchArchivedSchools();
  }, [showArchived]);

  const displaySchools = showArchived ? archivedSchools : schools;
  const filteredSchools = displaySchools.filter(s =>
    s.school_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Recruitment insights computed from data
  const topFeeder = schools.length > 0
    ? schools.reduce((max, s) => s.estimated_students > max.estimated_students ? s : max)
    : null;
  const totalStudents = schools.reduce((sum, s) => sum + s.estimated_students, 0);

  const municipalityGroups = schools.reduce((acc, s) => {
    const parts = s.address.split(',');
    const city = (parts.length >= 3 ? parts[2] : parts[parts.length - 1] || 'Unknown').trim();
    acc[city] = (acc[city] || 0) + s.estimated_students;
    return acc;
  }, {});
  const topMunicipalities = Object.entries(municipalityGroups)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);
  const maxMunicipalityStudents = topMunicipalities.length > 0 ? topMunicipalities[0][1] : 1;
  const municipalityColors = ['bg-primary', 'bg-secondary', 'bg-light', 'bg-accent'];

  const openAddModal = () => {
    setFormData(initialForm);
    setEditingSchool(null);
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (school) => {
    const parts = school.address.split(', ');
    setFormData({
      schoolName: school.school_name,
      street: parts[0] || '',
      barangay: parts[1] || '',
      city: parts[2] || '',
      province: parts[3] || '',
      contactInfo: school.contact_info,
      principalName: school.principal_name,
      strands: school.offered_strands
        ? school.offered_strands.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      estimatedStudents: school.estimated_students.toString(),
      lastVisited: school.last_visited || '',
    });
    setEditingSchool(school);
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSchool(null);
    setFormData(initialForm);
  };

  const buildPayload = () => ({
    school_name: formData.schoolName.trim(),
    address: [formData.street, formData.barangay, formData.city, formData.province]
      .map(s => s.trim()).filter(Boolean).join(', '),
    principal_name: formData.principalName.trim(),
    contact_info: formData.contactInfo.trim(),
    offered_strands: formData.strands.join(', '),
    estimated_students: parseInt(formData.estimatedStudents) || 0,
    last_visited: formData.lastVisited || null,
  });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPendingAction({
      type: editingSchool ? 'edit' : 'create',
      schoolName: formData.schoolName.trim(),
    });
  };

  const executeCreate = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/schools/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      closeModal();
      await fetchSchools();
      setPendingAction(null);
      showSuccess(`School "${formData.schoolName.trim()}" was added successfully.`);
    } catch (e) {
      setError(`Failed to add school: ${e.message}`);
      setPendingAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeEdit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/schools/${editingSchool.id}/`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      closeModal();
      await fetchSchools();
      setPendingAction(null);
      showSuccess(`School "${formData.schoolName.trim()}" was updated successfully.`);
    } catch (e) {
      setError(`Failed to update school: ${e.message}`);
      setPendingAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeArchive = async () => {
    const id = pendingAction?.schoolId;
    const name = pendingAction?.schoolName;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/schools/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchSchools();
      setPendingAction(null);
      showSuccess(`School "${name}" has been archived.`);
    } catch (e) {
      setError(`Failed to archive school: ${e.message}`);
      setPendingAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeUnarchive = async () => {
    const id = pendingAction?.schoolId;
    const name = pendingAction?.schoolName;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/schools/${id}/`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ is_archived: false }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await Promise.all([fetchSchools(), fetchArchivedSchools()]);
      setPendingAction(null);
      showSuccess(`School "${name}" has been restored.`);
    } catch (e) {
      setError(`Failed to restore school: ${e.message}`);
      setPendingAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = () => {
    if (!pendingAction) return;
    if (pendingAction.type === 'create') executeCreate();
    else if (pendingAction.type === 'edit') executeEdit();
    else if (pendingAction.type === 'archive') executeArchive();
    else if (pendingAction.type === 'unarchive') executeUnarchive();
  };

  const confirmConfig = {
    create: {
      icon: <Plus className="w-7 h-7 text-primary" />,
      iconBg: 'bg-primary/10',
      title: 'Add School',
      message: (name) => `Add "${name}" to the school intelligence database?`,
      confirmLabel: 'Add School',
      confirmClass: 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20',
    },
    edit: {
      icon: <Edit2 className="w-7 h-7 text-amber-500" />,
      iconBg: 'bg-amber-50',
      title: 'Save Changes',
      message: (name) => `Save the changes made to "${name}"?`,
      confirmLabel: 'Save Changes',
      confirmClass: 'bg-amber-500 hover:bg-amber-600',
    },
    archive: {
      icon: <Archive className="w-7 h-7 text-amber-500" />,
      iconBg: 'bg-amber-50',
      title: 'Archive School',
      message: (name) => `Are you sure you want to archive "${name}"? It will be hidden from the list.`,
      confirmLabel: 'Archive',
      confirmClass: 'bg-amber-500 hover:bg-amber-600',
    },
    unarchive: {
      icon: <RotateCcw className="w-7 h-7 text-primary" />,
      iconBg: 'bg-primary/10',
      title: 'Restore School',
      message: (name) => `Restore "${name}" and make it active again?`,
      confirmLabel: 'Restore',
      confirmClass: 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20',
    },
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getSchoolIconColor = (school) => {
    const city = (school.address.split(', ')[2] || '').trim();
    const cityStudents = municipalityGroups[city] || 0;
    if (cityStudents >= maxMunicipalityStudents * 0.7) return 'bg-primary';
    if (cityStudents >= maxMunicipalityStudents * 0.4) return 'bg-secondary';
    return 'bg-light';
  };

  const toggleStrand = (strand) => {
    setFormData(prev => ({
      ...prev,
      strands: prev.strands.includes(strand)
        ? prev.strands.filter(s => s !== strand)
        : [...prev.strands, strand],
    }));
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading school intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

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

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3"
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
          <h2 className="text-2xl font-bold text-gray-900">School Intelligence & Trailblazing</h2>
          <p className="text-gray-500 text-sm mt-1">Strategic data on feeder schools and recruitment efforts.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Add New School
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Schools Table */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search */}
          <div className="bg-white rounded shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search schools by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-none rounded py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto pr-3">
              <button
                onClick={() => { setShowArchived(v => !v); setSearchQuery(''); }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded text-sm font-bold transition-all whitespace-nowrap border",
                  showArchived
                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                )}
              >
                <Archive className="w-4 h-4" />
                {showArchived ? 'View Active' : 'View Archived'}
              </button>
              <button className="p-2.5 bg-white border border-gray-200 text-gray-500 rounded hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <AnimatePresence mode="wait">
            <motion.div
              key={showArchived ? 'archived' : 'active'}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden"
            >
              {showArchived && archivedLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredSchools.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <School className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">
                    {searchQuery ? 'No schools match your search.' : showArchived ? 'No archived schools.' : 'No schools added yet.'}
                  </p>
                  {!searchQuery && !showArchived && (
                    <button
                      onClick={openAddModal}
                      className="mt-3 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
                    >
                      Add First School
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto min-h-[300px]">
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">School</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">Strands Offered</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">Last Visited</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSchools.map((school) => (
                        <tr
                          key={school.id}
                          onClick={() => setFocusedRowId(focusedRowId === school.id ? null : school.id)}
                          className={cn(
                            "cursor-pointer transition-all duration-200 group",
                            focusedRowId === school.id
                              ? "bg-primary/5 hover:bg-primary/10 border-l-4 border-primary"
                              : "hover:bg-gray-50"
                          )}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                getSchoolIconColor(school)
                              )}>
                                <School className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{school.school_name}</p>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <MapPin className="w-3 h-3" />{school.address}
                                  </span>
                                  <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <Users className="w-3 h-3" />{school.estimated_students.toLocaleString()} students
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {school.offered_strands
                                ? school.offered_strands.split(',').map(s => s.trim()).filter(Boolean).map((strand, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase">
                                      {strand}
                                    </span>
                                  ))
                                : <span className="text-xs text-gray-400">—</span>
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {school.last_visited ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {formatDate(school.last_visited)}
                              </div>
                            ) : (
                              <span className="text-gray-400">Not visited</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); setViewingSchool(school); }}
                                className={`${actionButtonBase} hover:text-blue-600`}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {showArchived ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setPendingAction({ type: 'unarchive', schoolId: school.id, schoolName: school.school_name }); }}
                                  className={`${actionButtonBase} hover:text-primary`}
                                  title="Restore School"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openEditModal(school); }}
                                    className={`${actionButtonBase} hover:text-green-600`}
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setPendingAction({ type: 'archive', schoolId: school.id, schoolName: school.school_name }); }}
                                    className={`${actionButtonBase} hover:text-amber-600`}
                                    title="Archive"
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
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Insights */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Recruitment Insights</h3>
            <div className="space-y-6">
              {topFeeder ? (
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Top Feeder</span>
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">{topFeeder.school_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{topFeeder.address}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {totalStudents > 0 ? Math.round((topFeeder.estimated_students / totalStudents) * 100) : 0}% of total students
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl text-center">
                  <p className="text-xs text-gray-400">No schools added yet.</p>
                </div>
              )}

              {topMunicipalities.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Performance by Municipality</h4>
                  {topMunicipalities.map(([city, count], idx) => {
                    const pct = Math.round((count / maxMunicipalityStudents) * 100);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-700">{city}</span>
                          <span className="font-bold text-gray-500">{pct}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className={cn("h-full rounded-full", municipalityColors[idx] || 'bg-primary')}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-primary p-8 rounded-3xl shadow-lg shadow-primary/20 text-white relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <GraduationCap className="w-10 h-10 text-accent mb-4" />
            <h3 className="text-lg font-bold mb-2">Trailblazing Goals</h3>
            <p className="text-white/70 text-sm mb-6">
              {schools.filter(s => s.last_visited).length} of {schools.length} schools visited.
              {schools.length > 0 && schools.length - schools.filter(s => s.last_visited).length > 0
                ? ` ${schools.length - schools.filter(s => s.last_visited).length} more to go.`
                : schools.length > 0 ? ' All schools visited!' : ''}
            </p>
            <button className="w-full py-3 bg-white text-primary rounded-xl text-sm font-bold hover:bg-accent hover:text-primary transition-all flex items-center justify-center gap-2">
              View Schedule
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit School Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-primary text-white flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold">{editingSchool ? 'Edit School' : 'Add New School'}</h3>
                  <p className="text-white/60 text-xs mt-1 uppercase tracking-widest font-bold">Trailblazing Intelligence</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                  {/* School Name */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">School Name</label>
                    <div className="relative group">
                      <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                      <input
                        required
                        type="text"
                        placeholder="Enter official school name"
                        value={formData.schoolName}
                        onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Address fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Street</label>
                      <input
                        type="text"
                        placeholder="Street address"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Barangay</label>
                      <input
                        type="text"
                        placeholder="Barangay"
                        value={formData.barangay}
                        onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">City / Municipality</label>
                      <input
                        required
                        type="text"
                        placeholder="City or Municipality"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Province</label>
                      <input
                        type="text"
                        placeholder="Province"
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Contact Info</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        placeholder="Phone or Email"
                        value={formData.contactInfo}
                        onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Principal */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">School Principal</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        placeholder="Full Name of Principal"
                        value={formData.principalName}
                        onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Strands */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Strands Offered</label>
                    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-2xl">
                      {STRAND_OPTIONS.map(strand => (
                        <button
                          key={strand}
                          type="button"
                          onClick={() => toggleStrand(strand)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                            formData.strands.includes(strand)
                              ? "bg-primary text-white shadow-sm"
                              : "bg-white text-gray-500 border border-gray-200 hover:border-primary/30"
                          )}
                        >
                          {strand}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Estimated Students */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Estimated Students</label>
                    <div className="relative group">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                      <input
                        type="number"
                        min="0"
                        placeholder="Total population"
                        value={formData.estimatedStudents}
                        onChange={(e) => setFormData({ ...formData, estimatedStudents: e.target.value })}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Last Visited */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Last Visited</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                      <input
                        type="date"
                        value={formData.lastVisited}
                        onChange={(e) => setFormData({ ...formData, lastVisited: e.target.value })}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gray-50 flex gap-4 flex-shrink-0">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    {editingSchool ? 'Save Changes' : 'Save School Data'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {pendingAction && (() => {
          const cfg = confirmConfig[pendingAction.type];
          if (!cfg) return null;
          return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
                      {cfg.message(pendingAction.schoolName)}
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

      {/* View Details Modal */}
      <AnimatePresence>
        {viewingSchool && (
          <motion.div
            key="school-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setViewingSchool(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-primary p-8 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                    <School className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{viewingSchool.school_name}</h3>
                    <p className="text-white/60 text-xs mt-0.5">{viewingSchool.address}</p>
                  </div>
                </div>
                <button onClick={() => setViewingSchool(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Students</p>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-semibold text-gray-800">{viewingSchool.estimated_students.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Visited</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-semibold text-gray-800">{formatDate(viewingSchool.last_visited) || '—'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Strands Offered</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingSchool.offered_strands
                      ? viewingSchool.offered_strands.split(',').map(s => s.trim()).filter(Boolean).map((strand, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold uppercase">{strand}</span>
                        ))
                      : <span className="text-xs text-gray-400">—</span>
                    }
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Principal</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-800">{viewingSchool.principal_name || '—'}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Contact</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-800">{viewingSchool.contact_info || '—'}</p>
                  </div>
                </div>
              </div>
              <div className="px-8 pb-8 flex gap-3">
                <button
                  onClick={() => { setViewingSchool(null); openEditModal(viewingSchool); }}
                  className="flex-1 py-3.5 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => setViewingSchool(null)}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SchoolIntelligence;
