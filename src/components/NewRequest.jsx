import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, X, CheckCircle, AlertCircle, Loader2, Info,
  ChevronDown, Paperclip, UploadCloud, FileText, Image, Film, File,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API } from '../config/api';

const DRAFT_KEY = 'cimore_new_request_draft';

const PRODUCTION_MEDIA  = ['Social Card/Preview', 'Video', 'Photo', 'Layout/Design', 'Others'];
const DISSEM_PLATFORMS  = ['Social Media', 'Website', 'Both'];
const MATERIALS_OPTIONS = ['Hardcopy', 'Softcopy', 'Both'];

const MAX_FILE_SIZE_MB  = 10;
const MAX_FILE_SIZE     = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES    = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4', 'video/quicktime',
];

const EMPTY_PRODUCTION = {
  requestType:       'Production',
  expectedMedium:    PRODUCTION_MEDIA[0],
  requestingUnit:    '',
  dateNeeded:        '',
  expectedContents:  '',
  eventDescription:  '',
  eventObjectives:   '',
  audience:          '',
  eventVenue:        '',
  eventDate:         '',
  materialsEndorsed: MATERIALS_OPTIONS[0],
  attachments:       [],
};

const EMPTY_DISSEMINATION = {
  requestType: 'Information Dissemination',
  platform:    DISSEM_PLATFORMS[0],
  dateNeeded:  '',
  headline:    '',
  writers:     '',
  content:     '',
  keywords:    '',
  attachments: [],
};

