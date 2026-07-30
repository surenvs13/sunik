import React from 'react';
import { FamilyNames } from '../types';
import { 
  Stethoscope, 
  Scale, 
  Baby, 
  Calendar, 
  Sparkles, 
  ShieldAlert, 
  Clock, 
  Upload, 
  Heart,
  RotateCcw,
  User,
  Edit3,
  History,
  Undo2,
  Trash2
} from 'lucide-react';

interface Props {
  activeTab: 'calendar' | 'freetimings' | 'import' | 'history' | 'childcare';
  setActiveTab: (tab: 'calendar' | 'freetimings' | 'import' | 'history' | 'childcare') => void;
  onResetData: () => void;
  onDeleteAllEvents?: () => void;
  eventCount: number;
  freeSlotsCount: number;
  gapsCount: number;
  onCallCount: number;
  historyLogsCount?: number;
  canUndo?: boolean;
  onUndo?: () => void;
  familyNames: FamilyNames;
  onOpenEditNames: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  onResetData,
  onDeleteAllEvents,
  eventCount,
  freeSlotsCount,
  gapsCount,
  onCallCount,
  historyLogsCount,
  canUndo,
  onUndo,
  familyNames,
  onOpenEditNames
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      {/* Top Brand & Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand Logo & Description */}
        <div className="flex items-center gap-3">
          <div className="flex items-center -space-x-1.5">
            <div className="p-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <Baby className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white">MedFamily Sync</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-full">
                AI Roster Sync
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Hospital Doctor & Lawyer Family Monthly Roster Alignment
            </p>
          </div>
        </div>

        {/* Quick Stats Pills & Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Edit Family Names Button */}
          <button
            onClick={onOpenEditNames}
            className="bg-slate-800 hover:bg-slate-700/90 px-3 py-1.5 rounded-xl border border-sky-500/40 hover:border-sky-400 flex items-center gap-2 text-xs transition-all shadow-xs cursor-pointer group"
            title="Click to Edit Family Member Names"
          >
            <User className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-white">
              {familyNames.husband} &amp; {familyNames.wife} ({familyNames.child})
            </span>
            <span className="ml-1 px-2 py-0.5 text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/40 rounded-md flex items-center gap-1 group-hover:bg-sky-500 group-hover:text-white transition-all">
              <Edit3 className="w-2.5 h-2.5" />
              Edit Names
            </span>
          </button>

          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center gap-2">
            <Stethoscope className="w-3.5 h-3.5 text-red-400" />
            <div className="text-xs">
              <span className="font-bold text-white">{onCallCount}</span>
              <span className="text-slate-400 text-[11px] ml-1">On-Call Shifts</span>
            </div>
          </div>

          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-emerald-400" />
            <div className="text-xs">
              <span className="font-bold text-white">{freeSlotsCount}</span>
              <span className="text-slate-400 text-[11px] ml-1">Free Windows</span>
            </div>
          </div>

          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <div className="text-xs">
              <span className="font-bold text-white">{gapsCount}</span>
              <span className="text-slate-400 text-[11px] ml-1">Overlap Gaps</span>
            </div>
          </div>

          {canUndo && onUndo && (
            <button
              onClick={onUndo}
              className="px-3 py-1.5 text-xs font-black text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all flex items-center gap-1.5 shadow-md border border-emerald-300"
              title="Undo Last Schedule Change"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo Action</span>
            </button>
          )}

          {onDeleteAllEvents && (
            <button
              onClick={onDeleteAllEvents}
              disabled={eventCount === 0}
              className="p-2 text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors text-xs flex items-center gap-1 border border-rose-800/60"
              title="Delete All Calendar Events"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline font-bold">Delete All</span>
            </button>
          )}

          <button
            onClick={onResetData}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1 border border-slate-700"
            title="Reset to Sample Roster Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="bg-slate-950/80 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-2.5 px-4 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'calendar'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>🗓️ Monthly Calendar ({eventCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('freetimings')}
            className={`py-2.5 px-4 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'freetimings'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>⚡ Available Free Timings ({freeSlotsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`py-2.5 px-4 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'import'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>📥 Import PDF/Excel Roster & WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-4 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>📜 Activity History Log ({historyLogsCount ?? 0})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
