import React, { useState } from 'react';
import { ActivityLogItem, FamilyNames } from '../types';
import { 
  History, 
  Undo2, 
  Trash2, 
  PlusCircle, 
  Edit3, 
  Sparkles, 
  Calendar, 
  Clock, 
  User, 
  RotateCcw, 
  Filter, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface Props {
  activityLogs: ActivityLogItem[];
  onUndo: () => void;
  canUndo: boolean;
  onUndoSpecificLog?: (logId: string) => void;
  onClearHistory: () => void;
  familyNames: FamilyNames;
}

export const HistoryLogView: React.FC<Props> = ({
  activityLogs,
  onUndo,
  canUndo,
  onUndoSpecificLog,
  onClearHistory,
  familyNames
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'ADD' | 'DELETE' | 'EDIT' | 'BATCH_ADD'>('ALL');
  const [toastMessage, setToastMessage] = useState('');

  const filteredLogs = activityLogs.filter((log) => {
    if (filterType === 'ALL') return true;
    return log.actionType === filterType;
  });

  const handleTriggerUndo = () => {
    if (!canUndo) return;
    onUndo();
    setToastMessage('Successfully undone last calendar action!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleTriggerUndoLog = (logId: string) => {
    if (onUndoSpecificLog) {
      onUndoSpecificLog(logId);
      setToastMessage('Reverted schedule to state prior to selected activity!');
      setTimeout(() => setToastMessage(''), 3000);
    } else {
      handleTriggerUndo();
    }
  };

  const getActionBadge = (actionType: ActivityLogItem['actionType']) => {
    switch (actionType) {
      case 'ADD':
        return (
          <span className="px-2.5 py-1 text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full flex items-center gap-1 shrink-0">
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Event Added</span>
          </span>
        );
      case 'DELETE':
        return (
          <span className="px-2.5 py-1 text-[11px] font-black bg-red-100 text-red-800 border border-red-300 rounded-full flex items-center gap-1 shrink-0">
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>Event Cancelled / Deleted</span>
          </span>
        );
      case 'EDIT':
        return (
          <span className="px-2.5 py-1 text-[11px] font-black bg-sky-100 text-sky-800 border border-sky-300 rounded-full flex items-center gap-1 shrink-0">
            <Edit3 className="w-3.5 h-3.5 text-sky-600" />
            <span>Event Modified</span>
          </span>
        );
      case 'BATCH_ADD':
        return (
          <span className="px-2.5 py-1 text-[11px] font-black bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-full flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Batch Imported</span>
          </span>
        );
      case 'RESET':
        return (
          <span className="px-2.5 py-1 text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 rounded-full flex items-center gap-1 shrink-0">
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Roster Reset</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-bold animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-200 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-500/20 rounded-2xl border border-indigo-400/30 text-indigo-300">
            <History className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Activity History &amp; Reversion Log</h2>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 rounded-full border border-indigo-400/30">
                Full Audit Trail
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Track, inspect, or undo any added, cancelled, or modified roster events for {familyNames.husband}, {familyNames.wife} &amp; {familyNames.child}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleTriggerUndo}
            disabled={!canUndo}
            className="px-4 py-2.5 text-xs font-black text-slate-900 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:hover:bg-emerald-400 rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <Undo2 className="w-4 h-4 text-slate-950" />
            <span>Undo Last Action</span>
          </button>

          {activityLogs.length > 0 && (
            <button
              onClick={onClearHistory}
              className="px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Clear Activity Log History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Log Summary */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <span className="text-xs font-bold text-slate-600 mr-1 shrink-0">Filter:</span>

          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all shrink-0 ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Activity ({activityLogs.length})
          </button>

          <button
            onClick={() => setFilterType('ADD')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all shrink-0 ${
              filterType === 'ADD'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Added ({activityLogs.filter((l) => l.actionType === 'ADD').length})
          </button>

          <button
            onClick={() => setFilterType('DELETE')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all shrink-0 ${
              filterType === 'DELETE'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-800 hover:bg-red-100'
            }`}
          >
            Cancelled / Deleted ({activityLogs.filter((l) => l.actionType === 'DELETE').length})
          </button>

          <button
            onClick={() => setFilterType('EDIT')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all shrink-0 ${
              filterType === 'EDIT'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
            }`}
          >
            Modified ({activityLogs.filter((l) => l.actionType === 'EDIT').length})
          </button>

          <button
            onClick={() => setFilterType('BATCH_ADD')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all shrink-0 ${
              filterType === 'BATCH_ADD'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            Imports ({activityLogs.filter((l) => l.actionType === 'BATCH_ADD').length})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-800 font-bold">{filteredLogs.length}</strong> log entries
        </div>
      </div>

      {/* Activity Timeline List */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="p-4 bg-slate-100 rounded-2xl w-fit mx-auto text-slate-400">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800">No Activity Logs Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activityLogs.length === 0
              ? 'Any event you add, modify, or cancel will be recorded here so you can review changes and undo actions at any time.'
              : 'No activity matches the selected filter. Try selecting "All Activity".'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xl hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5">{getActionBadge(log.actionType)}</div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-black text-slate-900">{log.description}</h4>
                    {log.affectedPerson && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        {log.affectedPerson}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                    {log.eventTitle && (
                      <span className="font-semibold text-slate-800">📌 Event: {log.eventTitle}</span>
                    )}
                    {log.eventDate && (
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {log.eventDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side controls & Timestamp */}
              <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{log.timestamp}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleTriggerUndoLog(log.id)}
                  className="px-3 py-1.5 text-xs font-black bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-700 rounded-xl border border-slate-300 hover:border-emerald-600 transition-all flex items-center gap-1.5 shadow-xs"
                  title="Revert calendar state prior to this action"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo Action</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
