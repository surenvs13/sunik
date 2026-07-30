import React, { useState, useEffect } from 'react';
import { ScheduleEvent, FreeSlot, ChildcareGap, AIAnalysisResult, FamilyNames, EventCategory, ActivityLogItem } from './types';
import { INITIAL_EVENTS, INITIAL_FREE_SLOTS, INITIAL_CHILDCARE_GAPS, INITIAL_FAMILY_NAMES } from './data/initialData';
import { ensurePostCallRestForEvents } from './utils/rosterUtils';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { FreeTimingsView } from './components/FreeTimingsView';
import { ImportSection } from './components/ImportSection';
import { HistoryLogView } from './components/HistoryLogView';
import { ChildcareTracker } from './components/ChildcareTracker';
import { AddEventModal } from './components/AddEventModal';
import { EditFamilyModal } from './components/EditFamilyModal';
import { WhatsAppParserModal } from './components/WhatsAppParserModal';
import { Trash2 } from 'lucide-react';

export default function App() {
  // Family Names state with LocalStorage Persistence
  const [familyNames, setFamilyNames] = useState<FamilyNames>(() => {
    const saved = localStorage.getItem('sunik_names') || localStorage.getItem('medfamily_names');
    return saved ? JSON.parse(saved) : INITIAL_FAMILY_NAMES;
  });

  // Main Events State with LocalStorage Persistence
  const [events, setEvents] = useState<ScheduleEvent[]>(() => {
    const saved = localStorage.getItem('sunik_events') || localStorage.getItem('medfamily_events');
    const parsed = saved ? JSON.parse(saved) : INITIAL_EVENTS;
    return ensurePostCallRestForEvents(parsed, familyNames.husband);
  });

  // Activity Log State with LocalStorage Persistence
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() => {
    const saved = localStorage.getItem('sunik_activity_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'initial-log-1',
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        actionType: 'BATCH_ADD',
        description: 'Initialized August 2026 Sample Roster & Schedule',
        affectedPerson: 'Family',
        eventTitle: 'August 2026 Roster',
        eventDate: '2026-08-01',
        previousEventsSnapshot: INITIAL_EVENTS
      }
    ];
  });

  // Undo Stack State (snapshots of events prior to mutations)
  const [undoStack, setUndoStack] = useState<ScheduleEvent[][]>([]);

  // Free Slots State
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>(() => {
    const saved = localStorage.getItem('sunik_free_slots') || localStorage.getItem('medfamily_free_slots');
    return saved ? JSON.parse(saved) : INITIAL_FREE_SLOTS;
  });

  // Childcare Gaps State
  const [childcareGaps, setChildcareGaps] = useState<ChildcareGap[]>(() => {
    const saved = localStorage.getItem('sunik_gaps') || localStorage.getItem('medfamily_gaps');
    return saved ? JSON.parse(saved) : INITIAL_CHILDCARE_GAPS;
  });

  // AI Advisor Analysis State
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Active Tab: 'calendar' | 'freetimings' | 'import' | 'history' | 'childcare'
  const [activeTab, setActiveTab] = useState<'calendar' | 'freetimings' | 'import' | 'history' | 'childcare'>('calendar');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditNamesModalOpen, setIsEditNamesModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);
  const [modalInitialCategory, setModalInitialCategory] = useState<EventCategory | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('sunik_names', JSON.stringify(familyNames));
  }, [familyNames]);

  useEffect(() => {
    localStorage.setItem('sunik_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('sunik_activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('sunik_free_slots', JSON.stringify(freeSlots));
  }, [freeSlots]);

  useEffect(() => {
    localStorage.setItem('sunik_gaps', JSON.stringify(childcareGaps));
  }, [childcareGaps]);

  // Record an action before modifying events
  const recordAction = (
    actionType: ActivityLogItem['actionType'],
    description: string,
    affectedPerson?: string,
    eventTitle?: string,
    eventDate?: string
  ) => {
    setUndoStack((prev) => [...prev, events]);
    const newLog: ActivityLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      actionType,
      description,
      affectedPerson,
      eventTitle,
      eventDate,
      previousEventsSnapshot: events
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Undo Handler
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousEvents = undoStack[undoStack.length - 1];
      setEvents(previousEvents);
      setUndoStack((prev) => prev.slice(0, -1));
      
      const undoLog: ActivityLogItem = {
        id: `log-undo-${Date.now()}`,
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        actionType: 'RESET',
        description: 'Undid last schedule addition or cancellation',
        affectedPerson: 'System',
        previousEventsSnapshot: events
      };
      setActivityLogs((prev) => [undoLog, ...prev]);
    } else if (activityLogs.length > 0 && activityLogs[0].previousEventsSnapshot) {
      setEvents(activityLogs[0].previousEventsSnapshot);
      const undoLog: ActivityLogItem = {
        id: `log-undo-${Date.now()}`,
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        actionType: 'RESET',
        description: 'Undid last schedule action from history log',
        affectedPerson: 'System',
        previousEventsSnapshot: events
      };
      setActivityLogs((prev) => [undoLog, ...prev]);
    }
  };

  const handleUndoSpecificLog = (logId: string) => {
    const targetLog = activityLogs.find((l) => l.id === logId);
    if (targetLog && targetLog.previousEventsSnapshot) {
      setUndoStack((prev) => [...prev, events]);
      setEvents(targetLog.previousEventsSnapshot);
      const undoLog: ActivityLogItem = {
        id: `log-revert-${Date.now()}`,
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        actionType: 'RESET',
        description: `Reverted schedule to state prior to "${targetLog.description}"`,
        affectedPerson: targetLog.affectedPerson || 'System',
        previousEventsSnapshot: events
      };
      setActivityLogs((prev) => [undoLog, ...prev]);
    }
  };

  const handleClearHistory = () => {
    setActivityLogs([]);
    setUndoStack([]);
  };

  // Handle Gemini AI Analysis
  const runAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events, monthYear: '2026-08', familyNames }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAnalysisResult(json.data);
        if (json.data.freeSlots && json.data.freeSlots.length > 0) {
          setFreeSlots(json.data.freeSlots);
        }
        if (json.data.childcareGaps) {
          setChildcareGaps(json.data.childcareGaps);
        }
      }
    } catch (err) {
      console.error('Error running AI analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Update Family Names & update events person names
  const handleSaveFamilyNames = (newNames: FamilyNames) => {
    const oldHusband = familyNames.husband;
    const oldWife = familyNames.wife;
    const oldChild = familyNames.child;

    setFamilyNames(newNames);

    setEvents((prev) =>
      prev.map((e) => {
        if (e.person === oldHusband || e.person === 'Dr. Husband') {
          return { ...e, person: newNames.husband };
        }
        if (e.person === oldWife || e.person === 'Wife (Lawyer)') {
          return { ...e, person: newNames.wife };
        }
        if (e.person === oldChild || e.person === 'Noah (2yo)' || e.person === 'Gerard (2yo)') {
          return { ...e, person: newNames.child };
        }
        return e;
      })
    );
  };

  // Add Events
  const handleAddEvents = (newEvents: ScheduleEvent[]) => {
    if (newEvents.length === 0) return;
    const title = newEvents.length === 1 ? newEvents[0].title : `${newEvents.length} Schedule Events`;
    const person = newEvents.length === 1 ? newEvents[0].person : 'Family';
    const date = newEvents.length === 1 ? newEvents[0].startDate : `${newEvents[0].startDate} onwards`;
    recordAction('BATCH_ADD', `Added ${newEvents.length > 1 ? `${newEvents.length} events` : `event: "${title}"`}`, person, title, date);
    setEvents((prev) => ensurePostCallRestForEvents([...prev, ...newEvents], familyNames.husband));
  };

  // Save Single Event (Add or Edit)
  const handleSaveSingleEvent = (savedEvent: ScheduleEvent, additionalEvents?: ScheduleEvent[]) => {
    const isEdit = events.some((e) => e.id === savedEvent.id);
    recordAction(
      isEdit ? 'EDIT' : 'ADD',
      isEdit ? `Modified event: "${savedEvent.title}"` : `Added event: "${savedEvent.title}"`,
      savedEvent.person,
      savedEvent.title,
      savedEvent.startDate
    );

    setEvents((prev) => {
      const exists = prev.some((e) => e.id === savedEvent.id);
      let updated = exists ? prev.map((e) => (e.id === savedEvent.id ? savedEvent : e)) : [...prev, savedEvent];
      if (additionalEvents && additionalEvents.length > 0) {
        updated = [...updated, ...additionalEvents];
      }
      return ensurePostCallRestForEvents(updated, familyNames.husband);
    });
  };

  // Delete Event
  const handleDeleteEvent = (id: string) => {
    const target = events.find((e) => e.id === id);
    if (target) {
      recordAction(
        'DELETE',
        `Cancelled / Deleted event: "${target.title}"`,
        target.person,
        target.title,
        target.startDate
      );
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Delete All Events
  const handleDeleteAllEvents = () => {
    if (events.length === 0) return;
    recordAction(
      'DELETE',
      `Cleared / Deleted all ${events.length} event(s) from calendar`,
      'All',
      'All Events',
      'All'
    );
    setEvents([]);
    setIsDeleteAllModalOpen(false);
  };

  // Cancel All Call Duties for a Specific Month
  const handleCancelMonthCallDuties = (year: number, month: number) => {
    // month is 0-indexed (0 = Jan, 7 = Aug)
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const callDutiesInMonth = events.filter((e) => {
      const isCallCategory =
        e.category === 'On-Call 24h' ||
        e.category === 'Night Shift' ||
        e.isCallDuty === true ||
        e.category === 'Post-Call Rest' ||
        e.requiresPostCallRest === true;

      const matchesMonth =
        (e.startDate && e.startDate.startsWith(monthPrefix)) ||
        (e.endDate && e.endDate.startsWith(monthPrefix));

      return matchesMonth && isCallCategory;
    });

    if (callDutiesInMonth.length === 0) return 0;

    recordAction(
      'DELETE',
      `Cancelled all ${callDutiesInMonth.length} call duty shift(s) & post-call rest windows for ${monthName}`,
      familyNames.husband,
      `Call Duties for ${monthName}`,
      monthPrefix
    );

    const callIdsToRemove = new Set(callDutiesInMonth.map((c) => c.id));
    setEvents((prev) => prev.filter((e) => !callIdsToRemove.has(e.id)));

    return callDutiesInMonth.length;
  };

  // Lock Free Slot to Calendar
  const handleAddFreeSlotToCalendar = (slot: FreeSlot) => {
    const newEvent: ScheduleEvent = {
      id: `slot-event-${Date.now()}`,
      title: slot.title,
      person: 'Family',
      category: slot.type === 'couple_date' ? 'Date Night' : 'Family Outing',
      startDate: slot.date,
      startTime: slot.startTime,
      endDate: slot.date,
      endTime: slot.endTime,
      location: slot.type === 'couple_date' ? 'Downtown Restaurant' : 'City Botanical Park',
      notes: slot.reason,
      source: 'ai_suggested'
    };

    handleAddEvents([newEvent]);
  };

  // Reset Demo Data
  const handleResetDemoData = () => {
    recordAction('RESET', 'Reset schedule to initial sample roster data', 'All', 'Sample Roster', '2026-08-01');
    setFamilyNames(INITIAL_FAMILY_NAMES);
    setEvents(INITIAL_EVENTS);
    setFreeSlots(INITIAL_FREE_SLOTS);
    setChildcareGaps(INITIAL_CHILDCARE_GAPS);
    setAnalysisResult(null);
    localStorage.clear();
  };

  const onCallCount = events.filter((e) => e.isCallDuty || e.category === 'On-Call 24h').length;
  const canUndo = undoStack.length > 0 || activityLogs.length > 0;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetData={handleResetDemoData}
        onDeleteAllEvents={() => setIsDeleteAllModalOpen(true)}
        eventCount={events.length}
        freeSlotsCount={freeSlots.length}
        gapsCount={childcareGaps.length}
        onCallCount={onCallCount}
        historyLogsCount={activityLogs.length}
        canUndo={canUndo}
        onUndo={handleUndo}
        familyNames={familyNames}
        onOpenEditNames={() => setIsEditNamesModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* Tab View Switcher */}
        {activeTab === 'calendar' && (
          <CalendarView
            events={events}
            onAddEvent={(ev) => handleAddEvents([ev])}
            onAddEvents={handleAddEvents}
            onDeleteEvent={handleDeleteEvent}
            onDeleteAllEvents={() => setIsDeleteAllModalOpen(true)}
            onCancelMonthCallDuties={handleCancelMonthCallDuties}
            onOpenAddModal={(date, category) => {
              setModalInitialDate(date);
              setModalInitialCategory(category);
              setEditingEvent(null);
              setIsAddModalOpen(true);
            }}
            onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
            onEditEvent={(ev) => {
              setEditingEvent(ev);
              setIsAddModalOpen(true);
            }}
            familyNames={familyNames}
            onOpenEditNames={() => setIsEditNamesModalOpen(true)}
            canUndo={canUndo}
            onUndo={handleUndo}
          />
        )}

        {activeTab === 'freetimings' && (
          <FreeTimingsView
            freeSlots={freeSlots}
            onAddFreeSlotToCalendar={handleAddFreeSlotToCalendar}
            familyNames={familyNames}
          />
        )}

        {activeTab === 'import' && (
          <ImportSection
            onAddEvents={(parsedEvents) => {
              handleAddEvents(parsedEvents);
              setActiveTab('calendar');
            }}
            familyNames={familyNames}
          />
        )}

        {activeTab === 'history' && (
          <HistoryLogView
            activityLogs={activityLogs}
            onUndo={handleUndo}
            canUndo={canUndo}
            onUndoSpecificLog={handleUndoSpecificLog}
            onClearHistory={handleClearHistory}
            familyNames={familyNames}
          />
        )}

        {activeTab === 'childcare' && (
          <ChildcareTracker
            childcareGaps={childcareGaps}
            events={events}
            familyNames={familyNames}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-800">MedFamily Sync</strong> — Hospital Doctor &amp; Lawyer Family Schedule Alignment System
          </div>
          <div className="text-slate-400">
            Powered by Gemini AI Server-Side Extraction Engine
          </div>
        </div>
      </footer>

      {/* Add / Edit Event Modal */}
      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingEvent(null);
          setModalInitialCategory(undefined);
        }}
        onSave={handleSaveSingleEvent}
        initialDate={modalInitialDate}
        initialCategory={modalInitialCategory}
        editEvent={editingEvent}
        familyNames={familyNames}
        canUndo={canUndo}
        onUndo={handleUndo}
      />

      {/* Edit Family Names Modal */}
      <EditFamilyModal
        isOpen={isEditNamesModalOpen}
        onClose={() => setIsEditNamesModalOpen(false)}
        familyNames={familyNames}
        onSaveFamilyNames={handleSaveFamilyNames}
      />

      {/* WhatsApp Parser Modal */}
      <WhatsAppParserModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        onAddEvents={handleAddEvents}
        familyNames={familyNames}
      />

      {/* Delete All Events Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full border border-rose-200 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Delete All Calendar Events?</h3>
                <p className="text-xs text-rose-700 font-bold">This will clear {events.length} schedule entry(s)</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              Are you sure you want to delete all <strong className="text-slate-900 font-bold">{events.length} event(s)</strong> currently on your calendar?
              This will remove all hospital on-call shifts, legal court hearings, childcare duties, and date nights.
              <br /><br />
              <span className="text-emerald-700 font-bold">💡 Note: You can easily restore deleted events anytime using the &quot;Undo Action&quot; button in the header or history log.</span>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAllEvents}
                className="px-5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete All Events</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
