import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Loader2, AlertCircle, Info,
  ExternalLink, Link as LinkIcon, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { API, authHeaders } from '../config/api';

const fmtDate = (d) =>
  d
    ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null;

const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null;

const NA = <span className="text-gray-300 italic">N/A</span>;
const val = (v) => (v && String(v).trim() ? v : NA);

// ---------------------------------------------------------------------------
// Read-only field components
// ---------------------------------------------------------------------------

const ReadField = ({ label, hint, value, className }) => (
  <div className={cn('space-y-1.5', className)}>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      {hint && <p className="text-[10px] text-gray-300 mt-0.5">{hint}</p>}
    </div>
    <div className="w-full bg-gray-50 rounded-2xl py-4 px-5 text-sm text-gray-700 min-h-[52px] flex items-center">
      {val(value)}
    </div>
  </div>
);

const ReadTextArea = ({ label, value }) => (
  <div className="space-y-1.5">
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
    <div className="w-full bg-gray-50 rounded-2xl py-4 px-5 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[80px]">
      {val(value)}
    </div>
  </div>
);

const ReadCheckbox = ({ label, options, value }) => {
  const isChecked = (opt) => {
    if (!value) return false;
    if (value === 'Both') return true;
    return value === opt;
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <div className="bg-gray-50 rounded-2xl py-3.5 px-5 flex flex-wrap gap-x-6 gap-y-2.5 min-h-[52px] items-center">
        {value
          ? options.map((opt) => {
              const checked = isChecked(opt);
              return (
                <span key={opt} className="flex items-center gap-2 select-none">
                  <span
                    className={cn(
                      'w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center',
                      checked ? 'bg-primary border-primary' : 'border-gray-300 bg-white',
                    )}
                  >
                    {checked && (
                      <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none">
                        <path
                          d="M1 4l3 3 5-6"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-sm',
                      checked ? 'text-gray-800 font-medium' : 'text-gray-400',
                    )}
                  >
                    {opt}
                  </span>
                </span>
              );
            })
          : NA}
      </div>
    </div>
  );
};

const FieldError = ({ error }) =>
  error ? (
    <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
      <Info className="w-3 h-3 flex-shrink-0" /> {error}
    </p>
  ) : null;

// ---------------------------------------------------------------------------
// Attachment display
// ---------------------------------------------------------------------------

const IMAGE_EXTS  = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']);
const DOC_META = {
  '.pdf':  { label: 'PDF',  cls: 'bg-red-100 text-red-700' },
  '.docx': { label: 'DOCX', cls: 'bg-blue-100 text-blue-700' },
  '.doc':  { label: 'DOC',  cls: 'bg-blue-100 text-blue-700' },
  '.xlsx': { label: 'XLSX', cls: 'bg-green-100 text-green-700' },
  '.xls':  { label: 'XLS',  cls: 'bg-green-100 text-green-700' },
  '.pptx': { label: 'PPTX', cls: 'bg-orange-100 text-orange-700' },
  '.ppt':  { label: 'PPT',  cls: 'bg-orange-100 text-orange-700' },
  '.mp4':  { label: 'MP4',  cls: 'bg-purple-100 text-purple-700' },
  '.mov':  { label: 'MOV',  cls: 'bg-purple-100 text-purple-700' },
  '.mp3':  { label: 'MP3',  cls: 'bg-indigo-100 text-indigo-700' },
  '.zip':  { label: 'ZIP',  cls: 'bg-yellow-100 text-yellow-700' },
};

const getExt    = (name) => { const i = name.lastIndexOf('.'); return i >= 0 ? name.slice(i).toLowerCase() : ''; };
const isImage   = (name) => IMAGE_EXTS.has(getExt(name));
const isWebLink = (name) => /^https?:\/\//i.test(name);

