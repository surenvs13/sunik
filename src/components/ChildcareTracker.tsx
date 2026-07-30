import React from 'react';
import { ChildcareGap, ScheduleEvent, FamilyNames } from '../types';
import { ShieldAlert, CheckCircle2, User, Clock, AlertTriangle, Lightbulb, Users } from 'lucide-react';

interface Props {
  childcareGaps: ChildcareGap[];
  events: ScheduleEvent[];
  familyNames: FamilyNames;
}

export const ChildcareTracker: React.FC<Props> = ({ childcareGaps, events, familyNames }) => {
  const childShortName = familyNames.child.replace(/^(Dr\.|Mrs\.|Mr\.|Ms\.|Lawyer)\s+/i, '').split(' ')[0] || familyNames.child;

  // Extract all events involving child
  const childEvents = events.filter((e) => e.person === familyNames.child || e.person.toLowerCase().includes('gerard') || e.category === 'Nursery/Daycare');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>Toddler {familyNames.child} Coverage Radar</span>
            </div>
            <h2 className="text-xl font-black">Childcare Coverage & Shift Conflict Detector</h2>
            <p className="text-xs text-sky-100 max-w-2xl mt-1">
              Monitors non-nursery hours, doctor hospital on-call shifts & lawyer late-night client calls to ensure {childShortName} always has active parental or nanny coverage.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/15">
            <div className="text-center">
              <div className="text-xl font-black text-amber-300">{childcareGaps.length}</div>
              <div className="text-[10px] text-slate-200">Shift Overlaps</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-xl font-black text-cyan-300">Mon - Fri</div>
              <div className="text-[10px] text-slate-200">Nursery 8:30-17:00</div>
            </div>
          </div>
        </div>
      </div>

      {/* Childcare Gap Alerts */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Detected Childcare Coverage Gaps & Solutions ({childcareGaps.length})</span>
        </h3>

        {childcareGaps.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold text-sm">All Shift Windows Fully Covered!</h4>
            <p className="text-xs text-emerald-700 mt-1">
              No overlapping hospital on-call duties & lawyer calls found for non-nursery hours.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {childcareGaps.map((gap, idx) => (
              <div
                key={gap.id || idx}
                className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-full border border-amber-300">
                      🚨 High Priority Shift Conflict
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      📅 {gap.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 my-2">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Time Window: {gap.startTime} - {gap.endTime}</span>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 my-2">
                    <div className="font-semibold mb-0.5 text-amber-900">Conflict Reason:</div>
                    <p className="text-slate-700">{gap.conflictReason}</p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 mt-3">
                  <div className="font-bold text-emerald-900 flex items-center gap-1 mb-0.5">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Recommended AI Solution:</span>
                  </div>
                  <p className="text-emerald-800">{gap.recommendedSolution}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2yo Gerard Schedule Routine Breakdown */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-600" />
          <span>{childShortName}'s Scheduled Nursery & Activity Routine</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3.5 text-xs">
            <div className="font-bold text-cyan-950 flex items-center gap-1">
              🏫 Sunshine Nursery
            </div>
            <div className="text-cyan-800 mt-1 font-medium">Mon - Fri: 08:30 - 17:00</div>
            <p className="text-[11px] text-cyan-700 mt-1">Both parents free to focus on hospital wards & court hearings.</p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-xs">
            <div className="font-bold text-indigo-950 flex items-center gap-1">
              🌙 Evening Bedtime Routine
            </div>
            <div className="text-indigo-800 mt-1 font-medium">Daily: 19:30 - 20:30</div>
            <p className="text-[11px] text-indigo-700 mt-1">Bedtime story & sleep. Unlocks parents' evening date window.</p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs">
            <div className="font-bold text-emerald-950 flex items-center gap-1">
              ⚽ Weekend Play & Gym
            </div>
            <div className="text-emerald-800 mt-1 font-medium">Sat / Sun Mornings</div>
            <p className="text-[11px] text-emerald-700 mt-1">Little Gym & Botanical park visits for toddler energy discharge.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
