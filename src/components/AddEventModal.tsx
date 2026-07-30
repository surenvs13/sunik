import React, { useState, useEffect } from 'react';
import { ScheduleEvent, PersonType, EventCategory, FamilyNames } from '../types';
import { X, Calendar, Clock, MapPin, Tag, User, Sparkles, ShieldAlert, CheckCircle2, Stethoscope, Undo2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: ScheduleEvent, additionalEvents?: ScheduleEvent[]) => void;
  initialDate?: string;
  initialCategory?: EventCategory;
  editEvent?: ScheduleEvent | null;
  familyNames: FamilyNames;
  canUndo?: boolean;
  onUndo?: () => void;
}

const CATEGORIES: EventCategory[] = [
  'On-Call 24h',
  'Night Shift',
  'Day Clinic',
  'Post-Call Rest',
  'Ward Rounds',
  'Court Hearing',
  'Late Night Call',
  'Client Briefing',
  'Nursery/Daycare',
  'Pediatrician',
  'Playgroup/Park',
  'Family Outing',
  'Date Night',
  'Bedtime Routine',
  'Church/Catechism',
  'Custom Event',
  'Other'
];

// Helper to add days to a YYYY-MM-DD string cleanly
const addDaysToDateStr = (dateStr: string, days: number = 1): string => {
  if (!dateStr) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const AddEventModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialCategory,
  editEvent,
  familyNames,
  canUndo,
  onUndo
}) => {
  const defaultDate = initialDate || new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState(editEvent?.title || '');
  const [person, setPerson] = useState<PersonType>(editEvent?.person || familyNames.husband);
  const [category, setCategory] = useState<EventCategory>(editEvent?.category || initialCategory || 'On-Call 24h');
  const [startDate, setStartDate] = useState(editEvent?.startDate || defaultDate);
  const [startTime, setStartTime] = useState(editEvent?.startTime || '08:00');
  const [endDate, setEndDate] = useState(
    editEvent?.endDate || (initialCategory === 'On-Call 24h' ? addDaysToDateStr(defaultDate, 1) : defaultDate)
  );
  const [endTime, setEndTime] = useState(editEvent?.endTime || '08:00');
  const [isCallDuty, setIsCallDuty] = useState(editEvent?.isCallDuty || (initialCategory === 'On-Call 24h'));
  const [isNightShift, setIsNightShift] = useState(editEvent?.isNightShift || (initialCategory === 'On-Call 24h'));
  const [requiresPostCallRest, setRequiresPostCallRest] = useState(
    editEvent?.requiresPostCallRest || (initialCategory === 'On-Call 24h')
  );
  const [location, setLocation] = useState(editEvent?.location || '');
  const [notes, setNotes] = useState(editEvent?.notes || '');

  // Specific 24-Hour Call Option State
  const [is24hCall, setIs24hCall] = useState<boolean>(
    editEvent?.category === 'On-Call 24h' || initialCategory === 'On-Call 24h'
  );
  const [autoCreatePostCallRest, setAutoCreatePostCallRest] = useState<boolean>(true);

  // Sync state when initial Category or initial Date changes
  useEffect(() => {
    if (initialCategory === 'On-Call 24h') {
      enable24hCallMode();
    }
  }, [initialCategory]);

  if (!isOpen) return null;

  // Toggle or enable 24-Hour Call Mode
  const enable24hCallMode = () => {
    setIs24hCall(true);
    setCategory('On-Call 24h');
    setIsCallDuty(true);
    setIsNightShift(false);
    setRequiresPostCallRest(true);
    setPerson(familyNames.husband);
    if (!title || title === 'Hospital Duty Shift' || title.includes('24h')) {
      setTitle('Hospital On-Call Duty (Until 12 Midnight)');
    }
    setStartTime('08:00');
    setEndTime('00:00');
    setEndDate(startDate);
    if (!location) setLocation('Hospital Emergency Department & ED Cover');
  };

  const disable24hCallMode = () => {
    setIs24hCall(false);
    setEndDate(startDate);
    setEndTime('17:00');
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (is24hCall) {
      setEndDate(newStart);
    } else if (endDate < newStart) {
      setEndDate(newStart);
    }
  };

  const handleStartTimeChange = (newStartT: string) => {
    setStartTime(newStartT);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newEvent: ScheduleEvent = {
      id: editEvent?.id || `event-${Date.now()}`,
      title: title.trim(),
      person,
      category,
      startDate,
      startTime,
      endDate: is24hCall ? startDate : endDate,
      endTime: is24hCall ? '00:00' : endTime,
      isCallDuty: is24hCall ? true : isCallDuty,
      isNightShift: is24hCall ? false : isNightShift,
      requiresPostCallRest: is24hCall ? true : requiresPostCallRest,
      location,
      notes,
      source: editEvent?.source || 'manual'
    };

    const additionalEvents: ScheduleEvent[] = [];

    // If auto-creating companion post-call rest event for the next day
    const isCallType = is24hCall || isCallDuty || category === 'On-Call 24h' || category === 'Night Shift';
    if (isCallType && autoCreatePostCallRest) {
      const restDate = addDaysToDateStr(startDate, 1);
      additionalEvents.push({
        id: `post-call-rest-${Date.now()}`,
        title: 'Post-Call Sleep & Fatigue Recovery',
        person,
        category: 'Post-Call Rest',
        startDate: restDate,
        startTime: '08:30',
        endDate: restDate,
        endTime: '17:00',
        isCallDuty: false,
        isNightShift: false,
        requiresPostCallRest: true,
        location: 'Home / Recovery Rest',
        notes: `Mandatory sleep & fatigue recovery following on-call shift (${title})`,
        source: 'manual'
      });
    }

    onSave(newEvent, additionalEvents.length > 0 ? additionalEvents : undefined);
    onClose();
  };

  // Quick preset helper
  const applyPreset = (presetType: 'oncall' | 'lawyercall' | 'datenight' | 'pediatrician' | 'church' | 'custom') => {
    if (presetType === 'oncall') {
      enable24hCallMode();
    } else if (presetType === 'lawyercall') {
      disable24hCallMode();
      setTitle('Late Night US/UK Legal Conference Call');
      setPerson(familyNames.wife);
      setCategory('Late Night Call');
      setIsCallDuty(true);
      setIsNightShift(true);
      setStartTime('21:00');
      setEndTime('23:00');
      setLocation('Home Office (Zoom)');
    } else if (presetType === 'datenight') {
      disable24hCallMode();
      setTitle('Couple Date Night Dinner');
      setPerson('Family');
      setCategory('Date Night');
      setIsCallDuty(false);
      setIsNightShift(false);
      setStartTime('19:45');
      setEndTime('22:00');
      setLocation('Downtown Bistro');
      setNotes(`${familyNames.child.replace(/^(Dr\.|Mrs\.|Mr\.|Ms\.|Lawyer)\s+/i, '').split(' ')[0] || familyNames.child} in bed by 19:30. Nanny Maya on call.`);
    } else if (presetType === 'pediatrician') {
      disable24hCallMode();
      setTitle(`${familyNames.child.replace(/^(Dr\.|Mrs\.|Mr\.|Ms\.|Lawyer)\s+/i, '').split(' ')[0] || familyNames.child} Pediatrician Visit`);
      setPerson(familyNames.child);
      setCategory('Pediatrician');
      setStartTime('16:00');
      setEndTime('17:30');
      setLocation('KidCare Clinic');
    } else if (presetType === 'church') {
      disable24hCallMode();
      setTitle('Sunday Holy Mass & Catechism Class');
      setPerson('Family');
      setCategory('Church/Catechism');
      setIsCallDuty(false);
      setIsNightShift(false);
      setStartTime('09:00');
      setEndTime('11:30');
      setLocation('St. Mary Cathedral');
      setNotes('Weekly family church service and children catechism.');
    } else if (presetType === 'custom') {
      disable24hCallMode();
      setTitle('Custom Family Event');
      setPerson('Family');
      setCategory('Custom Event');
      setIsCallDuty(false);
      setIsNightShift(false);
      setStartTime('10:00');
      setEndTime('12:00');
      setLocation('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 via-sky-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Calendar className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {editEvent ? 'Edit Schedule Event' : 'Add New Event / Hospital Shift'}
              </h3>
              <p className="text-xs text-sky-200">
                Supports 24-hour doctor calls, lawyer court dates, and toddler commitments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 24-HOUR CALL PROMINENT MODE TOGGLE BANNER */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              is24hCall
                ? 'bg-red-50/90 border-red-300 ring-2 ring-red-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`p-2.5 rounded-xl ${
                    is24hCall ? 'bg-red-600 text-white shadow-md' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Stethoscope className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900">Hospital On-Call Duty (Until 12 Midnight)</h4>
                    {is24hCall && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-red-600 text-white rounded-full">
                        On-Call Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Runs until 12 midnight (00:00) &amp; automatically creates post-call rest the next day
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => (is24hCall ? disable24hCallMode() : enable24hCallMode())}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 ${
                  is24hCall
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {is24hCall ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4 text-red-600" />}
                <span>{is24hCall ? 'On-Call Selected' : 'Enable On-Call'}</span>
              </button>
            </div>

            {/* If Call Duty is selected, show details & companion rest checkbox */}
            {is24hCall && (
              <div className="mt-3.5 pt-3 border-t border-red-200/80 space-y-2 text-xs text-red-950">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white/80 p-2.5 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2 font-bold text-red-800">
                    <Clock className="w-4 h-4 text-red-600" />
                    <span>Calculated Shift Span:</span>
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-900">
                    {startDate} ({startTime}) ➔ {startDate} (00:00 Midnight)
                  </div>
                </div>

                {!editEvent && (
                  <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoCreatePostCallRest}
                      onChange={(e) => setAutoCreatePostCallRest(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                    />
                    <span className="font-semibold text-slate-800">
                      Auto-generate mandatory <strong className="text-amber-800">Post-Call Rest</strong> shift on {addDaysToDateStr(startDate, 1)} (08:30 - 16:00)
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Quick Presets */}
          {!editEvent && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Quick Fill Templates:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('oncall')}
                  className={`px-2.5 py-1 text-xs font-bold border rounded-lg transition-colors flex items-center gap-1 ${
                    is24hCall
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                  }`}
                >
                  <span>🩺 24h Doctor On-Call</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('lawyercall')}
                  className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  ⚖️ Late Lawyer Call
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('datenight')}
                  className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  💖 Couple Date Night
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('pediatrician')}
                  className="px-2.5 py-1 text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors"
                >
                  🧸 {familyNames.child.split(' ')[0]} Pediatrician
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('church')}
                  className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ⛪ Church / Catechism
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('custom')}
                  className="px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  ✨ Custom Event
                </button>
                {canUndo && onUndo && (
                  <button
                    type="button"
                    onClick={() => {
                      onUndo();
                    }}
                    className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1 shadow-xs"
                    title="Undo last schedule action"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Undo</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Event Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Event / Duty Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 24h Trauma Emergency Duty / High Court Hearing / Family Park Outing"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          {/* Person & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" /> Person / Family Member
              </label>
              <select
                value={person}
                onChange={(e) => setPerson(e.target.value as PersonType)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value={familyNames.husband}>🩺 {familyNames.husband} (Hospital Doctor)</option>
                <option value={familyNames.wife}>⚖️ {familyNames.wife}</option>
                <option value={familyNames.child}>🧸 {familyNames.child}</option>
                <option value="Family">👨‍👩‍👦 Family (Joint / Couple)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" /> Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as EventCategory;
                  setCategory(cat);
                  if (cat === 'On-Call 24h') {
                    enable24hCallMode();
                  } else if (is24hCall && (cat as string) !== 'On-Call 24h') {
                    setIs24hCall(false);
                  }
                }}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates and Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-600" /> Start Date &amp; Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="px-2.5 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                />
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="px-2.5 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-600" /> End Date &amp; Time
                </span>
                {is24hCall && (
                  <span className="text-[10px] text-red-600 font-extrabold">+1 Day (24 Hours)</span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  disabled={is24hCall}
                  value={is24hCall ? addDaysToDateStr(startDate, 1) : endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`px-2.5 py-2 text-xs border rounded-xl font-medium ${
                    is24hCall ? 'bg-red-50 text-red-900 border-red-300 font-bold' : 'bg-white border-slate-300'
                  }`}
                />
                <input
                  type="time"
                  required
                  disabled={is24hCall}
                  value={is24hCall ? startTime : endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`px-2.5 py-2 text-xs border rounded-xl font-medium ${
                    is24hCall ? 'bg-red-50 text-red-900 border-red-300 font-bold' : 'bg-white border-slate-300'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Checkbox Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label
              className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs transition-colors ${
                isCallDuty ? 'bg-sky-50/80 border-sky-300 font-bold text-sky-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isCallDuty}
                onChange={(e) => setIsCallDuty(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Hospital On-Call Duty</span>
            </label>

            <label
              className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs transition-colors ${
                isNightShift ? 'bg-indigo-50/80 border-indigo-300 font-bold text-indigo-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isNightShift}
                onChange={(e) => setIsNightShift(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Night / Overnight Shift</span>
            </label>

            <label
              className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs transition-colors ${
                requiresPostCallRest ? 'bg-amber-50/80 border-amber-300 font-bold text-amber-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={requiresPostCallRest}
                onChange={(e) => setRequiresPostCallRest(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span>Needs Post-Call Rest</span>
            </label>
          </div>

          {/* Location & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> Location / Hospital Unit
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Ward 7A / Emergency ED / High Court"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes / Context
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Nanny Maya babysitting, or grand rounds cover"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 text-xs font-extrabold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 ${
                is24hCall ? 'bg-red-600 hover:bg-red-700' : 'bg-sky-600 hover:bg-sky-700'
              }`}
            >
              {is24hCall && <Stethoscope className="w-4 h-4" />}
              <span>
                {editEvent
                  ? 'Save Changes'
                  : is24hCall
                  ? 'Add 24h Hospital Call Event'
                  : 'Add Event to Calendar'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

