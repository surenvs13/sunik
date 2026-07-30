import React, { useState } from 'react';
import { ScheduleEvent, FamilyNames } from '../types';
import { SAMPLE_WHATSAPP_CHAT_TEXT } from '../data/initialData';
import { ensurePostCallRestForEvents } from '../utils/rosterUtils';
import { 
  MessageSquare, 
  Sparkles, 
  X, 
  Check, 
  Loader2, 
  AlertCircle, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Edit2, 
  ArrowRight,
  Scissors
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddEvents: (events: ScheduleEvent[]) => void;
  familyNames: FamilyNames;
}

// Helper to calculate list of date strings YYYY-MM-DD between start and end (inclusive)
const getDaysBetween = (startStr: string, endStr: string): string[] => {
  if (!startStr || !endStr) return [startStr];
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [startStr];

  const dates: string[] = [];
  const curr = new Date(start);
  while (curr <= end) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

export const WhatsAppParserModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAddEvents,
  familyNames
}) => {
  const [chatText, setChatText] = useState('');
  const [referenceMonthYear, setReferenceMonthYear] = useState('2026-08');
  const [isParsing, setIsParsing] = useState(false);
  const [extractedEvents, setExtractedEvents] = useState<ScheduleEvent[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!chatText.trim()) {
      setErrorMessage('Please paste or type WhatsApp chat text to parse.');
      return;
    }

    setIsParsing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/parse-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatText,
          referenceMonthYear,
          familyNames
        }),
      });

      const json = await res.json();

      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to parse WhatsApp chat.');
      }

      const parsed: ScheduleEvent[] = (json.data.events || []).map((ev: any, idx: number) => {
        const start = ev.startDate || `${referenceMonthYear}-01`;
        const isCall = Boolean(ev.isCallDuty) || ev.category === 'On-Call 24h' || ev.category === 'Night Shift';
        // For 24h call duty, enforce endDate = start so call duty is strictly reflected on the call day in calendar!
        const end = isCall ? start : (ev.endDate || start);
        return {
          id: `extracted-wa-${Date.now()}-${idx}`,
          title: ev.title || 'Family Commitment',
          person: ev.person || (isCall ? familyNames.husband : familyNames.wife),
          category: ev.category || (isCall ? 'On-Call 24h' : 'Court Hearing'),
          startDate: start,
          startTime: ev.startTime || (isCall ? '08:30' : '09:00'),
          endDate: end,
          endTime: ev.endTime || (isCall ? '08:30' : '17:00'),
          isCallDuty: isCall,
          isNightShift: Boolean(ev.isNightShift) || isCall,
          requiresPostCallRest: Boolean(ev.requiresPostCallRest) || isCall,
          location: ev.location || '',
          notes: ev.notes || '',
          source: 'wife_whatsapp'
        };
      });

      const withRest = ensurePostCallRestForEvents(parsed, familyNames.husband);

      setExtractedEvents(withRest);
      setSelectedIds(new Set(withRest.map((p) => p.id)));

      const multiDayCount = withRest.filter((p) => p.startDate !== p.endDate).length;
      if (multiDayCount > 0) {
        setSuccessMessage(`Extracted ${withRest.length} schedule items (including ${multiDayCount} multi-day date range events and post-call rest)!`);
      } else {
        setSuccessMessage(`Successfully extracted ${withRest.length} schedule items and post-call rest windows!`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error parsing chat text with AI.');
    } finally {
      setIsParsing(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Update dates for a specific event
  const handleUpdateDates = (eventId: string, newStartDate: string, newEndDate: string) => {
    setExtractedEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const validEnd = newEndDate < newStartDate ? newStartDate : newEndDate;
        return {
          ...ev,
          startDate: newStartDate,
          endDate: validEnd,
        };
      })
    );
  };

  // Extend an event date range by X days
  const handleExtendRange = (eventId: string, daysCount: number) => {
    setExtractedEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const start = new Date(ev.startDate);
        if (isNaN(start.getTime())) return ev;

        const end = new Date(start);
        end.setDate(end.getDate() + (daysCount - 1));
        const endStr = end.toISOString().split('T')[0];

        return {
          ...ev,
          endDate: endStr,
        };
      })
    );
  };

  // Expand a single multi-day event into distinct daily entries
  const handleExpandEventToDaily = (eventId: string) => {
    const target = extractedEvents.find((e) => e.id === eventId);
    if (!target) return;

    const days = getDaysBetween(target.startDate, target.endDate);
    if (days.length <= 1) return;

    const newDailyEvents: ScheduleEvent[] = days.map((dayStr, idx) => ({
      ...target,
      id: `${target.id}-day-${idx}-${Date.now()}`,
      title: `${target.title} (Day ${idx + 1} of ${days.length})`,
      startDate: dayStr,
      endDate: dayStr,
      notes: target.notes ? `${target.notes} [Part of ${days.length}-day series]` : `Day ${idx + 1} of ${days.length}-day event range`
    }));

    setExtractedEvents((prev) => {
      const result: ScheduleEvent[] = [];
      prev.forEach((item) => {
        if (item.id === eventId) {
          result.push(...newDailyEvents);
        } else {
          result.push(item);
        }
      });
      return result;
    });

    // Keep newly expanded items selected
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      newDailyEvents.forEach((e) => next.add(e.id));
      return next;
    });

    setSuccessMessage(`Expanded "${target.title}" into ${days.length} individual daily calendar entries!`);
  };

  // Global expand all multi-day events into daily entries
  const handleExpandAllMultiDay = () => {
    let totalCreated = 0;
    const nextList: ScheduleEvent[] = [];
    const nextSelected = new Set<string>();

    extractedEvents.forEach((ev) => {
      const days = getDaysBetween(ev.startDate, ev.endDate);
      if (days.length > 1) {
        days.forEach((dayStr, idx) => {
          totalCreated++;
          const newId = `${ev.id}-daily-${idx}-${Date.now()}`;
          nextList.push({
            ...ev,
            id: newId,
            title: `${ev.title} (Day ${idx + 1}/${days.length})`,
            startDate: dayStr,
            endDate: dayStr,
          });
          if (selectedIds.has(ev.id)) {
            nextSelected.add(newId);
          }
        });
      } else {
        nextList.push(ev);
        if (selectedIds.has(ev.id)) {
          nextSelected.add(ev.id);
        }
      }
    });

    setExtractedEvents(nextList);
    setSelectedIds(nextSelected);
    setSuccessMessage(`Expanded all multi-day ranges into ${totalCreated} individual daily entries!`);
  };

  const handleConfirmImport = () => {
    const toImport = extractedEvents.filter((e) => selectedIds.has(e.id));
    if (toImport.length === 0) return;

    onAddEvents(toImport);
    setSuccessMessage(`Added ${toImport.length} events to your main calendar!`);
    setTimeout(() => {
      onClose();
      setExtractedEvents([]);
      setSelectedIds(new Set());
      setSuccessMessage('');
    }, 1200);
  };

  const loadSample = () => {
    setChatText(SAMPLE_WHATSAPP_CHAT_TEXT);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const multiDayItemsCount = extractedEvents.filter((e) => e.startDate !== e.endDate).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-2xl border border-emerald-400/30 text-emerald-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>WhatsApp Chat Schedule Parser</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-500/30 text-emerald-300 rounded-full border border-emerald-400/30">
                  Multi-Day &amp; Range Support
                </span>
              </h3>
              <p className="text-xs text-emerald-200">
                Extract court dates, late-night lawyer calls, multi-day trials &amp; toddler camps from chat messages
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

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-700">Target Month:</span>
              <input
                type="month"
                value={referenceMonthYear}
                onChange={(e) => setReferenceMonthYear(e.target.value)}
                className="bg-white text-slate-800 text-xs px-3 py-1.5 rounded-xl border border-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={loadSample}
              className="px-3 py-1.5 text-xs font-extrabold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Load Sample Chat with Date Ranges</span>
            </button>
          </div>

          {/* Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Paste WhatsApp Chat Messages</span>
              </label>
              {chatText.length > 0 && (
                <button
                  onClick={() => setChatText('')}
                  className="text-[11px] font-semibold text-slate-400 hover:text-red-500"
                >
                  Clear text
                </button>
              )}
            </div>

            <textarea
              rows={4}
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="e.g. 'Nicole: High Court Trial from Aug 10 to Aug 14 09:00-16:00. Gerard toddler camp Aug 24-28. Late calls on Aug 18, 19, and 20 from 9pm to 11pm.'"
              className="w-full px-4 py-3 text-xs border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono bg-slate-50/50"
            />
          </div>

          {/* Parse Button */}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={isParsing || !chatText.trim()}
              onClick={handleParse}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Gemini AI Extracting Multi-Day Roster &amp; Schedule...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Schedule &amp; Ranges with Gemini AI</span>
                </>
              )}
            </button>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Extracted Events Preview */}
          {extractedEvents.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span>Extracted Schedule Preview ({extractedEvents.length})</span>
                    {multiDayItemsCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full flex items-center gap-1">
                        <Layers className="w-3 h-3 text-amber-600" />
                        {multiDayItemsCount} Multi-Day Range Spans
                      </span>
                    )}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {multiDayItemsCount > 0 && (
                    <button
                      type="button"
                      onClick={handleExpandAllMultiDay}
                      className="px-2.5 py-1 text-[11px] font-extrabold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors flex items-center gap-1"
                      title="Split all multi-day date range events into separate single-day calendar entries"
                    >
                      <Scissors className="w-3.5 h-3.5 text-amber-600" />
                      <span>Split All Spans into Daily Entries</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedIds(new Set(extractedEvents.map((e) => e.id)))}
                    className="text-[11px] font-bold text-emerald-700 hover:underline px-1"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-[11px] font-bold text-slate-500 hover:underline px-1"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                {extractedEvents.map((ev) => {
                  const isSel = selectedIds.has(ev.id);
                  const isMultiDay = ev.startDate !== ev.endDate;
                  const daysSpan = getDaysBetween(ev.startDate, ev.endDate).length;
                  const isEditing = editingEventId === ev.id;

                  return (
                    <div
                      key={ev.id}
                      className={`p-3.5 rounded-2xl border text-xs transition-all ${
                        isSel
                          ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400'
                          : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 grow">
                          <button
                            type="button"
                            onClick={() => toggleSelect(ev.id)}
                            className={`w-5 h-5 mt-0.5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                              isSel
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white hover:border-emerald-400'
                            }`}
                          >
                            {isSel && <Check className="w-3.5 h-3.5" />}
                          </button>

                          <div className="grow space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-900 text-xs">{ev.title}</span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {ev.category}
                              </span>
                              {isMultiDay ? (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                  <Layers className="w-3 h-3 text-amber-600" />
                                  <span>{daysSpan} Days Range ({ev.startDate} ➔ {ev.endDate})</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                                  Single Day
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-600 flex items-center gap-2 flex-wrap">
                              <span>👤 <strong>{ev.person}</strong></span>
                              <span>•</span>
                              <span>⏰ {ev.startTime} - {ev.endTime}</span>
                              {ev.location && (
                                <>
                                  <span>•</span>
                                  <span>📍 {ev.location}</span>
                                </>
                              )}
                            </div>

                            {/* Interactive Date Range Editor */}
                            <div className="mt-2 pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-500">Date Range:</span>

                              <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200">
                                <input
                                  type="date"
                                  value={ev.startDate}
                                  onChange={(e) => handleUpdateDates(ev.id, e.target.value, ev.endDate)}
                                  className="text-[11px] font-mono text-slate-800 focus:outline-none"
                                />
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <input
                                  type="date"
                                  value={ev.endDate}
                                  onChange={(e) => handleUpdateDates(ev.id, ev.startDate, e.target.value)}
                                  className="text-[11px] font-mono text-slate-800 focus:outline-none"
                                />
                              </div>

                              {/* Quick Preset Extensions */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleExtendRange(ev.id, 3)}
                                  className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors"
                                  title="Set event duration to 3 days"
                                >
                                  +3 Days
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExtendRange(ev.id, 5)}
                                  className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors"
                                  title="Set event duration to 5 days (Mon-Fri)"
                                >
                                  +5 Days
                                </button>

                                {isMultiDay && (
                                  <button
                                    type="button"
                                    onClick={() => handleExpandEventToDaily(ev.id)}
                                    className="px-2.5 py-0.5 text-[10px] font-extrabold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg border border-amber-300 transition-colors flex items-center gap-1"
                                    title="Split this range into individual single-day entries on calendar"
                                  >
                                    <Scissors className="w-3 h-3 text-amber-700" />
                                    <span>Split into {daysSpan} Daily Entries</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confirm Import */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <div className="text-xs text-slate-500 font-medium">
                  Selected <strong className="text-emerald-700 font-bold">{selectedIds.size}</strong> items to add
                </div>

                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={handleConfirmImport}
                  className="px-6 py-2.5 text-xs font-black text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-40 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add {selectedIds.size} Selected Items to Main Calendar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
