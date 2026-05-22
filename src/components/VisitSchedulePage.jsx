import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Plus, ChevronLeft, ChevronRight, Calendar, Clock,
  Users, MapPin, GraduationCap, FileText, Check, Loader2,
  AlertCircle, ChevronDown, List, LayoutGrid, X, CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { API, authHeaders, apiFetch } from '../config/api';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  Upcoming:  { bg: 'bg-[#1072b3]', text: 'text-white', dot: '#1072b3', chip: 'bg-[#1072b3]/10 text-[#1072b3]'  },
  Completed: { bg: 'bg-green-600', text: 'text-white', dot: '#16a34a', chip: 'bg-green-50 text-green-700'       },
  Cancelled: { bg: 'bg-red-500',   text: 'text-white', dot: '#dc2626', chip: 'bg-red-50 text-red-700'           },
};

const PURPOSE_OPTIONS = [
  'Career Orientation', 'Career Guidance Seminar',
  'Leaflet Distribution', 'School Visit', 'Other',
];

const DAY_NAMES   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function fmtDate(s) {
  if (!s) return '—';
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoRow({ icon, text, align = 'center' }) {
  return (
    <div className={cn('flex gap-2 text-xs text-gray-600', align === 'start' ? 'items-start' : 'items-center')}>
      {icon}
      <span className="leading-snug">{text}</span>
    </div>
  );
}

// ── Month View ────────────────────────────────────────────────────────────────

function MonthView({ year, month, schedules, onDayClick, onEventClick }) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const today        = new Date();

  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventsOn = (d) =>
    d ? schedules.filter(s => s.date === dateKey(year, month, d)) : [];

  const isToday = (d) =>
    d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  return (
    <div className="flex flex-col flex-1">
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_NAMES.map(n => (
          <div key={n} className="py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {n}
          </div>
        ))}
      </div>
      <div
        className="grid grid-cols-7 flex-1"
        style={{ gridAutoRows: 'minmax(100px, 1fr)' }}
      >
        {cells.map((d, i) => {
          const evs = eventsOn(d);
          return (
            <div
              key={i}
              onClick={() => d && onDayClick(d)}
              className={cn(
                'border-b border-r border-gray-50 p-2 transition-colors',
                d ? 'cursor-pointer hover:bg-[#1072b3]/2' : 'bg-gray-50/30 pointer-events-none',
                i % 7 === 0 && 'border-l',
              )}
            >
              {d && (
                <>
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center mb-1.5 text-xs font-bold',
                    isToday(d)
                      ? 'bg-[#1072b3] text-white'
                      : 'text-gray-600 hover:bg-gray-100',
                  )}>
                    {d}
                  </div>
                  <div className="space-y-0.5">
                    {evs.slice(0, 3).map(ev => (
                      <button
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                        title={ev.school_name}
                        className={cn(
                          'w-full text-left px-1.5 py-0.5 rounded text-[9px] font-bold truncate transition-opacity hover:opacity-75',
                          STATUS_CFG[ev.status]?.bg  ?? 'bg-slate-400',
                          STATUS_CFG[ev.status]?.text ?? 'text-white',
                        )}
                      >
                        {ev.school_name}
                      </button>
                    ))}
                    {evs.length > 3 && (
                      <p className="text-[9px] text-gray-400 font-bold px-1">+{evs.length - 3} more</p>
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
    <div className="grid grid-cols-7 gap-2 p-4 flex-1">
      {days.map((d, i) => {
        const key   = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
        const evs   = schedules.filter(s => s.date === key);
        const isTod = d.toDateString() === today.toDateString();
        return (
          <div
            key={i}
            onClick={() => onDayClick(d.getDate(), d.getMonth(), d.getFullYear())}
            className={cn(
              'rounded-xl border p-3 min-h-[220px] cursor-pointer transition-colors',
              isTod
                ? 'border-[#1072b3]/30 bg-[#1072b3]/3'
                : 'border-gray-100 hover:border-gray-200 bg-gray-50/40',
            )}
          >
            <div className="mb-3">
              <p className={cn('text-[9px] font-black uppercase tracking-widest', isTod ? 'text-[#1072b3]' : 'text-gray-400')}>
                {DAY_NAMES[d.getDay()]}
              </p>
              <p className={cn('text-xl font-black leading-none mt-0.5', isTod ? 'text-[#1072b3]' : 'text-gray-700')}>
                {d.getDate()}
              </p>
            </div>
            <div className="space-y-1">
              {evs.map(ev => (
                <button
                  key={ev.id}
                  onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded-lg text-[9px] font-bold leading-tight hover:opacity-80 transition-opacity',
                    STATUS_CFG[ev.status]?.bg  ?? 'bg-slate-400',
                    STATUS_CFG[ev.status]?.text ?? 'text-white',
                  )}
                >
                  <div className="truncate">{ev.school_name}</div>
                  <div className="opacity-75 mt-0.5">{fmt12(ev.start_time)}</div>
                </button>
              ))}
              {evs.length === 0 && (
                <p className="text-[9px] text-gray-300 font-bold text-center mt-8">No visits</p>
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
      <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
        <Calendar className="w-12 h-12 text-gray-200 mb-4" />
        <p className="text-sm font-black text-gray-400 uppercase tracking-wider">No schedules yet</p>
        <p className="text-xs text-gray-400 mt-1">Click "+ Create Schedule" to add your first visit</p>
      </div>
    );
  }

  const grouped = sorted.reduce((acc, s) => {
    (acc[s.date] = acc[s.date] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      {Object.entries(grouped).map(([date, evs]) => (
        <div key={date}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            {fmtDate(date)}
          </p>
          <div className="space-y-2">
            {evs.map(ev => (
              <button
                key={ev.id}
                onClick={() => onEventClick(ev)}
                className="w-full text-left bg-white border border-gray-100 rounded-xl px-5 py-4 hover:border-[#1072b3]/20 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: STATUS_CFG[ev.status]?.dot ?? '#64748b' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-sm font-black text-gray-900 truncate uppercase">{ev.school_name}</p>
                      <span className={cn(
                        'text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0',
                        STATUS_CFG[ev.status]?.chip ?? 'bg-gray-100 text-gray-600',
                      )}>
                        {ev.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {fmt12(ev.start_time)} – {fmt12(ev.end_time)}
                      </span>
                      <span className="font-bold uppercase text-[10px] tracking-wide text-gray-400">
                        {ev.purpose}
                      </span>
                    </div>
                    {ev.personnel_names?.length > 0 && (
                      <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1.5">
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

// ── Event Detail Panel ────────────────────────────────────────────────────────

function EventDetailPanel({ event, onClose, onEdit, onMarkComplete, onMarkCancelled, isUpdating }) {
  const headerBg =
    event.status === 'Completed' ? 'bg-green-600' :
    event.status === 'Cancelled' ? 'bg-red-500' :
    'bg-[#1072b3]';

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl border-l border-gray-100 flex flex-col z-[200]"
    >
      <div className={cn('px-6 py-5 shrink-0', headerBg)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-white font-black text-base uppercase leading-tight">{event.school_name}</p>
            <p className="text-white/70 text-[10px] font-bold mt-1 uppercase tracking-wide">{event.purpose}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-lg bg-white/20 text-white text-[9px] font-black uppercase tracking-wide">
              {event.status}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors shrink-0">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <InfoRow icon={<Calendar className="w-4 h-4 text-gray-400 shrink-0" />} text={fmtDate(event.date)} />
        <InfoRow icon={<Clock    className="w-4 h-4 text-gray-400 shrink-0" />} text={`${fmt12(event.start_time)} – ${fmt12(event.end_time)}`} />
        <InfoRow icon={<MapPin   className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />} text={event.school_address} align="start" />
        {event.school_strands && (
          <InfoRow icon={<GraduationCap className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />} text={event.school_strands} align="start" />
        )}
        {event.personnel_names?.length > 0 && (
          <InfoRow icon={<Users className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />} text={event.personnel_names.join(', ')} align="start" />
        )}
        {event.notes && (
          <InfoRow icon={<FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />} text={event.notes} align="start" />
        )}
      </div>

      {event.status === 'Upcoming' && (
        <div className="px-6 py-5 border-t border-gray-100 space-y-2 shrink-0">
          <button
            onClick={onEdit}
            className="w-full py-3 bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Edit Schedule
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onMarkComplete}
              disabled={isUpdating}
              className="py-3 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Complete
            </button>
            <button
              onClick={onMarkCancelled}
              disabled={isUpdating}
              className="py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Create / Edit Drawer ──────────────────────────────────────────────────────

function ScheduleDrawer({ schools, users, initialData, prefillDate, onSave, onClose, isSubmitting, apiError, conflicts }) {
  const blank = { school: '', date: prefillDate ?? '', start_time: '08:00', end_time: '10:00', purpose: 'Career Orientation', assigned_personnel: [], notes: '' };
  const [form, setForm] = useState(initialData ? {
    school: initialData.school ?? '',
    date: initialData.date ?? '',
    start_time: initialData.start_time ?? '08:00',
    end_time: initialData.end_time ?? '10:00',
    purpose: initialData.purpose ?? 'Career Orientation',
    assigned_personnel: initialData.assigned_personnel ?? [],
    notes: initialData.notes ?? '',
  } : blank);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [schoolSearch, setSchoolSearch]   = useState('');
  const [schoolOpen, setSchoolOpen]       = useState(false);
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

  const selectedSchool   = schools.find(s => s.id === Number(form.school));
  const filteredSchools  = schools.filter(s => s.school_name.toLowerCase().includes(schoolSearch.toLowerCase()));
  const selectedPersonnel = users.filter(u => form.assigned_personnel.includes(u.id));

  const togglePersonnel = (id) =>
    set('assigned_personnel',
      form.assigned_personnel.includes(id)
        ? form.assigned_personnel.filter(x => x !== id)
        : [...form.assigned_personnel, id]
    );

  const inp = 'w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#1072b3]/20 focus:bg-white outline-none transition-all';
  const lbl = 'text-[10px] font-black text-gray-400 uppercase tracking-widest';

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="flex flex-col h-full">
      {/* Drawer header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0 bg-white">
        <div>
          <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">
            {initialData ? 'Edit Schedule' : 'Create Schedule'}
          </h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
            Trailblazing Visit
          </p>
        </div>
        <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Scrollable fields */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

        {/* Errors */}
        {apiError && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 font-bold">{apiError}</p>
          </div>
        )}

        {/* Conflict warnings */}
        {conflicts?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-wide mb-2">
              ⚠ Scheduling Conflicts
            </p>
            {conflicts.map((c, i) => (
              <p key={i} className="text-xs text-amber-700 leading-relaxed">• {c}</p>
            ))}
          </div>
        )}

        {/* School */}
        <div ref={schoolRef} className="relative">
          <label className={lbl}>School Name *</label>
          <button
            type="button"
            onClick={() => setSchoolOpen(p => !p)}
            className="mt-2 w-full bg-gray-50 border border-transparent rounded-xl py-3.5 px-4 text-sm text-left flex items-center justify-between hover:bg-gray-100 outline-none focus:ring-2 focus:ring-[#1072b3]/20 transition-all"
          >
            <span className={selectedSchool ? 'text-gray-900 font-semibold' : 'text-gray-400'}>
              {selectedSchool ? selectedSchool.school_name : 'Select a school…'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          </button>
          {schoolOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-2.5 border-b border-gray-100">
                <input
                  autoFocus
                  value={schoolSearch}
                  onChange={e => setSchoolSearch(e.target.value)}
                  placeholder="Search schools…"
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-[#1072b3]/20"
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filteredSchools.length === 0
                  ? <p className="p-4 text-xs text-gray-400 text-center">No schools found.</p>
                  : filteredSchools.map(s => (
                      <button
                        key={s.id} type="button"
                        onClick={() => { set('school', s.id); setSchoolOpen(false); setSchoolSearch(''); }}
                        className={cn(
                          'w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0',
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
          <label className={lbl}>Visit Date *</label>
          <input
            type="date" required
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className={cn(inp, 'mt-2')}
          />
        </div>

        {/* Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Start Time *</label>
            <input type="time" required value={form.start_time} onChange={e => set('start_time', e.target.value)} className={cn(inp, 'mt-2')} />
          </div>
          <div>
            <label className={lbl}>End Time *</label>
            <input type="time" required value={form.end_time} onChange={e => set('end_time', e.target.value)} className={cn(inp, 'mt-2')} />
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className={lbl}>Activity / Purpose *</label>
          <select required value={form.purpose} onChange={e => set('purpose', e.target.value)} className={cn(inp, 'mt-2')}>
            {PURPOSE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Personnel */}
        <div ref={personnelRef} className="relative">
          <label className={lbl}>Assigned Team Members</label>
          <button
            type="button"
            onClick={() => setPersonnelOpen(p => !p)}
            className="mt-2 w-full bg-gray-50 border border-transparent rounded-xl py-3.5 px-4 text-sm text-left flex items-start justify-between hover:bg-gray-100 outline-none focus:ring-2 focus:ring-[#1072b3]/20 transition-all min-h-[52px]"
          >
            <div className="flex flex-wrap gap-1.5 flex-1">
              {selectedPersonnel.length === 0
                ? <span className="text-gray-400 text-sm">Select team members…</span>
                : selectedPersonnel.map(u => (
                    <span key={u.id} className="px-2.5 py-1 bg-[#1072b3]/10 text-[#1072b3] rounded-lg text-[10px] font-black">
                      {`${u.first_name} ${u.last_name}`.trim() || u.username}
                    </span>
                  ))
              }
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1 ml-2" />
          </button>
          {personnelOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
              {users.length === 0
                ? <p className="p-4 text-xs text-gray-400 text-center">No team members found.</p>
                : users.map(u => {
                    const name     = `${u.first_name} ${u.last_name}`.trim() || u.username;
                    const selected = form.assigned_personnel.includes(u.id);
                    return (
                      <button
                        key={u.id} type="button"
                        onClick={() => togglePersonnel(u.id)}
                        className={cn(
                          'w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0',
                          selected ? 'bg-[#1072b3]/5' : '',
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                          selected ? 'bg-[#1072b3] border-[#1072b3]' : 'border-gray-300',
                        )}>
                          {selected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={cn('flex-1', selected ? 'font-black text-[#1072b3]' : 'font-medium text-gray-700')}>
                          {name}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{u.role}</span>
                      </button>
                    );
                  })
              }
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className={lbl}>Notes / Instructions</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={4}
            placeholder="Contact person, directions, special requirements…"
            className={cn(inp, 'mt-2 resize-none')}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-gray-100 flex gap-3 shrink-0 bg-white">
        <button
          type="button" onClick={onClose} disabled={isSubmitting}
          className="flex-1 py-3.5 bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !form.school || !form.date}
          className="flex-1 py-3.5 bg-[#1072b3] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f6ce11] hover:text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            : (initialData ? 'Save Changes' : 'Create Schedule')
          }
        </button>
      </div>
    </form>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'fixed top-20 right-6 z-[400] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold max-w-sm',
        type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800',
      )}
    >
      {type === 'success'
        ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
        : <AlertCircle  className="w-5 h-5 text-red-500 shrink-0" />
      }
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-2 p-0.5 hover:opacity-60 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function VisitSchedulePage({ onBack }) {
  const [view, setView]               = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules]     = useState([]);
  const [schools, setSchools]         = useState([]);
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState(null);

  // Panel state
  const [detailEvent, setDetailEvent]     = useState(null);   // right-side detail panel
  const [showDrawer, setShowDrawer]       = useState(false);  // create/edit drawer
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [prefillDate, setPrefillDate]         = useState('');
  const [formError, setFormError]             = useState(null);
  const [formConflicts, setFormConflicts]     = useState([]);
  const [formSubmitting, setFormSubmitting]   = useState(false);
  const [isUpdating, setIsUpdating]           = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

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

  // ── Fetches ─────────────────────────────────────────────────────────────────

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

  const fetchSchools = useCallback(async () => {
    try {
      const res = await apiFetch(`${API}/api/schools/`, { headers: authHeaders() });
      if (!res.ok) return;
      setSchools(await res.json());
    } catch { /* silent */ }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiFetch(`${API}/api/users/`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setUsers(list.filter(u => !u.is_archived && (u.role === 'Admin' || u.role === 'Staff')));
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchSchools();
    fetchUsers();
  }, [fetchSchedules, fetchSchools, fetchUsers]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const navigate = (dir) => {
    const next = new Date(currentDate);
    if (view === 'week') next.setDate(next.getDate() + dir * 7);
    else                 next.setMonth(month + dir);
    setCurrentDate(next);
  };

  const navLabel = view === 'week'
    ? (() => {
        const end = new Date(weekStart.getTime() + 6 * 86_400_000);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      })()
    : `${MONTH_NAMES[month]} ${year}`;

  // ── Interactions ─────────────────────────────────────────────────────────────

  const openCreate = (date = '') => {
    setPrefillDate(date);
    setEditingSchedule(null);
    setFormError(null);
    setFormConflicts([]);
    setDetailEvent(null);
    setShowDrawer(true);
  };

  const handleDayClick = (d, m, y) => {
    const dt = new Date(y ?? year, m ?? month, d);
    openCreate(dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate()));
  };

  const handleEditEvent = (ev) => {
    setDetailEvent(null);
    setEditingSchedule(ev);
    setFormError(null);
    setFormConflicts([]);
    setShowDrawer(true);
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
      setDetailEvent(null);
      showToast(
        newStatus === 'Completed'
          ? `Visit to ${ev.school_name} marked as completed.`
          : `Visit to ${ev.school_name} has been cancelled.`,
        newStatus === 'Completed' ? 'success' : 'error',
      );
    } catch (e) {
      showToast(`Update failed: ${e.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFormSave = async (formData) => {
    setFormSubmitting(true);
    setFormError(null);
    setFormConflicts([]);
    const isEdit = !!editingSchedule;
    const url    = isEdit
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
      setShowDrawer(false);
      setEditingSchedule(null);
      const schoolName = schools.find(s => s.id === Number(formData.school))?.school_name ?? 'School';
      showToast(
        isEdit
          ? `Schedule for ${schoolName} updated successfully.`
          : `Visit to ${schoolName} scheduled successfully.`
      );
    } catch (e) {
      setFormError(`Failed to save: ${e.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Page top bar ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#1072b3] hover:text-[#03396c] transition-colors font-black text-[11px] uppercase tracking-widest group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Back to School Intelligence
        </button>

        <button
          onClick={() => openCreate()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1072b3] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f6ce11] hover:text-black transition-all duration-300 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Schedule
        </button>
      </div>

      {/* ── Page header ── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#1072b3]/10 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-[#1072b3]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Visit Schedule</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">
            Trailblazing Calendar
          </p>
        </div>
      </div>

      {/* ── Calendar card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:border-[#1072b3]/40 hover:text-[#1072b3] transition-all"
            >
              Today
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-base font-black text-gray-900 ml-2">{navLabel}</span>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {[
              { key: 'month',  icon: <LayoutGrid className="w-3.5 h-3.5" />, label: 'Month'  },
              { key: 'week',   icon: <Calendar   className="w-3.5 h-3.5" />, label: 'Week'   },
              { key: 'agenda', icon: <List       className="w-3.5 h-3.5" />, label: 'Agenda' },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                  view === key
                    ? 'bg-white text-[#1072b3] shadow-sm'
                    : 'text-gray-400 hover:text-gray-600',
                )}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 px-6 py-3 border-b border-gray-50 bg-gray-50/40">
          {Object.entries(STATUS_CFG).map(([label, cfg]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wide">{label}</span>
            </div>
          ))}
          {!loading && (
            <span className="ml-auto text-[10px] text-gray-400 font-bold">
              {schedules.length} schedule{schedules.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Calendar body */}
        <div className="min-h-[560px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#1072b3] animate-spin" />
            </div>
          ) : fetchError ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
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
                  onEventClick={(ev) => { setDetailEvent(ev); setShowDrawer(false); }}
                />
              )}
              {view === 'week' && (
                <WeekView
                  weekStart={weekStart}
                  schedules={schedules}
                  onEventClick={(ev) => { setDetailEvent(ev); setShowDrawer(false); }}
                  onDayClick={handleDayClick}
                />
              )}
              {view === 'agenda' && (
                <AgendaView
                  schedules={schedules}
                  onEventClick={(ev) => { setDetailEvent(ev); setShowDrawer(false); }}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Backdrop (shared by drawer and detail panel) ── */}
      <AnimatePresence>
        {(showDrawer || detailEvent) && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[199]"
            onClick={() => { setShowDrawer(false); setDetailEvent(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Create / Edit drawer ── */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div
            key="drawer"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-gray-100 flex flex-col z-[200]"
          >
            <ScheduleDrawer
              schools={schools}
              users={users}
              initialData={editingSchedule}
              prefillDate={prefillDate}
              onSave={handleFormSave}
              onClose={() => { setShowDrawer(false); setEditingSchedule(null); }}
              isSubmitting={formSubmitting}
              apiError={formError}
              conflicts={formConflicts}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Event detail panel ── */}
      <AnimatePresence>
        {detailEvent && (
          <EventDetailPanel
            key="detail"
            event={detailEvent}
            onClose={() => setDetailEvent(null)}
            onEdit={() => handleEditEvent(detailEvent)}
            onMarkComplete={() => handleMarkStatus(detailEvent, 'Completed')}
            onMarkCancelled={() => handleMarkStatus(detailEvent, 'Cancelled')}
            isUpdating={isUpdating}
          />
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <Toast
            key="toast"
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