function getFileIcon(file) {
  if (file.type.startsWith('image/')) return Image;
  if (file.type.startsWith('video/')) return Film;
  if (file.type === 'application/pdf')  return FileText;
  return File;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FieldError = ({ error }) =>
  error ? (
    <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
      <Info className="w-3 h-3 flex-shrink-0" /> {error}
    </p>
  ) : null;

// ---------------------------------------------------------------------------
// Drag-and-Drop Upload Zone
// ---------------------------------------------------------------------------
const DropZone = ({ files, onAdd, onRemove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dropError, setDropError]   = useState('');
  const inputRef = useRef(null);

  const processFiles = useCallback((incoming) => {
    setDropError('');
    const errs = [];
    const valid = [];

    Array.from(incoming).forEach((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        errs.push(`"${f.name}" — unsupported type.`);
      } else if (f.size > MAX_FILE_SIZE) {
        errs.push(`"${f.name}" — exceeds ${MAX_FILE_SIZE_MB} MB.`);
      } else {
        valid.push(f);
      }
    });

    if (errs.length) setDropError(errs.join(' '));
    if (valid.length) onAdd(valid);
  }, [onAdd]);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  return (
    <div className="space-y-2">
      {/* Drop target */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 select-none
          ${isDragging
            ? 'border-[#1072b3] bg-[#1072b3]/5 scale-[1.01]'
            : 'border-slate-300 bg-slate-50 hover:border-[#1072b3]/60 hover:bg-slate-100'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
          onClick={(e) => { e.target.value = ''; }}
        />
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isDragging ? 'bg-[#1072b3]/10 text-[#1072b3]' : 'bg-slate-200 text-slate-400'}`}>
          <UploadCloud className="w-6 h-6" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-600">
            {isDragging ? 'Drop files here' : 'Drag & drop files, or click to browse'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Images, PDFs, Word docs, Videos · Max {MAX_FILE_SIZE_MB} MB each
          </p>
        </div>
      </div>

      {/* Error */}
      {dropError && (
        <p className="text-xs text-red-500 flex items-start gap-1">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {dropError}
        </p>
      )}

      {/* File list */}
      {(files ?? []).length > 0 && (
        <ul className="space-y-1.5">
          {(files ?? []).map((file, idx) => {
            const Icon = getFileIcon(file);
            const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
            return (
              <li
                key={idx}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 group"
              >
                {preview ? (
                  <img src={preview} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                    <Icon className="w-4 h-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                  className="cursor-pointer p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const NewRequest = ({ initialRequestType }) => {
  const [form, setForm]               = useState({ requestType: initialRequestType || '', attachments: [] });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState('');
  const [success, setSuccess]         = useState(false);
  const [apiError, setApiError]       = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (initialRequestType) {
      if (initialRequestType === 'Information Dissemination') {
        setForm({ ...EMPTY_DISSEMINATION });
      } else if (initialRequestType === 'Production Request') {
        setForm({ ...EMPTY_PRODUCTION });
      }
    } else {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const draft = JSON.parse(saved);
          if (draft?.requestType) setForm({ ...draft, attachments: [] });
        }
      } catch { /* ignore */ }
    }
  }, [initialRequestType]);

  // Auto-save draft (skip attachments — File objects can't be serialised)
  useEffect(() => {
    const { attachments: _, ...saveable } = form;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(saveable));
  }, [form]);

  useEffect(() => {
    if (success || apiError) {
      const t = setTimeout(() => { setSuccess(false); setApiError(''); }, 6000);
      return () => clearTimeout(t);
    }
  }, [success, apiError]);

  const switchType = (type) => {
    if (!type) setForm({ requestType: '' });
    else setForm(type === 'Production' ? { ...EMPTY_PRODUCTION } : { ...EMPTY_DISSEMINATION });
    setFieldErrors({});
  };

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors((fe) => ({ ...fe, [field]: '' }));
  };

  const addFiles = useCallback((incoming) => {
    setForm((f) => ({ ...f, attachments: [...(f.attachments ?? []), ...incoming] }));
  }, []);

  const removeFile = useCallback((idx) => {
    setForm((f) => ({ ...f, attachments: (f.attachments ?? []).filter((_, i) => i !== idx) }));
  }, []);

  const wordCount     = form.requestType === 'Information Dissemination'
    ? (form.content  || '').trim().split(/\s+/).filter(Boolean).length : 0;
  const headlineWords = form.requestType === 'Information Dissemination'
    ? (form.headline || '').trim().split(/\s+/).filter(Boolean).length : 0;

  const validate = () => {
    const errs = {};
    if (!form.requestType) { errs.requestType = 'Please select a request type.'; setFieldErrors(errs); return false; }
    if (!form.dateNeeded)  errs.dateNeeded = 'This field is required.';
    if (form.requestType === 'Production') {
      if (!form.requestingUnit?.trim())   errs.requestingUnit   = 'This field is required.';
      if (!form.expectedContents?.trim()) errs.expectedContents = 'This field is required.';
      if (!form.eventDescription?.trim()) errs.eventDescription = 'This field is required.';
      if (!form.eventObjectives?.trim())  errs.eventObjectives  = 'This field is required.';
      if (!form.audience?.trim())         errs.audience         = 'This field is required.';
      if (!form.eventVenue?.trim())       errs.eventVenue       = 'This field is required.';
      if (!form.eventDate)                errs.eventDate        = 'This field is required.';
    } else {
      if (!form.headline?.trim())        errs.headline = 'This field is required.';
      else if (headlineWords > 10)       errs.headline = `Max 10 words. Current: ${headlineWords}.`;
      if (!form.writers?.trim())         errs.writers  = 'This field is required.';
      if (!form.content?.trim())         errs.content  = 'This field is required.';
      else if (wordCount < 250)          errs.content  = `Min 250 words. Current: ${wordCount}.`;
      else if (wordCount > 500)          errs.content  = `Max 500 words. Current: ${wordCount}.`;
      if (!form.keywords?.trim())        errs.keywords = 'This field is required.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isFormValid = () => {
    if (!form.requestType || !form.dateNeeded) return false;
    if (form.requestType === 'Production') {
      return !!(form.requestingUnit?.trim() && form.expectedContents?.trim() &&
                form.eventDescription?.trim() && form.eventObjectives?.trim() &&
                form.audience?.trim() && form.eventVenue?.trim() && form.eventDate);
    }
    return !!(form.headline?.trim() && headlineWords <= 10 &&
              form.writers?.trim() && form.content?.trim() &&
              wordCount >= 250 && wordCount <= 500 && form.keywords?.trim());
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    setSubmitProgress('Creating request…');
    const token = localStorage.getItem('authToken');

    try {
      // ── Step 1: create the marketing request (text fields only) ──
      const formData = new FormData();

      if (form.requestType === 'Production') {
        formData.append('request_type',       'Production');
        formData.append('title',              `${form.requestingUnit} – ${form.expectedMedium}`);
        formData.append('type',               form.expectedMedium);
        formData.append('preferred_date',     form.dateNeeded);
        formData.append('requesting_unit',    form.requestingUnit);
        formData.append('expected_medium',    form.expectedMedium);
        formData.append('description',        form.expectedContents);
        formData.append('event_description',  form.eventDescription);
        formData.append('event_objectives',   form.eventObjectives);
        formData.append('audience',           form.audience);
        formData.append('event_venue',        form.eventVenue);
        formData.append('event_date',         form.eventDate);
        formData.append('materials_endorsed', form.materialsEndorsed);
      } else {
        formData.append('request_type',   'Information Dissemination');
        formData.append('title',          form.headline);
        formData.append('type',           form.platform);
        formData.append('preferred_date', form.dateNeeded);
        formData.append('platform',       form.platform);
        formData.append('writers',        form.writers);
        formData.append('description',    form.content);
        formData.append('keywords',       form.keywords);
      }

      const res = await fetch(`${API}/api/marketing/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || JSON.stringify(data));

      // ── Step 2: upload each attachment to the dedicated endpoint ──
      const requestId = data.id;
      const attachments = form.attachments ?? [];

      if (attachments.length > 0) {
        for (let i = 0; i < attachments.length; i++) {
          setSubmitProgress(`Uploading file ${i + 1} of ${attachments.length}…`);
          const fd = new FormData();
          fd.append('file', attachments[i]);
          const aRes = await fetch(`${API}/api/marketing/${requestId}/attachments/`, {
            method: 'POST',
            headers: { Authorization: `Token ${token}` },
            body: fd,
          });
          if (!aRes.ok) {
            const aData = await aRes.json().catch(() => ({}));
            throw new Error(aData.error || `File upload failed (${attachments[i].name})`);
          }
        }
      }

      setSuccess(true);
      setForm({ requestType: '' });
      setFieldErrors({});
      localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      setApiError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSubmitProgress('');
    }
  };

  const inputClass = (field) =>
    `w-full bg-gray-50 border rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#1072b3]/20 outline-none transition-all ${
      fieldErrors[field] ? 'border-red-300 bg-red-50' : 'border-transparent'
    }`;

  const selectClass = (field) =>
    `w-full bg-gray-50 border rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#1072b3]/20 outline-none transition-all appearance-none cursor-pointer ${
      field && fieldErrors[field] ? 'border-red-300 bg-red-50' : 'border-transparent'
    }`;

  const today         = new Date().toISOString().split('T')[0];
  const isProduction  = form.requestType === 'Production';
  const isDissem      = form.requestType === 'Information Dissemination';
  const hasType       = isProduction || isDissem;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32 md:pb-0">

      {/* ── Toasts ── */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none max-w-md w-[calc(100%-2rem)]">
        <AnimatePresence>
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="pointer-events-auto p-5 bg-white shadow-2xl border border-green-200 rounded-2xl flex items-start gap-4"
            >
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-800">Request submitted successfully!</p>
                <p className="text-xs text-green-700 mt-1">
                  A confirmation has been sent to your school email. Await CIMO confirmation within
                  2 working days. Track it under My Requests.
                </p>
              </div>
              <button onClick={() => setSuccess(false)} className="cursor-pointer ml-auto text-green-600 hover:text-green-700">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          {apiError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="pointer-events-auto p-5 bg-white shadow-2xl border border-red-200 rounded-2xl flex items-start gap-4"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-700">{apiError}</p>
              <button onClick={() => setApiError('')} className="cursor-pointer ml-auto text-red-600 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Page Header ── */}
      <div>
        <h2 className="text-2xl font-bold text-[#03396c] uppercase">New Request</h2>
        <p className="text-gray-500 text-sm mt-1">
          Submit a request to the College Information and Marketing Office.
        </p>
      </div>

      {/* ── Form ── */}
      <form id="cimoRequestForm" onSubmit={handleSubmitClick} noValidate className="space-y-4">

        {/* Request Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Request Type <span className="text-red-500">*</span>
          </label>
          <div className="relative w-full md:max-w-xs bg-gray-50 border border-gray-300 rounded-2xl">
            <select
              value={form.requestType}
              onChange={(e) => switchType(e.target.value)}
              className={`${selectClass('requestType')} ${form.requestType ? 'text-[#1072b3] font-semibold' : 'text-gray-400'}`}
            >
              <option value="" disabled>Select request type</option>
              <option value="Production">Request for Production</option>
              <option value="Information Dissemination">Request for Information Dissemination</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <FieldError error={fieldErrors.requestType} />
        </div>

        {/* Fields card */}
        <AnimatePresence mode="wait">
          {hasType ? (
            <motion.div
              key={form.requestType}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded shadow-sm border border-gray-100 p-4 md:p-8 space-y-6"
            >
              {isProduction ? (
                <>
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Expected Medium / Media <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select value={form.expectedMedium} onChange={set('expectedMedium')} className={selectClass('expectedMedium')}>
                          {PRODUCTION_MEDIA.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Requesting Unit <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={form.requestingUnit} onChange={set('requestingUnit')} placeholder="e.g. Student Affairs Office" className={inputClass('requestingUnit')} />
                      <FieldError error={fieldErrors.requestingUnit} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Date Needed <span className="text-red-500">*</span>
                      </label>
                      <input type="date" value={form.dateNeeded} onChange={set('dateNeeded')} min={today} className={inputClass('dateNeeded')} />
                      <FieldError error={fieldErrors.dateNeeded} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Expected Content/s of the Material <span className="text-red-500">*</span>
                    </label>
                    <textarea value={form.expectedContents} onChange={set('expectedContents')} rows={4} placeholder="Describe the specific content you expect the material to contain." className={`${inputClass('expectedContents')} resize-y min-h-[80px]`} />
                    <FieldError error={fieldErrors.expectedContents} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Event / Activity Description <span className="text-red-500">*</span>
                    </label>
                    <textarea value={form.eventDescription} onChange={set('eventDescription')} rows={4} placeholder="What is the event or activity about?" className={`${inputClass('eventDescription')} resize-y min-h-[80px]`} />
                    <FieldError error={fieldErrors.eventDescription} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Objectives of the Event / Activity <span className="text-red-500">*</span>
                    </label>
                    <textarea value={form.eventObjectives} onChange={set('eventObjectives')} rows={3} placeholder="What are the goals or objectives?" className={`${inputClass('eventObjectives')} resize-y min-h-[80px]`} />
                    <FieldError error={fieldErrors.eventObjectives} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Audience / Participants <span className="text-red-500">*</span>
                    </label>
                    <input type="text" value={form.audience} onChange={set('audience')} placeholder="e.g. All SLC students, Grade 12 students, Faculty" className={inputClass('audience')} />
                    <FieldError error={fieldErrors.audience} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Venue <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={form.eventVenue} onChange={set('eventVenue')} placeholder="e.g. SLC Gymnasium" className={inputClass('eventVenue')} />
                      <FieldError error={fieldErrors.eventVenue} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Date of Event <span className="text-red-500">*</span>
                      </label>
                      <input type="date" value={form.eventDate} onChange={set('eventDate')} className={inputClass('eventDate')} />
                      <FieldError error={fieldErrors.eventDate} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Materials / References Endorsed
                    </label>
                    <div className="relative">
                      <select value={form.materialsEndorsed} onChange={set('materialsEndorsed')} className={selectClass('materialsEndorsed')}>
                        {MATERIALS_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-400 ml-1">
                      Softcopy materials must be sent to: <span className="font-medium text-gray-500">cimc@slc-sflu.edu.ph</span>
                    </p>
                  </div>

                  {/* Attachments */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5" /> Attachments <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span>
                    </label>
                    <DropZone files={form.attachments} onAdd={addFiles} onRemove={removeFile} />
                  </div>
                </>
              ) : (
                <>
                  {/* Dissemination fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Platform <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select value={form.platform} onChange={set('platform')} className={selectClass('platform')}>
                          {DISSEM_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Date Needed <span className="text-red-500">*</span>
                      </label>
                      <input type="date" value={form.dateNeeded} onChange={set('dateNeeded')} min={today} className={inputClass('dateNeeded')} />
                      <FieldError error={fieldErrors.dateNeeded} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Title / Headline <span className="text-red-500">*</span>
                    </label>
                    <input type="text" value={form.headline} onChange={set('headline')} placeholder="Write in present tense, maximum 10 words" className={inputClass('headline')} />
                    <p className={`text-xs ml-1 ${headlineWords > 10 ? 'text-amber-500' : 'text-gray-400'}`}>
                      Present tense · {headlineWords}/10 words
                    </p>
                    <FieldError error={fieldErrors.headline} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Writer/s with Unit / Organizational Affiliation <span className="text-red-500">*</span>
                    </label>
                    <input type="text" value={form.writers} onChange={set('writers')} placeholder="e.g. Juan Dela Cruz, Student Affairs Office" className={inputClass('writers')} />
                    <FieldError error={fieldErrors.writers} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea value={form.content} onChange={set('content')} rows={12} placeholder="Write 250–500 words. Must include the 5 W's: What, When, Where, Why, Who." className={`${inputClass('content')} resize-y min-h-[200px]`} />
                    <p className={`text-xs ml-1 ${wordCount === 0 ? 'text-gray-400' : wordCount >= 250 && wordCount <= 500 ? 'text-green-600' : 'text-amber-500'}`}>
                      {wordCount} / 500 words{wordCount >= 250 && wordCount <= 500 ? ' ✓' : wordCount > 0 ? ' (250–500 required)' : ''}
                    </p>
                    <FieldError error={fieldErrors.content} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Keywords <span className="text-red-500">*</span>
                    </label>
                    <input type="text" value={form.keywords} onChange={set('keywords')} placeholder="Include aligned UN SDG, e.g. SDG 4: Quality Education, scholarship, enrollment" className={inputClass('keywords')} />
                    <FieldError error={fieldErrors.keywords} />
                  </div>

                  {/* Attachments */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5" /> Attachments <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span>
                    </label>
                    <DropZone files={form.attachments} onAdd={addFiles} onRemove={removeFile} />
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center gap-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Send className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-400">Select a request type above to begin</p>
              <p className="text-xs text-gray-300">Form fields will appear here after you make a selection.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* ── Submit Footer ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md z-10 border-t border-slate-100 md:static md:p-0 md:bg-transparent md:backdrop-blur-none md:border-none md:flex md:items-start md:justify-between">
        <div />
        <button
          type="submit"
          form="cimoRequestForm"
          disabled={isSubmitting || !isFormValid()}
          className="cursor-pointer w-full flex items-center justify-center gap-2 px-6 py-4 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border-2 border-transparent rounded-lg bg-[#1072b3] text-white hover:bg-[#f6ce11] hover:text-black hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed md:w-auto md:py-3.5"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{submitProgress || 'Processing…'}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Request</span>
            </>
          )}
        </button>
      </div>

      {/* ── Confirmation Modal ── */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[32px] w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl"
              style={{ maxHeight: '90vh' }}
            >
              <div className="p-6 border-b border-gray-100 bg-[#1072b3] text-white shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold">Confirm Submission</h3>
                  <button onClick={() => setShowConfirm(false)} className="cursor-pointer p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div className="bg-gray-50 rounded-3xl p-4 space-y-3 text-sm">
                  <ConfirmRow label="Request Type">
                    {form.requestType === 'Production' ? 'Request for Production' : 'Request for Information Dissemination'}
                  </ConfirmRow>
                  <ConfirmRow label="Date Needed">{form.dateNeeded}</ConfirmRow>
                  {form.requestType === 'Production' ? (
                    <>
                      <ConfirmRow label="Requesting Unit">{form.requestingUnit}</ConfirmRow>
                      <ConfirmRow label="Medium">{form.expectedMedium}</ConfirmRow>
                      <ConfirmRow label="Audience">{form.audience}</ConfirmRow>
                      <ConfirmRow label="Venue">{form.eventVenue}</ConfirmRow>
                      <ConfirmRow label="Event Date">{form.eventDate}</ConfirmRow>
                      <ConfirmRow label="Materials Endorsed">{form.materialsEndorsed}</ConfirmRow>
                    </>
                  ) : (
                    <>
                      <ConfirmRow label="Platform">{form.platform}</ConfirmRow>
                      <ConfirmRow label="Headline">{form.headline}</ConfirmRow>
                      <ConfirmRow label="Writer/s">{form.writers}</ConfirmRow>
                      <ConfirmRow label="Word Count">{wordCount} words</ConfirmRow>
                    </>
                  )}
                  {(form.attachments ?? []).length > 0 && (
                    <ConfirmRow label="Attachments">{form.attachments.length} file{form.attachments.length > 1 ? 's' : ''}</ConfirmRow>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Await confirmation from CIMO within 2 working days. Approval depends on availability of CIMO staff.
                </p>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-3 shrink-0 md:flex-row">
                <button onClick={() => setShowConfirm(false)} className="cursor-pointer flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                  Go Back
                </button>
                <button onClick={handleConfirm} className="cursor-pointer flex-1 py-3 rounded-2xl bg-[#1072b3] text-white text-sm font-bold hover:bg-[#1072b3]/90 transition-colors shadow-md">
                  Confirm &amp; Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ConfirmRow = ({ label, children }) => (
  <div className="flex justify-between gap-4">
    <span className="text-gray-500 flex-shrink-0">{label}</span>
    <span className="font-semibold text-gray-800 text-right">{children}</span>
  </div>
);

export default NewRequest;
