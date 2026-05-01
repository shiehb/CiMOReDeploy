import React, { useState, useEffect } from 'react';
import { Send, X, CheckCircle, AlertCircle, Loader2, Info, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API, authHeaders } from '../config/api';

const DRAFT_KEY = 'cimore_new_request_draft';

const PRODUCTION_MEDIA    = ['Social Card/Preview', 'Video', 'Photo', 'Layout/Design', 'Others'];
const DISSEM_PLATFORMS    = ['Social Media', 'Website', 'Both'];
const MATERIALS_OPTIONS   = ['Hardcopy', 'Softcopy', 'Both'];

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
};

const EMPTY_DISSEMINATION = {
  requestType: 'Information Dissemination',
  platform:    DISSEM_PLATFORMS[0],
  dateNeeded:  '',
  headline:    '',
  writers:     '',
  content:     '',
  keywords:    '',
};

const FieldError = ({ error }) =>
  error ? (
    <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
      <Info className="w-3 h-3 flex-shrink-0" /> {error}
    </p>
  ) : null;

// ---------------------------------------------------------------------------

const NewRequest = () => {
  const [form, setForm]               = useState({ requestType: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess]         = useState(false);
  const [apiError, setApiError]       = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft?.requestType) setForm(draft);
      }
    } catch {}
  }, []);

  // Auto-save draft on every change
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  const switchType = (type) => {
    if (!type) {
      setForm({ requestType: '' });
    } else {
      setForm(type === 'Production' ? { ...EMPTY_PRODUCTION } : { ...EMPTY_DISSEMINATION });
    }
    setFieldErrors({});
  };

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors((fe) => ({ ...fe, [field]: '' }));
  };

  const wordCount =
    form.requestType === 'Information Dissemination'
      ? (form.content || '').trim().split(/\s+/).filter(Boolean).length
      : 0;

  const headlineWords =
    form.requestType === 'Information Dissemination'
      ? (form.headline || '').trim().split(/\s+/).filter(Boolean).length
      : 0;

  const validate = () => {
    const errs = {};
    if (!form.requestType) {
      errs.requestType = 'Please select a request type.';
      setFieldErrors(errs);
      return false;
    }
    if (!form.dateNeeded) errs.dateNeeded = 'This field is required.';

    if (form.requestType === 'Production') {
      if (!form.requestingUnit.trim())   errs.requestingUnit   = 'This field is required.';
      if (!form.expectedContents.trim()) errs.expectedContents = 'This field is required.';
      if (!form.eventDescription.trim()) errs.eventDescription = 'This field is required.';
      if (!form.eventObjectives.trim())  errs.eventObjectives  = 'This field is required.';
      if (!form.audience.trim())         errs.audience         = 'This field is required.';
      if (!form.eventVenue.trim())       errs.eventVenue       = 'This field is required.';
      if (!form.eventDate)               errs.eventDate        = 'This field is required.';
    } else {
      if (!form.headline.trim()) {
        errs.headline = 'This field is required.';
      } else if (headlineWords > 10) {
        errs.headline = `Headline must be 10 words or fewer. Current: ${headlineWords} words.`;
      }
      if (!form.writers.trim()) errs.writers = 'This field is required.';
      if (!form.content.trim()) {
        errs.content = 'This field is required.';
      } else if (wordCount < 250) {
        errs.content = `Content must be at least 250 words. Current: ${wordCount} words.`;
      } else if (wordCount > 500) {
        errs.content = `Content must not exceed 500 words. Current: ${wordCount} words.`;
      }
      if (!form.keywords.trim()) errs.keywords = 'This field is required.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
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
    try {
      const body =
        form.requestType === 'Production'
          ? {
              request_type:      'Production',
              title:             `${form.requestingUnit} – ${form.expectedMedium}`,
              type:              form.expectedMedium,
              preferred_date:    form.dateNeeded,
              requesting_unit:   form.requestingUnit,
              expected_medium:   form.expectedMedium,
              description:       form.expectedContents,
              event_description: form.eventDescription,
              event_objectives:  form.eventObjectives,
              audience:          form.audience,
              event_venue:       form.eventVenue,
              event_date:        form.eventDate,
              materials_endorsed: form.materialsEndorsed,
            }
          : {
              request_type:   'Information Dissemination',
              title:          form.headline,
              type:           form.platform,
              preferred_date: form.dateNeeded,
              platform:       form.platform,
              writers:        form.writers,
              description:    form.content,
              keywords:       form.keywords,
            };

      const res = await fetch(`${API}/api/marketing/`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || `HTTP ${res.status}`);

      setSuccess(true);
      setForm({ requestType: '' });
      setFieldErrors({});
      localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      setApiError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full bg-gray-50 border rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
      fieldErrors[field] ? 'border-red-300 bg-red-50' : 'border-transparent'
    }`;

  const selectClass = (field) =>
    `w-full bg-gray-50 border rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer ${
      field && fieldErrors[field] ? 'border-red-300 bg-red-50' : 'border-transparent'
    }`;

  const today = new Date().toISOString().split('T')[0];
  const isProduction    = form.requestType === 'Production';
  const isDissemination = form.requestType === 'Information Dissemination';
  const hasType         = isProduction || isDissemination;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 md:pb-0">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">New Request</h2>
          <p className="text-gray-500 text-sm mt-1">
            Submit a request to the College Information and Marketing Office.
          </p>
        </div>
      </div>

      {/* ── Alerts ── */}
      <AnimatePresence>
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-5 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-4"
          >
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-800">Request submitted successfully!</p>
              <p className="text-xs text-green-700 mt-1">
                A confirmation has been sent to your school email. Await confirmation from CIMO
                within 2 working days. Track it under My Requests.
              </p>
            </div>
            <button onClick={() => setSuccess(false)} className="ml-auto text-green-600 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {apiError && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-700">{apiError}</p>
            <button onClick={() => setApiError('')} className="ml-auto text-red-600 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── The actual form (always mounted so the header Submit button always works) ── */}
      <form id="cimoRequestForm" onSubmit={handleSubmitClick} noValidate className="space-y-4">

        {/* Request Type Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Request Type <span className="text-red-500">*</span>
          </label>
          <div className="relative w-full md:max-w-xs bg-gray-50 border border-gray-300 rounded-2xl">
            <select
              value={form.requestType}
              onChange={(e) => switchType(e.target.value)}
              className={`${selectClass('requestType')} ${
                form.requestType ? 'text-primary font-semibold' : 'text-gray-400'
              }`}
            >
              <option value="" disabled>Select request type</option>
              <option value="Production">Request for Production</option>
              <option value="Information Dissemination">Request for Information Dissemination</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <FieldError error={fieldErrors.requestType} />
        </div>

        {/* Fields card — animated per type */}
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
                  {/* Row 1 — 3 cols: Medium, Requesting Unit, Date Needed */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Expected Medium / Media <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={form.expectedMedium}
                          onChange={set('expectedMedium')}
                          className={selectClass('expectedMedium')}
                        >
                          {PRODUCTION_MEDIA.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Requesting Unit <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.requestingUnit}
                        onChange={set('requestingUnit')}
                        placeholder="e.g. Student Affairs Office"
                        className={inputClass('requestingUnit')}
                      />
                      <FieldError error={fieldErrors.requestingUnit} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Date Needed <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={form.dateNeeded}
                        onChange={set('dateNeeded')}
                        min={today}
                        className={inputClass('dateNeeded')}
                      />
                      <FieldError error={fieldErrors.dateNeeded} />
                    </div>
                  </div>

                  {/* Row 2 — Expected Contents */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Expected Content/s of the Material <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.expectedContents}
                      onChange={set('expectedContents')}
                      rows={4}
                      placeholder="Describe the specific content you expect the material to contain."
                      className={`${inputClass('expectedContents')} resize-y min-h-[80px]`}
                    />
                    <FieldError error={fieldErrors.expectedContents} />
                  </div>

                  {/* Row 3 — Event Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Event / Activity Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.eventDescription}
                      onChange={set('eventDescription')}
                      rows={4}
                      placeholder="What is the event or activity about?"
                      className={`${inputClass('eventDescription')} resize-y min-h-[80px]`}
                    />
                    <FieldError error={fieldErrors.eventDescription} />
                  </div>

                  {/* Row 4 — Objectives */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Objectives of the Event / Activity <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.eventObjectives}
                      onChange={set('eventObjectives')}
                      rows={3}
                      placeholder="What are the goals or objectives of this event or activity?"
                      className={`${inputClass('eventObjectives')} resize-y min-h-[80px]`}
                    />
                    <FieldError error={fieldErrors.eventObjectives} />
                  </div>

                  {/* Row 5 — Audience */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Audience / Participants <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.audience}
                      onChange={set('audience')}
                      placeholder="e.g. All SLC students, Grade 12 students, Faculty"
                      className={inputClass('audience')}
                    />
                    <FieldError error={fieldErrors.audience} />
                  </div>

                  {/* Row 6 — 2 cols: Venue, Date of Event */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Venue <span className="text-red-500">*</span>
                        </label>
                        <p className="text-[10px] text-gray-300 mt-0.5">It will be held at</p>
                      </div>
                      <input
                        type="text"
                        value={form.eventVenue}
                        onChange={set('eventVenue')}
                        placeholder="e.g. SLC Gymnasium"
                        className={inputClass('eventVenue')}
                      />
                      <FieldError error={fieldErrors.eventVenue} />
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Date of Event <span className="text-red-500">*</span>
                        </label>
                        <p className="text-[10px] text-gray-300 mt-0.5">It will be held on</p>
                      </div>
                      <input
                        type="date"
                        value={form.eventDate}
                        onChange={set('eventDate')}
                        className={inputClass('eventDate')}
                      />
                      <FieldError error={fieldErrors.eventDate} />
                    </div>
                  </div>

                  {/* Row 7 — Materials Endorsed */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Materials / References Endorsed
                    </label>
                    <div className="relative">
                      <select
                        value={form.materialsEndorsed}
                        onChange={set('materialsEndorsed')}
                        className={selectClass('materialsEndorsed')}
                      >
                        {MATERIALS_OPTIONS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-400 ml-1">
                      Softcopy materials must be sent to:{' '}
                      <span className="font-medium text-gray-500">cimc@slc-sflu.edu.ph</span>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Row 1 — 2 cols: Platform, Date Needed */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Platform <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={form.platform}
                          onChange={set('platform')}
                          className={selectClass('platform')}
                        >
                          {DISSEM_PLATFORMS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Date Needed <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={form.dateNeeded}
                        onChange={set('dateNeeded')}
                        min={today}
                        className={inputClass('dateNeeded')}
                      />
                      <FieldError error={fieldErrors.dateNeeded} />
                    </div>
                  </div>

                  {/* Title / Headline */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Title / Headline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.headline}
                      onChange={set('headline')}
                      placeholder="Write in present tense, maximum 10 words"
                      className={inputClass('headline')}
                    />
                    <p className={`text-xs ml-1 ${headlineWords > 10 ? 'text-amber-500' : 'text-gray-400'}`}>
                      Present tense · {headlineWords}/10 words
                    </p>
                    <FieldError error={fieldErrors.headline} />
                  </div>

                  {/* Writers */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Writer/s with Unit / Organizational Affiliation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.writers}
                      onChange={set('writers')}
                      placeholder="e.g. Juan Dela Cruz, Student Affairs Office"
                      className={inputClass('writers')}
                    />
                    <FieldError error={fieldErrors.writers} />
                  </div>

                  {/* Content */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.content}
                      onChange={set('content')}
                      rows={12}
                      placeholder="Write 250–500 words. Must include the 5 W's: What, When, Where, Why, Who."
                      className={`${inputClass('content')} resize-y min-h-[200px]`}
                    />
                    <p className={`text-xs ml-1 ${
                      wordCount === 0
                        ? 'text-gray-400'
                        : wordCount >= 250 && wordCount <= 500
                        ? 'text-green-600'
                        : 'text-amber-500'
                    }`}>
                      {wordCount} / 500 words
                      {wordCount >= 250 && wordCount <= 500
                        ? ' ✓'
                        : wordCount > 0
                        ? ' (250–500 required)'
                        : ''}
                    </p>
                    <FieldError error={fieldErrors.content} />
                  </div>

                  {/* Keywords */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Keywords <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.keywords}
                      onChange={set('keywords')}
                      placeholder="Include aligned UN SDG, e.g. SDG 4: Quality Education, scholarship, enrollment"
                      className={inputClass('keywords')}
                    />
                    <FieldError error={fieldErrors.keywords} />
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

            <div className="md:flex md:items-start md:justify-between">
              <div></div>
        <button
          type="submit"
          form="cimoRequestForm"
          disabled={isSubmitting}
          className="md:relative fixed bottom-4 left-4 right-4 w-full md:w-auto flex items-center justify-center gap-2 px-4 md:px-6 py-4 md:py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed z-10"
        >
          {isSubmitting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
            : <><Send className="w-4 h-4" /> Submit Request</>}
        </button>
      </div>

      {/* ── Confirmation Modal ── */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Confirm Submission</h3>
                <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                <ConfirmRow label="Request Type">
                  {form.requestType === 'Production'
                    ? 'Request for Production'
                    : 'Request for Information Dissemination'}
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
              </div>

              <p className="text-xs text-gray-500">
                Await confirmation from CIMO within 2 working days. Approval depends on
                availability of CIMO staff.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                >
                  Confirm &amp; Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
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
