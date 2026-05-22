import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Plus, ChevronLeft, ChevronRight, Calendar, Clock,
  Users, MapPin, GraduationCap, FileText, Check, Loader2,
  AlertCircle, ChevronDown, List, LayoutGrid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { API, authHeaders, apiFetch } from '../config/api';

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  Upcoming:  { bg: 'bg-[#1072b3]',  text: 'text-white',  dot: '#1072b3',  chip: 'bg-[#1072b3]/10 text-[#1072b3]'  },
  Completed: { bg: 'bg-green-600',  text: 'text-white',  dot: '#16a34a',  chip: 'bg-green-50 text-green-700'       },
  Cancelled: { bg: 'bg-red-500',    text: 'text-white',  dot: '#dc2626',  chip: 'bg-red-50 text-red-700'           },
};

const PURPOSE_OPTIONS = [
  'Career Orientation',
  'Career Guidance Seminar',
  'Leaflet Distribution',
  'School Visit',
  'Other',
];

const DAY_NAMES   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt12(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function toDateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ── Month Calendar ────────────────────────────────────────────────────────────

function MonthView({ year, month, schedules, onDayClick, onEventClick }) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const today        = new Date();

  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventsOn = (d) => {
    if (!d) return [];
    return schedules.filter(s => s.date === toDateKey(year, month, d));
  };

  const isToday = (d) =>
    d &&
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === d;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100 shrink-0">
        {DAY_NAMES.map(n => (
          <div key={n} className="py-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {n}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 overflow-y-auto" style={{ gridAutoRows: 'minmax(90px, 1fr)' }}>
        {cells.map((d, i) => {
          const evs = eventsOn(d);
          return (
            <div
              key={i}
              onClick={() => d && onDayClick(d)}
              className={cn(
                'border-b border-r border-gray-50 p-1.5 transition-colors',
                d ? 'cursor-pointer hover:bg-gray-50/60' : 'bg-gray-50/30 pointer-events-none',
                i % 7 === 0 && 'border-l',
              )}
            >
              {d && (
                <>
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center mb-1 text-xs font-bold',
                    isToday(d) ? 'bg-[#1072b3] text-white' : 'text-gray-600',
                  )}>
                    {d}
                  </div>
                  <div className="space-y-0.5">
                    {evs.slice(0, 2).map(ev => (
                      <button
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(ev, e); }}
                        title={ev.school_name}
                        className={cn(
                          'w-full text-left px-1.5 py-0.5 rounded text-[9px] font-bold truncate hover:opacity-80 transition-opacity',
                          STATUS_CFG[ev.status]?.bg  ?? 'bg-slate-400',
                          STATUS_CFG[ev.status]?.text ?? 'text-white',
                        )}
                      >
                        {ev.school_name}
                      </button>
                    ))}
                    {evs.length > 2 && (
                      <p className="text-[9px] text-gray-400 font-bold px-1">+{evs.length - 2} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Week View ─────────────────────────────────────────────────────────────────

function WeekView({ weekStart, schedules, onEventClick, onDayClick }) {
  const today = new Date();
  const days  = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="grid grid-cols-7 gap-2 flex-1 overflow-y-auto p-4">
      {days.map((d, i) => {
        const key    = toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
        const evs    = schedules.filter(s => s.date === key);
        const isTod  = d.toDateString() === today.toDateString();
        return (
          <div
            key={i}
            onClick={() => onDayClick(d.getDate(), d.getMonth(), d.getFullYear())}
            className={cn(
              'rounded-xl border p-2 min-h-[180px] cursor-pointer transition-colors',
              isTod ? 'border-[#1072b3]/40 bg-[#1072b3]/3' : 'border-gray-100 hover:border-gray-200 bg-gray-50/40',
            )}
          >
            <div className="mb-2">
              <p className={cn('text-[9px] font-black uppercase tracking-widest', isTod ? 'text-[#1072b3]' : 'text-gray-400')}>
                {DAY_NAMES[d.getDay()]}
              </p>
              <p className={cn('text-lg font-black leading-none', isTod ? 'text-[#1072b3]' : 'text-gray-700')}>
                {d.getDate()}
              </p>
            </div>
            <div className="space-y-1">
              {evs.map(ev => (
                <button
                  key={ev.id}
                  onClick={(e) => { e.stopPropagation(); onEventClick(ev, e); }}
                  className={cn(
                    'w-full text-left px-1.5 py-1 rounded text-[9px] font-bold leading-tight hover:opacity-80 transition-opacity',
                    STATUS_CFG[ev.status]?.bg  ?? 'bg-slate-400',
                    STATUS_CFG[ev.status]?.text ?? 'text-white',
                  )}
                >
                  <div className="truncate">{ev.school_name}</div>
                  <div className="opacity-70 mt-0.5">{fmt12(ev.start_time)}</div>
                </button>
              ))}
              {evs.length === 0 && (
                <p className="text-[9px] text-gray-300 font-bold text-center mt-6">No visits</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Agenda View ───────────────────────────────────────────────────────────────

function AgendaView({ schedules, onEventClick }) {
  const sorted = [...schedules].sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.start_time.localeCompare(b.start_time)
  );

  if (sorted.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
        <Calendar className="w-10 h-10 text-gray-200 mb-3" />
        <p className="text-sm font-black text-gray-400 uppercase tracking-wider">No schedules yet</p>
        <p className="text-xs text-gray-400 mt-1">Click "+ Create Schedule" to get started</p>
      </div>
    );
  }

  const grouped = sorted.reduce((acc, s) => {
    (acc[s.date] = acc[s.date] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5">
      {Object.entries(grouped).map(([date, evs]) => (
        <div key={date}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
            {fmtDate(date)}
          </p>
          <div className="space-y-2">
            {evs.map(ev => (
              <button
                key={ev.id}
                onClick={(e) => onEventClick(ev, e)}
                className="w-full text-left bg-white border border-gray-100 rounded-xl p-3 hover:border-[#1072b3]/20 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                    style={{ background: STATUS_CFG[ev.status]?.dot ?? '#64748b' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-gray-900 truncate uppercase">{ev.school_name}</p>
                      <span className={cn(
                        'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shrink-0',
                        STATUS_CFG[ev.status]?.chip ?? 'bg-gray-100 text-gray-600',
                      )}>
                        {ev.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmt12(ev.start_time)} – {fmt12(ev.end_time)}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">
                      {ev.purpose}
                    </p>
                    {ev.personnel_names?.length > 0 && (
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {ev.personnel_names.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Event Popover ─────────────────────────────────────────────────────────────

function EventPopover({ event, anchorEl, onClose, onEdit, onMarkComplete, onMarkCancelled, isUpdating }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) &&
          anchorEl && !anchorEl.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [anchorEl, onClose]);

  const headerBg =
    event.status === 'Completed' ? 'bg-green-600' :
    event.status === 'Cancelled' ? 'bg-red-500' :
    'bg-[#1072b3]';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -6 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[300] w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      style={{ top: 80, right: 16 }}
    >
      <div className={cn('p-4', headerBg)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-white font-black text-sm uppercase leading-tight truncate">{event.school_name}</p>
            <p className="text-white/70 text-[10px] font-bold mt-0.5 uppercase tracking-wide">{event.purpose}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors shrink-0">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        <Row icon={<Calendar className="w-3.5 h-3.5 text-gray-400" />} text={fmtDate(event.date)} />
        <Row icon={<Clock    className="w-3.5 h-3.5 text-gray-400" />} text={`${fmt12(event.start_time)} – ${fmt12(event.end_time)}`} />
        <Row icon={<MapPin   className="w-3.5 h-3.5 text-gray-400 mt-0.5" />} text={event.school_address} align="start" />
        {event.school_strands && (
          <Row icon={<GraduationCap className="w-3.5 h-3.5 text-gray-400 mt-0.5" />} text={event.school_strands} align="start" />
        )}
        {event.personnel_names?.length > 0 && (
          <Row icon={<Users className="w-3.5 h-3.5 text-gray-400 mt-0.5" />} text={event.personnel_names.join(', ')} align="start" />
        )}
        {event.notes && (
          <Row icon={<FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5" />} text={event.notes} align="start" />
        )}
      </div>

      {event.status === 'Upcoming' && (
        <div className="px-4 pb-4 grid grid-cols-3 gap-2">
          <button
            onClick={onEdit}
            className="py-2 bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onMarkComplete}
            disabled={isUpdating}
            className="py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Done
          </button>
          <button
            onClick={onMarkCancelled}
            disabled={isUpdating}
            className="py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </motion.div>
  );
}

function Row({ icon, text, align = 'center' }) {
  return (
    <div className={cn('flex gap-2 text-xs text-gray-600', align === 'start' ? 'items-start' : 'items-center')}>
      {icon}
      <span className="leading-snug">{text}</span>
    </div>
  );
}

// ── Schedule Form ─────────────────────────────────────────────────────────────

function ScheduleForm({ schools, users, initialData, prefillDate, onSave, onCancel, isSubmitting, apiError, conflicts }) {
  const blankForm = {
    school: '',
    date: prefillDate ?? '',
    start_time: '08:00',
    end_time: '10:00',
    purpose: 'Career Orientation',
    assigned_personnel: [],
    notes: '',
  };

  const [form, setForm] = useState(initialData ? {
    school: initialData.school ?? '',
    date: initialData.date ?? '',
    start_time: initialData.start_time ?? '08:00',
    end_time: initialData.end_time ?? '10:00',
    purpose: initialData.purpose ?? 'Career Orientation',
    assigned_personnel: initialData.assigned_personnel ?? [],
    notes: initialData.notes ?? '',
  } : blankForm);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolOpen, setSchoolOpen]     = useState(false);
  const [personnelOpen, setPersonnelOpen] = useState(false);
  const schoolRef    = useRef(null);
  const personnelRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (schoolRef.current    && !schoolRef.current.contains(e.target))    setSchoolOpen(false);
      if (personnelRef.current && !personnelRef.current.contains(e.target)) setPersonnelOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selectedSchool = schools.find(s => s.id === Number(form.school));
  const filteredSchools = schools.filter(s =>
    s.school_name.toLowerCase().includes(schoolSearch.toLowerCase())
  );
  const selectedPersonnel = users.filter(u => form.assigned_personnel.includes(u.id));

  const togglePersonnel = (id) => {
    set('assigned_personnel', form.assigned_personnel.includes(id)
      ? form.assigned_personnel.filter(x => x !== id)
      : [...form.assigned_personnel, id]);
  };

  const inp  = 'w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#1072b3]/20 focus:bg-white outline-none transition-all';
  const lbl  = 'text-[10px] font-black text-gray-400 uppercase tracking-widest';

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">
          {initialData ? 'Edit Schedule' : 'Create Schedule'}
        </h2>
        <button type="button" onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* Errors / Conflicts */}
        {apiError && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 font-bold">{apiError}</p>
          </div>
        )}
        {conflicts?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-wide mb-1.5">Scheduling Conflicts Detected</p>
            {conflicts.map((c, i) => <p key={i} className="text-xs text-amber-700">• {c}</p>)}
          </div>
        )}

        {/* School */}
        <div ref={schoolRef} className="relative">
          <label className={lbl}>School *</label>
          <button
            type="button"
            onClick={() => setSchoolOpen(p => !p)}
            className="mt-1.5 w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm text-left flex items-center justify-between hover:bg-gray-100 outline-none focus:ring-2 focus:ring-[#1072b3]/20 transition-all"
          >
            <span className={selectedSchool ? 'text-gray-900 font-bold' : 'text-gray-400'}>
              {selectedSchool ? selectedSchool.school_name : 'Select a school…'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          </button>
          {schoolOpen && (
            <div className="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <input
                  autoFocus
                  value={schoolSearch}
                  onChange={e => setSchoolSearch(e.target.value)}
                  placeholder="Search schools…"
                  className="w-full px-3 py-2 text-sm bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-[#1072b3]/20"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredSchools.length === 0
                  ? <p className="p-3 text-xs text-gray-400 text-center">No schools found.</p>
                  : filteredSchools.map(s => (
                      <button
                        key={s.id} type="button"
                        onClick={() => { set('school', s.id); setSchoolOpen(false); setSchoolSearch(''); }}
                        className={cn(
                          'w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors',
                          form.school === s.id ? 'bg-[#1072b3]/10 font-black text-[#1072b3]' : 'text-gray-700 font-medium',
                        )}
                      >
                        {s.school_name}
                      </button>
                    ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Date */}
        <div>
          <label className={lbl}>Date *</label>
          <input
            type="date" required
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className={cn(inp, 'mt-1.5')}
          />
        </div>

        {/* Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Start Time *</label>
            <input type="time" required value={form.start_time} onChange={e => set('start_time', e.target.value)} className={cn(inp, 'mt-1.5')} />
          </div>
          <div>
            <label className={lbl}>End Time *</label>
            <input type="time" required value={form.end_time} onChange={e => set('end_time', e.target.value)} className={cn(inp, 'mt-1.5')} />
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className={lbl}>Purpose / Activity *</label>
          <select required value={form.purpose} onChange={e => set('purpose', e.target.value)} className={cn(inp, 'mt-1.5')}>
            {PURPOSE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Personnel */}
        <div ref={personnelRef} className="relative">
          <label className={lbl}>Assigned Personnel</label>
          <button
            type="button"
            onClick={() => setPersonnelOpen(p => !p)}
            className="mt-1.5 w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm text-left flex items-start justify-between hover:bg-gray-100 outline-none focus:ring-2 focus:ring-[#1072b3]/20 transition-all min-h-[48px]"
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedPersonnel.length === 0
                ? <span className="text-gray-400 text-sm">Select team members…</span>
                : selectedPersonnel.map(u => (
                    <span key={u.id} className="px-2 py-0.5 bg-[#1072b3]/10 text-[#1072b3] rounded text-[10px] font-black">
                      {`${u.first_name} ${u.last_name}`.trim() || u.username}
                    </span>
                  ))
              }
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1 ml-2" />
          </button>
          {personnelOpen && (
            <div className="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
              {users.length === 0
                ? <p className="p-3 text-xs text-gray-400 text-center">No team members found.</p>
                : users.map(u => {
                    const name     = `${u.first_name} ${u.last_name}`.trim() || u.username;
                    const selected = form.assigned_personnel.includes(u.id);
                    return (
                      <button
                        key={u.id} type="button"
                        onClick={() => togglePersonnel(u.id)}
                        className={cn(
                          'w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors',
                          selected ? 'bg-[#1072b3]/5' : '',
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                          selected ? 'bg-[#1072b3] border-[#1072b3]' : 'border-gray-300',
                        )}>
                          {selected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={selected ? 'font-black text-[#1072b3]' : 'font-medium text-gray-700'}>
                          {name}
                        </span>
                        <span className="text-[9px] text-gray-400 ml-auto">{u.role}</span>
                      </button>
                    );
                  })
              }
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className={lbl}>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            placeholder="Contact person, special instructions…"
            className={cn(inp, 'mt-1.5 resize-none')}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
        <button
          type="button" onClick={onCancel} disabled={isSubmitting}
          className="flex-1 py-3 bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !form.school || !form.date}
          className="flex-1 py-3 bg-[#1072b3] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f6ce11] hover:text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
            : (initialData ? 'Save Changes' : 'Create Schedule')
          }
        </button>
      </div>
    </form>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export default function ScheduleModal({ schools, onClose, onSchoolUpdated }) {
  const [view, setView]               = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState(null);
  const [users, setUsers]             = useState([]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [anchorEl, setAnchorEl]           = useState(null);

  const [showForm, setShowForm]               = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [prefillDate, setPrefillDate]         = useState('');
  const [formError, setFormError]             = useState(null);
  const [formConflicts, setFormConflicts]     = useState([]);
  const [formSubmitting, setFormSubmitting]   = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getWeekStart = (d) => {
    const day  = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const s    = new Date(d);
    s.setDate(d.getDate() + diff);
    return s;
  };
  const weekStart = getWeekStart(currentDate);

  // ── Data fetch ──────────────────────────────────────────────────────────────

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await apiFetch(`${API}/api/trailblazing/schedules/`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSchedules(await res.json());
    } catch (e) {
      setFetchError(`Failed to load schedules: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiFetch(`${API}/api/users/`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setUsers(list.filter(u => !u.is_archived && (u.role === 'Admin' || u.role === 'Staff')));
    } catch { /* silent — personnel list is optional */ }
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchUsers();
  }, [fetchSchedules, fetchUsers]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const navigate = (dir) => {
    const next = new Date(currentDate);
    if (view === 'week') {
      next.setDate(next.getDate() + dir * 7);
    } else {
      next.setMonth(month + dir);
    }
    setCurrentDate(next);
  };

  const navLabel = view === 'week'
    ? (() => {
        const end = new Date(weekStart.getTime() + 6 * 86_400_000);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      })()
    : `${MONTH_NAMES[month]} ${year}`;

  // ── Event interaction ───────────────────────────────────────────────────────

  const openEventPopover = (ev, e) => {
    setAnchorEl(e?.currentTarget ?? null);
    setSelectedEvent(ev);
  };

  const handleDayClick = (d, m, y) => {
    const date = new Date(y ?? year, m ?? month, d);
    setPrefillDate(toDateKey(date.getFullYear(), date.getMonth(), date.getDate()));
    setEditingSchedule(null);
    setFormError(null);
    setFormConflicts([]);
    setShowForm(true);
  };

  const handleEditEvent = (ev) => {
    setSelectedEvent(null);
    setEditingSchedule(ev);
    setFormError(null);
    setFormConflicts([]);
    setShowForm(true);
  };

  const handleMarkStatus = async (ev, newStatus) => {
    setIsUpdating(true);
    try {
      const res = await apiFetch(`${API}/api/trailblazing/schedules/${ev.id}/`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchSchedules();
      if (newStatus === 'Completed') onSchoolUpdated?.();
      setSelectedEvent(null);
    } catch (e) {
      setFetchError(`Update failed: ${e.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFormSave = async (formData) => {
    setFormSubmitting(true);
    setFormError(null);
    setFormConflicts([]);
    const isEdit = !!editingSchedule;
    const url = isEdit
      ? `${API}/api/trailblazing/schedules/${editingSchedule.id}/`
      : `${API}/api/trailblazing/schedules/`;
    try {
      const res  = await apiFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.status === 409) {
        setFormConflicts(data.conflicts ?? []);
        setFormError(data.error ?? 'Scheduling conflict detected.');
        return;
      }
      if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      await fetchSchedules();
      if (formData.status === 'Completed') onSchoolUpdated?.();
      setShowForm(false);
      setEditingSchedule(null);
    } catch (e) {
      setFormError(`Failed to save: ${e.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 16 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-gray-100"
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1072b3]/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#1072b3]" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Visit Schedule</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Trailblazing Calendar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingSchedule(null);
                setPrefillDate('');
                setFormError(null);
                setFormConflicts([]);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#1072b3] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f6ce11] hover:text-black transition-all duration-300"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Schedule
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-600 hover:border-[#1072b3]/30 transition-colors"
            >
              Today
            </button>
            <button onClick={() => navigate(1)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-sm font-black text-gray-900 ml-2">{navLabel}</span>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {[
              { key: 'month',  icon: <LayoutGrid className="w-3.5 h-3.5" />, label: 'Month'  },
              { key: 'week',   icon: <Calendar   className="w-3.5 h-3.5" />, label: 'Week'   },
              { key: 'agenda', icon: <List        className="w-3.5 h-3.5" />, label: 'Agenda' },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                  view === key ? 'bg-white text-[#1072b3] shadow-sm' : 'text-gray-400 hover:text-gray-600',
                )}
              >
                {icon}{label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Status Legend ── */}
        <div className="flex items-center gap-5 px-6 py-2 border-b border-gray-50 shrink-0">
          {Object.entries(STATUS_CFG).map(([label, cfg]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Calendar area */}
          <div className={cn(
            'flex flex-col flex-1 transition-all duration-300',
            showForm ? 'invisible w-0 overflow-hidden' : 'visible w-full',
          )}>
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#1072b3] animate-spin" />
              </div>
            ) : fetchError ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
                <p className="text-sm text-gray-500">{fetchError}</p>
              </div>
            ) : (
              <>
                {view === 'month' && (
                  <MonthView
                    year={year} month={month}
                    schedules={schedules}
                    onDayClick={handleDayClick}
                    onEventClick={openEventPopover}
                  />
                )}
                {view === 'week' && (
                  <WeekView
                    weekStart={weekStart}
                    schedules={schedules}
                    onEventClick={openEventPopover}
                    onDayClick={handleDayClick}
                  />
                )}
                {view === 'agenda' && (
                  <AgendaView
                    schedules={schedules}
                    onEventClick={openEventPopover}
                  />
                )}
              </>
            )}
          </div>

          {/* Form slide-in */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 bg-white flex flex-col z-10"
              >
                <ScheduleForm
                  schools={schools}
                  users={users}
                  initialData={editingSchedule}
                  prefillDate={prefillDate}
                  onSave={handleFormSave}
                  onCancel={() => { setShowForm(false); setEditingSchedule(null); }}
                  isSubmitting={formSubmitting}
                  apiError={formError}
                  conflicts={formConflicts}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Event popover */}
          <AnimatePresence>
            {selectedEvent && (
              <EventPopover
                event={selectedEvent}
                anchorEl={anchorEl}
                onClose={() => setSelectedEvent(null)}
                onEdit={() => handleEditEvent(selectedEvent)}
                onMarkComplete={() => handleMarkStatus(selectedEvent, 'Completed')}
                onMarkCancelled={() => handleMarkStatus(selectedEvent, 'Cancelled')}
                isUpdating={isUpdating}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