const AttachmentsView = ({ attachments }) => {
  const [lightbox, setLightbox] = useState(null);

  const images = (attachments || []).filter((a) => isImage(a.original_name));
  const links  = (attachments || []).filter((a) => isWebLink(a.original_name));
  const docs   = (attachments || []).filter((a) => !isImage(a.original_name) && !isWebLink(a.original_name));

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attachments</p>

      {!attachments?.length ? (
        <div className="bg-gray-50 rounded-2xl py-8 flex items-center justify-center">
          <p className="text-sm text-gray-300 italic">No attachments</p>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-4 space-y-4">

          {/* Image thumbnails */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setLightbox(`${API}${a.file}`)}
                  className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/30 flex-shrink-0"
                  title={a.original_name}
                >
                  <img
                    src={`${API}${a.file}`}
                    alt={a.original_name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Documents */}
          {docs.map((a) => {
            const ext  = getExt(a.original_name);
            const meta = DOC_META[ext] || {
              label: ext.replace('.', '').toUpperCase() || 'FILE',
              cls:   'bg-gray-100 text-gray-600',
            };
            return (
              <a
                key={a.id}
                href={`${API}${a.file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-all group"
              >
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 uppercase tracking-wide',
                    meta.cls,
                  )}
                >
                  {meta.label}
                </span>
                <span className="text-sm text-gray-700 truncate flex-1 group-hover:text-primary transition-colors">
                  {a.original_name}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary flex-shrink-0 transition-colors" />
              </a>
            );
          })}

          {/* Links */}
          {links.map((a) => (
            <a
              key={a.id}
              href={a.original_name}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-primary/20 text-primary hover:bg-primary/5 transition-colors group max-w-full"
            >
              <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-sm truncate">{a.original_name}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center p-6"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              src={lightbox}
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_STYLE = {
  Pending:   'bg-blue-50 text-blue-600',
  Approved:  'bg-green-50 text-green-600',
  Rejected:  'bg-red-50 text-red-600',
  Cancelled: 'bg-gray-100 text-gray-500',
  Archived:  'bg-gray-100 text-gray-400',
};
const STATUS_DOT = {
  Pending:   'bg-blue-500',
  Approved:  'bg-green-500',
  Rejected:  'bg-red-500',
  Cancelled: 'bg-gray-400',
  Archived:  'bg-gray-300',
};

const StatusBadge = ({ status }) => (
  <span
    className={cn(
      'px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5',
      STATUS_STYLE[status] || 'bg-gray-100 text-gray-500',
    )}
  >
    <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[status] || 'bg-gray-400')} />
    {status}
  </span>
);

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------

const PRODUCTION_MEDIA  = ['Social Card/Preview', 'Video', 'Photo', 'Layout/Design', 'Others'];
const DISSEM_PLATFORMS  = ['Social Media', 'Website'];
const MATERIALS_OPTIONS = ['Hardcopy', 'Softcopy'];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const RequestDetail = ({ requestId, onBack, canManage }) => {
  const [request, setRequest]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [actionMode, setActionMode] = useState(null); // null | 'approve' | 'disapprove'
  const [actionForm, setActionForm] = useState({
    accomplishmentDate: '',
    involvedMembers:    '',
    remarks:            '',
  });
  const [actionErrors, setActionErrors] = useState({});
  const [submitting, setSubmitting]     = useState(false);
  const [flashMsg, setFlashMsg]         = useState('');

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling]           = useState(false);

  // Read userRole from localStorage (same pattern as MarketingRequests)
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') || '' : '';

  const fetchRequest = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/marketing/${requestId}/`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRequest(await res.json());
    } catch (err) {
      setError(`Failed to load request: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequest(); }, [requestId]);

  const setField = (field) => (e) => {
    setActionForm((f) => ({ ...f, [field]: e.target.value }));
    if (actionErrors[field]) setActionErrors((fe) => ({ ...fe, [field]: '' }));
  };

  const cancelAction = () => { setActionMode(null); setActionErrors({}); };

  const validateApprove = () => {
    const errs = {};
    if (!actionForm.accomplishmentDate)     errs.accomplishmentDate = 'This field is required.';
    if (!actionForm.involvedMembers.trim()) errs.involvedMembers    = 'This field is required.';
    setActionErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateDisapprove = () => {
    const errs = {};
    if (!actionForm.remarks.trim()) errs.remarks = 'Remarks are required.';
    setActionErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitAction = async (body, successText) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/marketing/${requestId}/`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || `HTTP ${res.status}`);
      cancelAction();
      setActionForm({ accomplishmentDate: '', involvedMembers: '', remarks: '' });
      setFlashMsg(successText);
      setTimeout(() => setFlashMsg(''), 4000);
      await fetchRequest();
    } catch (err) {
      setActionErrors((fe) => ({ ...fe, submit: err.message || 'Failed to save. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = () => {
    if (!validateApprove()) return;
    submitAction(
      { status: 'Approved', accomplishment_date: actionForm.accomplishmentDate, involved_members: actionForm.involvedMembers },
      'Request approved successfully.',
    );
  };

  const handleDisapprove = () => {
    if (!validateDisapprove()) return;
    submitAction({ status: 'Rejected', notes: actionForm.remarks }, 'Request disapproved.');
  };

  // ---------------------------------------------------------------------------
  // Cancel handlers
  // ---------------------------------------------------------------------------

  const handleCancelClick = () => setShowCancelModal(true);

  const confirmCancel = async () => {
    setCancelling(true);
    setShowCancelModal(false);
    try {
      const res = await fetch(`${API}/api/marketing/${requestId}/`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || `HTTP ${res.status}`);
      setFlashMsg('Request cancelled successfully.');
      setTimeout(() => setFlashMsg(''), 4000);
      await fetchRequest();
    } catch (err) {
      setFlashMsg(`Failed to cancel: ${err.message}`);
      setTimeout(() => setFlashMsg(''), 4000);
    } finally {
      setCancelling(false);
    }
  };

  const inputCls = (field) =>
    `w-full bg-gray-50 border rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
      actionErrors[field] ? 'border-red-300 bg-red-50' : 'border-transparent'
    }`;

  // ---------------------------------------------------------------------------
  // Loading / error
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading request details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-300" />
        <p className="text-sm font-medium text-red-600">{error}</p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to List
        </button>
      </div>
    );
  }

  if (!request) return null;

  const isProduction = request.request_type === 'Production';
  const isPending    = request.status === 'Pending';
  const isApproved   = request.status === 'Approved';
  const isRejected   = request.status === 'Rejected';

  // Show cancel button only for Approved requests and Admin/Staff roles
  const canCancel = isApproved && ['Admin', 'Staff'].includes(userRole);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wider bg-primary/5 px-2.5 py-1 rounded-full">
            CIMO
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mt-2">
            {isProduction ? 'Request for Production' : 'Request for Information Dissemination'}
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            #{request.id}&nbsp;·&nbsp;Submitted {fmtDateTime(request.created_at)}
            {request.requester_name && <>&nbsp;·&nbsp;by {request.requester_name}</>}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* ── Flash ── */}
      <AnimatePresence>
        {flashMsg && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm font-medium text-green-700">{flashMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fields Card ── */}
      <div className="bg-white rounded shadow-sm border border-gray-100 p-8 space-y-6">

        {isProduction ? (
          <>
            {/* Row 1 — 3 columns: Medium, Requesting Unit, Date Needed */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ReadCheckbox
                label="Expected Medium / Media"
                options={PRODUCTION_MEDIA}
                value={request.expected_medium}
              />
              <ReadField label="Requesting Unit"  value={request.requesting_unit} />
              <ReadField label="Date Needed"      value={fmtDate(request.preferred_date)} />
            </div>

            {/* Row 2 */}
            <ReadTextArea
              label="Expected Content/s of the Material"
              value={request.description}
            />

            {/* Row 3 */}
            <ReadTextArea
              label="Event / Activity Description"
              value={request.event_description}
            />

            {/* Row 4 */}
            <ReadTextArea
              label="Objectives of the Event / Activity"
              value={request.event_objectives}
            />

            {/* Row 5 */}
            <ReadField label="Audience / Participants" value={request.audience} />

            {/* Row 6 — 2 columns: Venue, Date of Event */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadField
                label="Venue"
                hint="It will be held at"
                value={request.event_venue}
              />
              <ReadField
                label="Date of Event"
                hint="It will be held on"
                value={fmtDate(request.event_date)}
              />
            </div>

            {/* Row 7 — Materials */}
            <div className="space-y-1">
              <ReadCheckbox
                label="Materials / References Endorsed"
                options={MATERIALS_OPTIONS}
                value={request.materials_endorsed}
              />
              {(request.materials_endorsed === 'Softcopy' || request.materials_endorsed === 'Both') && (
                <p className="text-xs text-gray-400 ml-1 pt-0.5">
                  Softcopy materials sent to:{' '}
                  <span className="font-medium text-gray-500">cimc@slc-sflu.edu.ph</span>
                </p>
              )}
            </div>

            {/* Row 8 — Attachments */}
            <AttachmentsView attachments={request.attachments} />
          </>
        ) : (
          <>
            {/* Row 1 — 2 columns: Platform, Date Needed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadCheckbox
                label="Platform"
                options={DISSEM_PLATFORMS}
                value={request.platform}
              />
              <ReadField label="Date Needed" value={fmtDate(request.preferred_date)} />
            </div>

            <ReadField label="Title / Headline" value={request.title} />

            <ReadField
              label="Writer/s with Unit / Organizational Affiliation"
              value={request.writers}
            />

            <ReadTextArea label="Content" value={request.description} />

            <ReadField label="Keywords" value={request.keywords} />

            {/* Last Row — Attachments */}
            <AttachmentsView attachments={request.attachments} />
          </>
        )}
      </div>

      {/* ── CIMO Response ── */}
      <div className="bg-white rounded shadow-sm border border-gray-100 p-8 space-y-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">CIMO Response</h3>

        {isApproved && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-800">Request Approved</p>
                <p className="text-xs text-green-600 mt-0.5">This request has been approved by CIMO.</p>
              </div>
            </div>
            <ReadField
              label="Date of Project Accomplishment"
              value={fmtDate(request.accomplishment_date)}
            />
            <ReadTextArea label="Involved Members" value={request.involved_members} />
          </div>
        )}

        {isRejected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800">Request Disapproved</p>
                <p className="text-xs text-red-600 mt-0.5">This request has been disapproved by CIMO.</p>
              </div>
            </div>
            <ReadTextArea label="Remarks" value={request.notes} />
          </div>
        )}

        {isPending && (
          <>
            {actionMode === null && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-800">Awaiting CIMO Response</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    CIMO will reply within 2 working days. Approval depends on staff availability.
                  </p>
                </div>
              </div>
            )}

            <AnimatePresence>
              {actionMode === 'approve' && (
                <motion.div
                  key="approve-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4 bg-green-50 border border-green-100 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="text-sm font-bold text-green-800">Approve This Request</h4>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Date of Project Accomplishment <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={actionForm.accomplishmentDate}
                      onChange={setField('accomplishmentDate')}
                      className={inputCls('accomplishmentDate')}
                    />
                    <FieldError error={actionErrors.accomplishmentDate} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Involved Members <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={actionForm.involvedMembers}
                      onChange={setField('involvedMembers')}
                      rows={3}
                      placeholder="List involved CIMO members, comma-separated or one per line"
                      className={`${inputCls('involvedMembers')} resize-y min-h-[80px]`}
                    />
                    <FieldError error={actionErrors.involvedMembers} />
                  </div>
                  {actionErrors.submit && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {actionErrors.submit}
                    </p>
                  )}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={cancelAction}
                      className="flex-1 py-3 border-2 border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-[0.99] outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={submitting}
                      className="flex-1 py-3 bg-[#1072b3] border-2 border-[#1072b3] text-white hover:bg-[#f6ce11] hover:border-[#f6ce11] hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-[0.99] flex items-center justify-center gap-2 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save as Approved'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {actionMode === 'disapprove' && (
                <motion.div
                  key="disapprove-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4 bg-red-50 border border-red-100 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <h4 className="text-sm font-bold text-red-800">Disapprove This Request</h4>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Remarks <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={actionForm.remarks}
                      onChange={setField('remarks')}
                      rows={4}
                      placeholder="Explain why this request is being disapproved..."
                      className={`${inputCls('remarks')} resize-y min-h-[100px]`}
                    />
                    <FieldError error={actionErrors.remarks} />
                  </div>
                  {actionErrors.submit && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {actionErrors.submit}
                    </p>
                  )}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={cancelAction}
                      className="flex-1 py-3 border-2 border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-[0.99] outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDisapprove}
                      disabled={submitting}
                      className="flex-1 py-3 bg-[#1072b3] border-2 border-[#1072b3] text-white hover:bg-[#f6ce11] hover:border-[#f6ce11] hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-[0.99] flex items-center justify-center gap-2 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save as Disapproved'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {!isPending && !isApproved && !isRejected && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-500 font-medium">Status: {request.status}</p>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between gap-4 pb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 border-2 border-[#1072b3] text-[#1072b3] hover:bg-[#f6ce11] hover:border-[#f6ce11] hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-[0.99] outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </button>

        <div className="flex gap-3">
          {/* Cancel button — visible for Approved requests to Admin/Staff */}
          {canCancel && (
            <button
              onClick={handleCancelClick}
              disabled={cancelling}
              className="flex items-center gap-2 px-5 py-3 bg-[#1072b3] border-2 border-[#1072b3] text-white hover:bg-[#f6ce11] hover:border-[#f6ce11] hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-[0.99] outline-none disabled:opacity-50"
            >
              {cancelling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              Cancel Request
            </button>
          )}

          {/* Approve / Disapprove buttons */}
          {canManage && isPending && actionMode === null && (
            <>
              <button
                onClick={() => setActionMode('disapprove')}
                className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-[0.99] outline-none"
              >
                <XCircle className="w-4 h-4" />
                Disapprove
              </button>
              <button
                onClick={() => setActionMode('approve')}
                className="flex items-center gap-2 px-5 py-3 bg-[#1072b3] border-2 border-[#1072b3] text-white hover:bg-[#f6ce11] hover:border-[#f6ce11] hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-[0.99] outline-none"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Cancel Confirmation Modal ── */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full text-center border border-slate-100"
            >
              <div className="w-16 h-16 bg-[#1072b3]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-[#1072b3]" />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Cancel Request</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Are you sure you want to cancel this approved request? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 hover:bg-slate-200 active:scale-[0.99] outline-none"
                >
                  Go Back
                </button>
                <button
                  onClick={confirmCancel}
                  className="flex-1 px-6 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 bg-[#1072b3] border-2 border-[#1072b3] text-white hover:bg-[#f6ce11] hover:border-[#f6ce11] hover:text-black rounded-lg active:scale-[0.99] outline-none"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default RequestDetail;