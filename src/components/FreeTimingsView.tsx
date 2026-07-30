import React, { useState } from 'react';
import { FreeSlot, ScheduleEvent, FamilyNames } from '../types';
import { Sparkles, Calendar, Heart, Sun, Bed, Zap, Clock, CheckCircle, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  freeSlots: FreeSlot[];
  onAddFreeSlotToCalendar: (slot: FreeSlot) => void;
  familyNames: FamilyNames;
}

export const FreeTimingsView: React.FC<Props> = ({
  freeSlots,
  onAddFreeSlotToCalendar,
  familyNames
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());

  // Filter slots to strictly Quality Family Time and Couple Date Nights only
  const availableFreeSlots = freeSlots.filter(
    (slot) => slot.type === 'couple_date' || slot.type === 'quality_family'
  );

  const getCleanFirstName = (name: string) => {
    if (!name) return '';
    const cleaned = name.replace(/^(Dr\.|Mrs\.|Mr\.|Ms\.|Lawyer)\s+/i, '');
    return cleaned.split(' ')[0] || name;
  };

  const surenName = getCleanFirstName(familyNames.husband) || 'Suren';
  const nicoleName = getCleanFirstName(familyNames.wife) || 'Nicole';
  const gerardName = getCleanFirstName(familyNames.child) || 'Gerard';

  const handleLockIn = (slot: FreeSlot) => {
    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    const nextLocked = new Set(lockedIds);
    nextLocked.add(slot.id);
    setLockedIds(nextLocked);

    onAddFreeSlotToCalendar(slot);
  };

  const filteredSlots = availableFreeSlots.filter((slot) => {
    if (filterType === 'all') return true;
    return slot.type === filterType;
  });

  const coupleCount = availableFreeSlots.filter((s) => s.type === 'couple_date').length;
  const familyCount = availableFreeSlots.filter((s) => s.type === 'quality_family').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Smart Free Time & Overlap Finder</span>
            </div>
            <h2 className="text-xl font-black">Available Free Timings (Couple Dates & Family Time)</h2>
            <p className="text-xs text-emerald-100 max-w-2xl mt-1">
              Automatically calculated overlap windows where {surenName}&apos;s hospital shifts are clear, {nicoleName}&apos;s late night calls are quiet, and 2yo {gerardName} is resting or at nursery.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/15 text-center">
              <div className="text-lg font-black text-emerald-300">{availableFreeSlots.length}</div>
              <div className="text-[10px] text-slate-200 uppercase tracking-wide">Free Windows</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/15 text-center">
              <div className="text-lg font-black text-rose-300">
                {coupleCount}
              </div>
              <div className="text-[10px] text-slate-200 uppercase tracking-wide">Date Nights</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
            filterType === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Free Timings ({availableFreeSlots.length})
        </button>

        <button
          onClick={() => setFilterType('couple_date')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            filterType === 'couple_date'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>💖 Couple Date Nights ({surenName} &amp; {nicoleName}) ({coupleCount})</span>
        </button>

        <button
          onClick={() => setFilterType('quality_family')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            filterType === 'quality_family'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>👨‍👩‍👦 Quality Family Outings ({surenName}, {nicoleName} &amp; {gerardName}) ({familyCount})</span>
        </button>
      </div>

      {/* Slots Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSlots.map((slot) => {
          const isLocked = lockedIds.has(slot.id);

          return (
            <div
              key={slot.id}
              className={`bg-white rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                slot.type === 'couple_date'
                  ? 'border-rose-200 bg-gradient-to-br from-white to-rose-50/30'
                  : slot.type === 'quality_family'
                  ? 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Badge Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      slot.type === 'couple_date'
                        ? 'bg-rose-100 text-rose-800'
                        : slot.type === 'quality_family'
                        ? 'bg-emerald-100 text-emerald-800'
                        : slot.type === 'doctor_solo_rest'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {slot.type === 'couple_date' && '💖 Couple Date Night'}
                    {slot.type === 'quality_family' && '👨‍👩‍👦 Quality Family Time'}
                    {slot.type === 'doctor_solo_rest' && '🩺 Doctor Sleep Recovery'}
                    {slot.type === 'lawyer_solo_rest' && '🌿 Lawyer Solo Wellness'}
                  </span>

                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <span>★ {slot.score}/10 Match</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 mb-1">{slot.title}</h3>

                {/* Time & Date */}
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 my-2.5 bg-slate-100/70 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{slot.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {slot.startTime} - {slot.endTime} ({slot.durationHours} hrs)
                    </span>
                  </div>
                </div>

                {/* Reason Explanation */}
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {slot.reason}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isLocked ? '✓ Locked in Calendar' : 'Recommended by Gemini AI'}
                </span>

                <button
                  onClick={() => handleLockIn(slot)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 ${
                    isLocked
                      ? 'bg-emerald-600 text-white'
                      : slot.type === 'couple_date'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isLocked ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Scheduled & Locked</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Lock in Calendar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
