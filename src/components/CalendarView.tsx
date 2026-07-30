import React, { useState } from 'react';
import { ScheduleEvent, EventCategory, FamilyNames } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Edit2, 
  Clock, 
  MapPin, 
  AlertCircle, 
  Check, 
  X,
  Sparkles,
  Filter,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Undo2,
  Heart,
  Sun,
  Search,
  ShieldAlert,
  RotateCw,
  Edit3
} from 'lucide-react';

interface Props {
  events: ScheduleEvent[];
  onAddEvent: (event: ScheduleEvent) => void;
  onAddEvents?: (events: ScheduleEvent[]) => void;
  onDeleteEvent: (id: string) => void;
  onDeleteAllEvents?: () => void;
  onCancelMonthCallDuties?: (year: number, month: number) => number | void;
  onOpenAddModal: (date?: string, category?: EventCategory) => void;
  onOpenWhatsAppModal?: () => void;
  onEditEvent: (event: ScheduleEvent) => void;
  familyNames: FamilyNames;
  onOpenEditNames?: () => void;
  canUndo?: boolean;
  onUndo?: () => void;
}

export const CalendarView: React.FC<Props> = ({
  events,
  onAddEvent,
  onAddEvents,
  onDeleteEvent,
  onDeleteAllEvents,
  onCancelMonthCallDuties,
  onOpenAddModal,
  onOpenWhatsAppModal,
  onEditEvent,
  familyNames,
  onOpenEditNames,
  canUndo,
  onUndo
}) => {
  // Current active month/year state (Default August 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 0-indexed: 7 = August

  // Selected person filter
  const [selectedPerson, setSelectedPerson] = useState<string>('all');

  // Selected Day Detail Modal
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  // Cancel Month Call Duties Confirmation Modal State
  const [isCancelCallsModalOpen, setIsCancelCallsModalOpen] = useState(false);

  // Main Page Inline WhatsApp Parser state
  const [isParserExpanded, setIsParserExpanded] = useState(false);
  const [quickChatText, setQuickChatText] = useState('');
  const [autoSplitRanges, setAutoSplitRanges] = useState(false);
  const [isQuickParsing, setIsQuickParsing] = useState(false);
  const [quickSuccessMsg, setQuickSuccessMsg] = useState('');
  const [quickErrorMsg, setQuickErrorMsg] = useState('');

  // Monthly List View Search & Quick Category Filter
  const [monthListSearch, setMonthListSearch] = useState('');
  const [listCategoryFilter, setListCategoryFilter] = useState<'all' | 'calls' | 'dates' | 'family' | 'husband' | 'wife' | 'child'>('all');

  // Recommendation refresh seed & loading indicator state
  const [recommendationSeed, setRecommendationSeed] = useState(0);
  const [isRefreshingRecs, setIsRefreshingRecs] = useState(false);

  const getRecommendedOutings = (
    allEvents: ScheduleEvent[],
    monthPrefix: string,
    seed: number
  ) => {
    const [yStr, mStr] = monthPrefix.split('-');
    const year = parseInt(yStr, 10) || 2026;
    const month = (parseInt(mStr, 10) || 8) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const postCallDates: string[] = [];
    const freeDates: string[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
      const dayEvents = allEvents.filter(
        (e) => e.startDate === dateStr || e.endDate === dateStr
      );

      const hasCallDuty = dayEvents.some(
        (e) =>
          e.isCallDuty ||
          e.category === 'On-Call 24h' ||
          e.category === 'Night Shift'
      );
      const hasPostCallRest = dayEvents.some(
        (e) => e.category === 'Post-Call Rest' || e.requiresPostCallRest
      );

      if (hasPostCallRest) {
        postCallDates.push(dateStr);
      } else if (!hasCallDuty) {
        freeDates.push(dateStr);
      }
    }

    const dateNightIdeas = [
      {
        title: 'Post-Call Evening Dinner',
        time: '18:30 - 21:30',
        note: `Post-Call Evening! ${familyNames.husband} completed daytime sleep recovery at 16:00 and is fully refreshed.`
      },
      {
        title: 'Japanese Omakase Night',
        time: '19:45 - 22:00',
        note: `${familyNames.child} asleep at home with Nanny Maya! Zero hospital or lawyer calls scheduled.`
      },
      {
        title: 'Post-Call Sunset Cocktails',
        time: '18:30 - 21:30',
        note: `Post-Call Evening! ${familyNames.husband} fully rested after post-call sleep recovery.`
      },
      {
        title: 'Lakeside Italian Candlelight Dinner',
        time: '19:00 - 21:30',
        note: `Relaxing couple dinner window! Quiet evening for ${familyNames.husband} & ${familyNames.wife}.`
      },
      {
        title: 'Rooftop Lounge & Bistro',
        time: '19:30 - 22:00',
        note: `Evening free of hospital calls! Enjoy rooftop city views and quiet conversation.`
      },
      {
        title: 'Seafood Fine Dining & Wine Bar',
        time: '18:30 - 21:00',
        note: `Both parents free in the evening! ${familyNames.child} cared for by Nanny Maya.`
      }
    ];

    const familyIdeas = [
      {
        title: 'Botanical Gardens & Ice Cream',
        time: '15:30 - 18:00',
        note: `${familyNames.husband} & ${familyNames.wife} both free! Playground & ice cream with 2yo ${familyNames.child}.`
      },
      {
        title: 'Post-Call Sunday Beach & Splash Park',
        time: '15:30 - 18:30',
        note: `${familyNames.husband}'s post-call sleep completes at 15:00. Afternoon beach outing with ${familyNames.husband}, ${familyNames.wife} & ${familyNames.child}!`
      },
      {
        title: 'Sunday City Zoo & Picnic Day',
        time: '10:00 - 14:30',
        note: `Golden weekend window! Zero calls or hospital duty for both parents all day.`
      },
      {
        title: 'Lakeside Park Bicycle & Playground Day',
        time: '16:00 - 18:30',
        note: `Family outdoor time! Toddler playground fun with ${familyNames.child} before dinner.`
      },
      {
        title: 'Children Science Centre & Interactive Fun',
        time: '10:30 - 13:30',
        note: `Interactive sensory play day for ${familyNames.child} with Mom & Dad!`
      },
      {
        title: 'Family Weekend Farmers Market & Brunch',
        time: '09:30 - 12:00',
        note: `Sunny weekend morning family stroll and fresh breakfast together.`
      }
    ];

    const combinedCandidates = [...postCallDates, ...freeDates];
    if (combinedCandidates.length === 0) {
      for (let d = 1; d <= 28; d++) {
        combinedCandidates.push(`${monthPrefix}-${String(d).padStart(2, '0')}`);
      }
    }

    const dateNightCandidates: string[] = [];
    for (let i = 0; i < combinedCandidates.length && dateNightCandidates.length < 3; i++) {
      const idx = (i + seed) % combinedCandidates.length;
      const d = combinedCandidates[idx];
      if (!dateNightCandidates.includes(d)) {
        dateNightCandidates.push(d);
      }
    }
    while (dateNightCandidates.length < 3) {
      const fallbackDay = String((dateNightCandidates.length + 1) * 7).padStart(2, '0');
      dateNightCandidates.push(`${monthPrefix}-${fallbackDay}`);
    }

    const familyCandidates: string[] = [];
    for (let i = 0; i < combinedCandidates.length && familyCandidates.length < 3; i++) {
      const idx = (i + seed + 2) % combinedCandidates.length;
      const d = combinedCandidates[idx];
      if (!familyCandidates.includes(d) && (!dateNightCandidates.includes(d) || combinedCandidates.length < 6)) {
        familyCandidates.push(d);
      }
    }
    while (familyCandidates.length < 3) {
      const fallbackDay = String((familyCandidates.length + 1) * 6).padStart(2, '0');
      familyCandidates.push(`${monthPrefix}-${fallbackDay}`);
    }

    const dateNightRecs = dateNightCandidates.map((date, idx) => {
      const ideaIndex = (idx + seed) % dateNightIdeas.length;
      const idea = dateNightIdeas[ideaIndex];
      const isPostCall = postCallDates.includes(date);
      const customTitle = `Date Night #${idx + 1}: ${idea.title}`;
      const customNote = isPostCall
        ? `${familyNames.husband} finishes Post-Call Rest at 16:00. Refreshed for evening dinner with ${familyNames.wife}!`
        : idea.note;

      return {
        id: `rec-date-${monthPrefix}-${idx}-${seed}`,
        title: customTitle,
        date,
        time: idea.time,
        note: customNote,
        category: 'Date Night' as EventCategory
      };
    });

    const familyRecs = familyCandidates.map((date, idx) => {
      const ideaIndex = (idx + seed) % familyIdeas.length;
      const idea = familyIdeas[ideaIndex];
      const isPostCall = postCallDates.includes(date);
      const customTitle = `Family Time #${idx + 1}: ${idea.title}`;
      const customNote = isPostCall
        ? `${familyNames.husband}'s post-call sleep completes by 15:00. Great afternoon family outing with ${familyNames.child}!`
        : idea.note;

      return {
        id: `rec-fam-${monthPrefix}-${idx}-${seed}`,
        title: customTitle,
        date,
        time: idea.time,
        note: customNote,
        category: 'Family Outing' as EventCategory
      };
    });

    return { dateNightRecs, familyRecs };
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Inline Quick WhatsApp Parser Handler directly on main page
  const handleQuickParseWhatsApp = async () => {
    if (!quickChatText.trim()) {
      setQuickErrorMsg('Please paste WhatsApp chat messages to parse.');
      return;
    }

    setIsQuickParsing(true);
    setQuickErrorMsg('');
    setQuickSuccessMsg('');

    try {
      const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      const res = await fetch('/api/parse-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatText: quickChatText,
          referenceMonthYear: monthStr,
          familyNames
        }),
      });

      const json = await res.json();

      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to parse WhatsApp chat.');
      }

      const parsed: ScheduleEvent[] = (json.data.events || []).map((ev: any, idx: number) => ({
        id: `extracted-wa-${Date.now()}-${idx}`,
        title: ev.title || 'Family Commitment',
        person: ev.person || familyNames.wife,
        category: ev.category || 'Court Hearing',
        startDate: ev.startDate || `${monthStr}-01`,
        startTime: ev.startTime || '09:00',
        endDate: ev.endDate || ev.startDate || `${monthStr}-01`,
        endTime: ev.endTime || '17:00',
        isCallDuty: Boolean(ev.isCallDuty),
        isNightShift: Boolean(ev.isNightShift),
        requiresPostCallRest: Boolean(ev.requiresPostCallRest),
        location: ev.location || '',
        notes: ev.notes || '',
        source: 'wife_whatsapp'
      }));

      const finalEvents: ScheduleEvent[] = [];
      parsed.forEach((ev) => {
        if (autoSplitRanges && ev.startDate !== ev.endDate) {
          const start = new Date(ev.startDate);
          const end = new Date(ev.endDate);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
            const curr = new Date(start);
            let dayIdx = 1;
            while (curr <= end) {
              const dateStr = curr.toISOString().split('T')[0];
              finalEvents.push({
                ...ev,
                id: `${ev.id}-split-${dayIdx}-${Date.now()}`,
                title: `${ev.title} (Day ${dayIdx})`,
                startDate: dateStr,
                endDate: dateStr,
              });
              curr.setDate(curr.getDate() + 1);
              dayIdx++;
            }
          } else {
            finalEvents.push(ev);
          }
        } else {
          finalEvents.push(ev);
        }
      });

      if (finalEvents.length > 0) {
        if (onAddEvents) {
          onAddEvents(finalEvents);
        } else {
          finalEvents.forEach((p) => onAddEvent(p));
        }
        setQuickSuccessMsg(`Successfully parsed & added ${finalEvents.length} schedule events directly to your calendar!`);
        setQuickChatText('');
      } else {
        setQuickErrorMsg('No specific dates/events were detected in the text.');
      }
    } catch (err: any) {
      setQuickErrorMsg(err.message || 'Error communicating with Gemini AI.');
    } finally {
      setIsQuickParsing(false);
    }
  };

  // Helper to format YYYY-MM
  const monthString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Filter events by selected person
  const filteredEvents = events.filter((e) => {
    if (selectedPerson === 'all') return true;
    const personLower = (e.person || '').toLowerCase();

    if (selectedPerson === familyNames.husband || selectedPerson.toLowerCase().includes('suren')) {
      return personLower.includes('suren') || personLower.includes('husband') || e.person === familyNames.husband || e.person === 'Family';
    }
    if (selectedPerson === familyNames.wife || selectedPerson.toLowerCase().includes('nicole') || selectedPerson.toLowerCase().includes('nik')) {
      return personLower.includes('nicole') || personLower.includes('nik') || personLower.includes('wife') || e.person === familyNames.wife || e.person === 'Family';
    }
    if (selectedPerson === familyNames.child || selectedPerson.toLowerCase().includes('gerard')) {
      return personLower.includes('gerard') || personLower.includes('child') || e.person === familyNames.child || e.person === 'Family';
    }
    return e.person === selectedPerson;
  });

  // Calculate Call Duties in the current month (for bulk cancel)
  const monthCallDuties = events.filter((e) => {
    const isCallCategory =
      e.category === 'On-Call 24h' ||
      e.category === 'Night Shift' ||
      e.isCallDuty === true ||
      e.category === 'Post-Call Rest' ||
      e.requiresPostCallRest === true;

    const matchesMonth =
      (e.startDate && e.startDate.startsWith(monthString)) ||
      (e.endDate && e.endDate.startsWith(monthString));

    return matchesMonth && isCallCategory;
  });

  // Filter & group events for the list view below the monthly calendar grid
  const currentMonthEvents = filteredEvents
    .filter((e) => {
      const end = e.endDate || e.startDate;
      const isSearchMatch = !monthListSearch.trim() || 
        (e.title || '').toLowerCase().includes(monthListSearch.toLowerCase()) ||
        (e.person || '').toLowerCase().includes(monthListSearch.toLowerCase()) ||
        (e.category || '').toLowerCase().includes(monthListSearch.toLowerCase()) ||
        (e.location || '').toLowerCase().includes(monthListSearch.toLowerCase()) ||
        (e.notes || '').toLowerCase().includes(monthListSearch.toLowerCase());

      const isCurrentMonth = e.startDate.startsWith(monthString) || 
        (e.endDate && e.endDate.startsWith(monthString)) || 
        (monthString >= e.startDate.slice(0, 7) && monthString <= end.slice(0, 7));

      let isCategoryMatch = true;
      if (listCategoryFilter === 'calls') {
        isCategoryMatch = Boolean(e.isCallDuty) || e.category === 'On-Call 24h' || e.category === 'Night Shift' || e.category === 'Post-Call Rest' || Boolean(e.requiresPostCallRest);
      } else if (listCategoryFilter === 'dates') {
        isCategoryMatch = e.category === 'Date Night';
      } else if (listCategoryFilter === 'family') {
        isCategoryMatch = e.category === 'Family Outing' || e.person === 'Family';
      } else if (listCategoryFilter === 'husband') {
        isCategoryMatch = (e.person || '').toLowerCase().includes('suren') || e.person === familyNames.husband;
      } else if (listCategoryFilter === 'wife') {
        isCategoryMatch = (e.person || '').toLowerCase().includes('nicole') || e.person === familyNames.wife;
      } else if (listCategoryFilter === 'child') {
        isCategoryMatch = (e.person || '').toLowerCase().includes('gerard') || e.person === familyNames.child;
      }

      return isCurrentMonth && isSearchMatch && isCategoryMatch;
    })
    .sort((a, b) => {
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

  const monthEventsByDate = currentMonthEvents.reduce((acc, event) => {
    const dateKey = event.startDate;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, ScheduleEvent[]>);

  const sortedMonthDates = Object.keys(monthEventsByDate).sort();

  // Calculate calendar grid for selected month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  const prevMonthDays = startDayOfWeek;
  const totalGridCells = Math.ceil((prevMonthDays + daysInMonth) / 7) * 7;

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Get events for specific date string YYYY-MM-DD (including multi-day date ranges)
  const getEventsForDate = (dateStr: string) => {
    return filteredEvents.filter((e) => {
      const end = e.endDate || e.startDate;
      return dateStr >= e.startDate && dateStr <= end;
    });
  };

  // Helper badge color
  const getBadgeStyle = (event: ScheduleEvent) => {
    const titleLower = (event.title || '').toLowerCase();
    const categoryLower = (event.category || '').toLowerCase();
    const notesLower = (event.notes || '').toLowerCase();

    // All Church & Catechism activities coloured in grey as requested
    if (
      event.category === 'Church/Catechism' ||
      categoryLower.includes('church') ||
      categoryLower.includes('catechism') ||
      titleLower.includes('church') ||
      titleLower.includes('catechism') ||
      notesLower.includes('church') ||
      notesLower.includes('catechism')
    ) {
      return 'bg-gray-200 text-gray-800 border-gray-400 font-semibold';
    }

    const personLower = (event.person || '').toLowerCase();

    // Suren (Red theme as requested)
    if (personLower.includes('suren') || personLower.includes('husband') || event.person === familyNames.husband) {
      return 'bg-red-100 text-red-900 border-red-300';
    }

    // Nicole / Nik (Blue theme as requested)
    if (personLower.includes('nicole') || personLower.includes('nik') || personLower.includes('wife') || event.person === familyNames.wife) {
      return 'bg-blue-100 text-blue-900 border-blue-300';
    }

    if (event.category === 'On-Call 24h' || event.isCallDuty) {
      return 'bg-red-100 text-red-900 border-red-300';
    }
    if (event.category === 'Post-Call Rest') {
      return 'bg-amber-100 text-amber-900 border-amber-300';
    }
    if (event.category === 'Court Hearing' || event.category === 'Late Night Call') {
      return 'bg-blue-100 text-blue-900 border-blue-300';
    }
    if (event.category === 'Date Night') {
      return 'bg-rose-100 text-rose-900 border-rose-300';
    }
    if (event.category === 'Family Outing') {
      return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    }
    if (event.person === familyNames.child || personLower.includes('gerard') || event.category === 'Nursery/Daycare') {
      return 'bg-cyan-100 text-cyan-900 border-cyan-300';
    }
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  // Render Day Cells
  const renderCalendarCells = () => {
    const cells = [];

    // Previous month filler cells
    for (let i = 0; i < prevMonthDays; i++) {
      cells.push(
        <div key={`prev-${i}`} className="bg-slate-50/50 min-h-[110px] p-2 border-b border-r border-slate-200 opacity-40">
          <span className="text-xs font-medium text-slate-400"></span>
        </div>
      );
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayFormatted = String(day).padStart(2, '0');
      const dateStr = `${monthString}-${dayFormatted}`;
      const dayEvents = getEventsForDate(dateStr);

      const has24hCall = dayEvents.some((e) => e.category === 'On-Call 24h');
      const hasPostCallRest = dayEvents.some((e) => e.category === 'Post-Call Rest');
      const hasLawyerLateCall = dayEvents.some((e) => e.category === 'Late Night Call');
      const hasDateNight = dayEvents.some((e) => e.category === 'Date Night' || e.category === 'Family Outing');

      cells.push(
        <div
          key={`day-${day}`}
          onClick={() => setSelectedDayDate(dateStr)}
          className={`min-h-[110px] p-2 border-b border-r border-slate-200 bg-white hover:bg-slate-50/80 transition-all cursor-pointer relative flex flex-col justify-between group ${
            has24hCall ? 'bg-red-50/30 ring-1 ring-red-400/50' : ''
          }`}
        >
          {/* Day Number Header */}
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                day === 3 || day === 8 || day === 12
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 group-hover:text-slate-900'
              }`}
            >
              {day}
            </span>

            <div className="flex items-center gap-1">
              {has24hCall && (
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" title="24h Hospital On-Call" />
              )}
              {hasLawyerLateCall && (
                <span className="w-2 h-2 rounded-full bg-indigo-600" title="Lawyer Late Night Call" />
              )}
              {hasDateNight && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Date Night / Family Time" />
              )}
              {dayEvents.length > 0 && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                  {dayEvents.length}
                </span>
              )}
            </div>
          </div>

          {/* Top 2 Event Badges */}
          <div className="space-y-1 my-1 overflow-hidden">
            {dayEvents.slice(0, 2).map((ev) => (
              <div
                key={ev.id}
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border truncate ${getBadgeStyle(ev)}`}
              >
                {ev.startTime} {ev.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-[9px] font-bold text-slate-500 hover:text-slate-700 pl-1">
                +{dayEvents.length - 2} more...
              </div>
            )}
          </div>

          {/* Plus Add Hover Button */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenAddModal(dateStr);
              }}
              className="p-1 rounded-md bg-sky-600 text-white hover:bg-sky-700 shadow-xs"
              title="Add event to this date"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      );
    }

    // Remaining filler cells
    const remainingCells = totalGridCells - (prevMonthDays + daysInMonth);
    for (let i = 0; i < remainingCells; i++) {
      cells.push(
        <div key={`next-${i}`} className="bg-slate-50/50 min-h-[110px] p-2 border-b border-r border-slate-200 opacity-40"></div>
      );
    }

    return cells;
  };

  // Events for day modal
  const dayModalEvents = selectedDayDate ? getEventsForDate(selectedDayDate) : [];

  return (
    <div className="space-y-5">
      {/* Calendar Bar & Person Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-black text-slate-900">
              {monthNames[currentMonth]} {currentYear}
            </h2>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Person Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Person:
          </span>

          <button
            onClick={() => setSelectedPerson('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedPerson === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Family
          </button>

          <button
            onClick={() => setSelectedPerson(familyNames.husband)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              selectedPerson === familyNames.husband
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <span>🩺 {familyNames.husband}</span>
          </button>

          <button
            onClick={() => setSelectedPerson(familyNames.wife)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              selectedPerson === familyNames.wife
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            <span>⚖️ {familyNames.wife}</span>
          </button>

          <button
            onClick={() => setSelectedPerson(familyNames.child)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              selectedPerson === familyNames.child
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-cyan-700 hover:bg-cyan-50'
            }`}
          >
            <span>🧸 {familyNames.child}</span>
          </button>

          <button
            onClick={() => setSelectedPerson('Family')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              selectedPerson === 'Family'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span>👨‍👩‍👦 Joint Family</span>
          </button>

          {onOpenEditNames && (
            <button
              onClick={onOpenEditNames}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-sky-50 hover:border-sky-300 border border-slate-300 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs ml-auto sm:ml-2 cursor-pointer"
              title="Edit Family Member Names"
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-600" />
              <span>Edit Member Names</span>
            </button>
          )}
        </div>

        {/* Add Event Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsParserExpanded(!isParserExpanded)}
            className={`px-3.5 py-2 text-xs font-black rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 ${
              isParserExpanded
                ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
            title="Parse WhatsApp Chat with AI on Main Page"
          >
            <MessageSquare className="w-4 h-4" />
            <span>💬 Parse WhatsApp Chat</span>
          </button>

          <button
            onClick={() => onOpenAddModal()}
            className="px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Event</span>
          </button>

          {onCancelMonthCallDuties && monthCallDuties.length > 0 && (
            <button
              onClick={() => setIsCancelCallsModalOpen(true)}
              className="px-3.5 py-2 text-xs font-black text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 border border-red-200"
              title={`Cancel all ${monthCallDuties.length} on-call duty shifts & post-call rest for ${monthNames[currentMonth]} ${currentYear}`}
            >
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Cancel Call Duties ({monthCallDuties.length})</span>
            </button>
          )}

          {onDeleteAllEvents && events.length > 0 && (
            <button
              onClick={onDeleteAllEvents}
              className="px-3.5 py-2 text-xs font-black text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 border border-rose-200"
              title="Delete all events from calendar"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Delete All Events ({events.length})</span>
            </button>
          )}

          {canUndo && onUndo && (
            <button
              onClick={onUndo}
              className="px-3.5 py-2 text-xs font-black text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 border border-amber-300 animate-in fade-in duration-150"
              title="Undo last added or cancelled event"
            >
              <Undo2 className="w-4 h-4 text-slate-900" />
              <span>Undo Action</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Page WhatsApp Parser Widget */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-emerald-800/60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
              <MessageSquare className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">WhatsApp Schedule Parser</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-500/30 text-emerald-300 rounded-full border border-emerald-400/30">
                  Main Screen AI Active
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Paste WhatsApp messages here to instantly extract lawyer calls, court dates &amp; toddler activities directly onto your calendar
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsParserExpanded(!isParserExpanded)}
            className="px-3.5 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors shrink-0 flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isParserExpanded ? 'Hide Parser' : 'Open WhatsApp Parser'}</span>
          </button>
        </div>

        {/* Expanded Parser Form on Main Screen */}
        {isParserExpanded && (
          <div className="mt-3.5 pt-3 border-t border-emerald-800/80 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-100 flex items-center gap-1">
                <span>Paste Chat Text:</span>
              </label>
              <button
                type="button"
                onClick={() => setQuickChatText(
                  `Nicole: High Court Trial from ${monthString}-10 to ${monthString}-14 09:00-16:00. Late client calls on ${monthString}-18, 19, and 20 21:00-23:00. Gerard toddler camp ${monthString}-24 to ${monthString}-28.`
                )}
                className="text-[11px] font-extrabold text-emerald-300 hover:text-white underline"
              >
                + Fill Sample Roster &amp; Schedule Chat
              </button>
            </div>

            <textarea
              rows={3}
              value={quickChatText}
              onChange={(e) => setQuickChatText(e.target.value)}
              placeholder="e.g. 'Nicole: High Court trial from Aug 10 to Aug 14 09:00-16:00. Gerard toddler camp Aug 24-28. Late calls on Aug 18, 19, and 20 from 9pm to 11pm.'"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950/80 text-emerald-100 border border-emerald-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-emerald-200 font-bold cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={autoSplitRanges}
                  onChange={(e) => setAutoSplitRanges(e.target.checked)}
                  className="rounded border-emerald-600 text-emerald-500 focus:ring-emerald-400 bg-slate-900 w-4 h-4"
                />
                <span>Split multi-day ranges into separate daily entries</span>
              </label>

              <div className="flex items-center gap-2">
                {onOpenWhatsAppModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsParserExpanded(false);
                      onOpenWhatsAppModal();
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-950/80 text-emerald-200 hover:text-white border border-emerald-700/60 rounded-xl transition-colors"
                  >
                    Full Multi-Day Modal
                  </button>
                )}

                <button
                  type="button"
                  disabled={isQuickParsing || !quickChatText.trim()}
                  onClick={handleQuickParseWhatsApp}
                  className="px-5 py-2 text-xs font-black text-slate-900 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  {isQuickParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gemini Parsing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-900" />
                      <span>Parse &amp; Add to Calendar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {quickErrorMsg && (
              <div className="p-2.5 bg-red-900/60 border border-red-500/50 text-red-200 text-xs rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{quickErrorMsg}</span>
              </div>
            )}

            {quickSuccessMsg && (
              <div className="p-2.5 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs rounded-xl flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{quickSuccessMsg}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Screen Smart Recommendations Section */}
      {(() => {
        const { dateNightRecs, familyRecs } = getRecommendedOutings(events, monthString, recommendationSeed);

        return (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 text-rose-600 font-extrabold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Recommended Monthly Outings &amp; Date Nights</span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  3 Recommended Date Nights + 3 Family Outings ({monthNames[currentMonth]} {currentYear})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsRefreshingRecs(true);
                    setRecommendationSeed((prev) => prev + 1);
                    setTimeout(() => setIsRefreshingRecs(false), 400);
                  }}
                  className="px-3.5 py-1.5 text-xs font-black text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/90 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs hover:scale-102 active:scale-98 cursor-pointer"
                  title={`Recalculate and refresh recommended date nights and family outings for ${monthNames[currentMonth]} ${currentYear}`}
                >
                  <RotateCw className={`w-3.5 h-3.5 text-rose-600 ${isRefreshingRecs ? 'animate-spin' : ''}`} />
                  <span>Refresh Recommendations</span>
                </button>
                <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full hidden md:inline-block">
                  Auto-calculated from Roster
                </span>
              </div>
            </div>

            {/* 3 Date Night Recommendations */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>💖 3 Recommended Couple Date Nights ({familyNames.husband} &amp; {familyNames.wife})</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {dateNightRecs.map((item) => {
                  const isAlreadyAdded = events.some((e) => e.startDate === item.date && e.title.includes('Date Night'));

                  return (
                    <div
                      key={item.id}
                      className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-3 flex flex-col justify-between hover:border-rose-300 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-rose-800 mb-1">
                          <span>{item.date}</span>
                          <span>{item.time}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 mb-1">{item.title}</div>
                        <p className="text-[11px] text-slate-600 leading-snug mb-3">{item.note}</p>
                      </div>

                      <button
                        onClick={() => {
                          if (!isAlreadyAdded) {
                            onAddEvent({
                              id: `rec-added-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                              title: item.title,
                              person: 'Family',
                              category: item.category,
                              startDate: item.date,
                              startTime: item.time.split(' - ')[0],
                              endDate: item.date,
                              endTime: item.time.split(' - ')[1],
                              location: 'Favorite Restaurant',
                              notes: item.note,
                              source: 'ai_suggested'
                            });
                          }
                        }}
                        className={`w-full py-1.5 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                          isAlreadyAdded
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                        }`}
                      >
                        {isAlreadyAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Scheduled in Calendar</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Date Night to Calendar</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3 Family Time Recommendations */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-emerald-500" />
                <span>👨‍👩‍👦 3 Recommended Family Time Outings ({familyNames.husband}, {familyNames.wife} &amp; {familyNames.child})</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {familyRecs.map((item) => {
                  const isAlreadyAdded = events.some((e) => e.startDate === item.date && (e.title.includes('Family Time') || e.title.includes('Family Saturday') || e.title.includes('Sunday Family')));

                  return (
                    <div
                      key={item.id}
                      className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3 flex flex-col justify-between hover:border-emerald-300 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 mb-1">
                          <span>{item.date}</span>
                          <span>{item.time}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 mb-1">{item.title}</div>
                        <p className="text-[11px] text-slate-600 leading-snug mb-3">{item.note}</p>
                      </div>

                      <button
                        onClick={() => {
                          if (!isAlreadyAdded) {
                            onAddEvent({
                              id: `rec-added-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                              title: item.title,
                              person: 'Family',
                              category: item.category,
                              startDate: item.date,
                              startTime: item.time.split(' - ')[0],
                              endDate: item.date,
                              endTime: item.time.split(' - ')[1],
                              location: 'Family Outing Park / Zoo',
                              notes: item.note,
                              source: 'ai_suggested'
                            });
                          }
                        }}
                        className={`w-full py-1.5 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                          isAlreadyAdded
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        {isAlreadyAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Scheduled in Calendar</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Family Time to Calendar</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 px-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-600" />
          <span>Hospital 24h On-Call / Night Duty</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Doctor Post-Call Recovery</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-indigo-600" />
          <span>Lawyer Court / Late Calls</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Free Family & Date Night</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-cyan-500" />
          <span>2yo Gerard Care / Nursery</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-500 border border-gray-600" />
          <span>Church & Catechism Activities</span>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 bg-slate-900 text-white text-xs font-bold text-center border-b border-slate-800">
          <div className="py-3">SUN</div>
          <div className="py-3">MON</div>
          <div className="py-3">TUE</div>
          <div className="py-3">WED</div>
          <div className="py-3">THU</div>
          <div className="py-3">FRI</div>
          <div className="py-3">SAT</div>
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 border-l border-t border-slate-200">
          {renderCalendarCells()}
        </div>
      </div>

      {/* Monthly Event List View (Optimized for Mobile & Quick Overview) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-sky-400" />
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                {monthNames[currentMonth]} {currentYear} — Monthly Schedule List
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Complete chronological list of {currentMonthEvents.length} event(s) for easy mobile reading
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search filter input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events, location, person..."
                value={monthListSearch}
                onChange={(e) => setMonthListSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {monthListSearch && (
                <button
                  onClick={() => setMonthListSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => onOpenAddModal()}
              className="px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors flex items-center gap-1 shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Event</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Bar for Mobile List */}
        <div className="bg-slate-800 border-b border-slate-700/80 px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold">
          <span className="text-slate-400 text-[11px] shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-sky-400" /> Filter:
          </span>
          {[
            { id: 'all', label: `All (${events.filter(e => e.startDate && e.startDate.startsWith(monthString)).length})` },
            { id: 'calls', label: `🚨 Call Duties (${monthCallDuties.length})` },
            { id: 'dates', label: '💖 Date Nights' },
            { id: 'family', label: '👨‍👩‍👦 Family Outings' },
            { id: 'husband', label: `🩺 ${familyNames.husband}` },
            { id: 'wife', label: `⚖️ ${familyNames.wife}` },
            { id: 'child', label: `🧸 ${familyNames.child}` },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setListCategoryFilter(pill.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                listCategoryFilter === pill.id
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {pill.label}
            </button>
          ))}

          {onCancelMonthCallDuties && monthCallDuties.length > 0 && (
            <button
              onClick={() => setIsCancelCallsModalOpen(true)}
              className="ml-auto shrink-0 px-2.5 py-1 text-xs font-black text-red-200 bg-red-900/80 hover:bg-red-800 border border-red-700/80 rounded-lg transition-colors flex items-center gap-1"
              title="Cancel all call duties for the whole month"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Cancel Month Calls ({monthCallDuties.length})</span>
            </button>
          )}
        </div>

        {/* Event List Body */}
        <div className="p-3 sm:p-6 space-y-5 max-h-[600px] overflow-y-auto divide-y divide-slate-100">
          {sortedMonthDates.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <p className="text-sm font-semibold">No events found for {monthNames[currentMonth]} {currentYear}.</p>
              {monthListSearch && (
                <p className="text-xs text-slate-400 mt-1">Try clearing your search query "{monthListSearch}".</p>
              )}
              <button
                onClick={() => onOpenAddModal()}
                className="mt-4 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors"
              >
                + Add Event for {monthNames[currentMonth]}
              </button>
            </div>
          ) : (
            sortedMonthDates.map((dateKey) => {
              const dayEvents = monthEventsByDate[dateKey];
              const dateObj = new Date(dateKey + 'T00:00:00');
              const formattedDateStr = isNaN(dateObj.getTime())
                ? dateKey
                : dateObj.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

              const isToday = new Date().toISOString().slice(0, 10) === dateKey;

              return (
                <div key={dateKey} className="pt-4 first:pt-0 space-y-2.5">
                  {/* Date Header Banner */}
                  <div className={`flex items-center justify-between px-3.5 py-1.5 rounded-xl border text-xs font-bold ${
                    isToday
                      ? 'bg-sky-100 border-sky-300 text-sky-950'
                      : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5 text-sky-600" />
                      <span>{formattedDateStr}</span>
                      {isToday && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-sky-600 text-white rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                    </span>
                  </div>

                  {/* Events for this Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3.5 rounded-xl border transition-all hover:shadow-sm flex items-start justify-between gap-3 ${getBadgeStyle(event)}`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                              {event.title}
                            </span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/90 border border-slate-300 shadow-2xs">
                              {event.person}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700">
                            <span className="flex items-center gap-1 font-bold">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {event.startTime || '09:00'} - {event.endTime || '17:00'}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1 font-medium text-slate-600 truncate">
                                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                {event.location}
                              </span>
                            )}
                          </div>

                          {event.notes && (
                            <p className="text-xs text-slate-600 italic line-clamp-2 pt-0.5">
                              "{event.notes}"
                            </p>
                          )}
                        </div>

                        {/* Edit / Delete Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <button
                            onClick={() => onEditEvent(event)}
                            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 hover:text-sky-700 transition-colors border border-slate-200 shadow-2xs"
                            title="Edit Event"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteEvent(event.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors border border-red-200"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Day Detail Modal Drawer */}
      {selectedDayDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-sky-400" />
                  Schedule for {selectedDayDate}
                </h3>
                <p className="text-xs text-slate-300">
                  {dayModalEvents.length} events scheduled on this day
                </p>
              </div>

              <button
                onClick={() => setSelectedDayDate(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {dayModalEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-xs">No events scheduled for this day.</p>
                  <button
                    onClick={() => {
                      const dt = selectedDayDate;
                      setSelectedDayDate(null);
                      onOpenAddModal(dt);
                    }}
                    className="mt-3 px-4 py-2 text-xs font-bold bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors"
                  >
                    + Add Event for {selectedDayDate}
                  </button>
                </div>
              ) : (
                dayModalEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-xl border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${getBadgeStyle(event)}`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900">{event.title}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/80 border border-slate-200">
                          {event.person}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          {event.startTime} - {event.endTime}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location}
                          </span>
                        )}
                      </div>

                      {event.notes && (
                        <p className="text-xs text-slate-600 mt-1 italic">
                          "{event.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedDayDate(null);
                          onEditEvent(event);
                        }}
                        className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-700 transition-colors shadow-2xs"
                        title="Edit event"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteEvent(event.id)}
                        className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const dt = selectedDayDate;
                    setSelectedDayDate(null);
                    onOpenAddModal(dt);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-xl transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Event</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedDayDate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Month Call Duties Confirmation Modal */}
      {isCancelCallsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-white" />
                <h3 className="text-base font-black">
                  Cancel {monthNames[currentMonth]} Call Duties
                </h3>
              </div>
              <button
                onClick={() => setIsCancelCallsModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <p className="text-sm font-semibold text-slate-900 leading-snug">
                Are you sure you want to cancel all hospital on-call duties and post-call recovery days for <strong className="text-red-700">{monthNames[currentMonth]} {currentYear}</strong>?
              </p>

              <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl space-y-1.5 text-red-950">
                <div className="font-extrabold text-xs flex items-center gap-1.5 text-red-900">
                  <CheckCircle2 className="w-4 h-4 text-red-600" />
                  <span>Shifts to be cancelled ({monthCallDuties.length} total):</span>
                </div>
                <ul className="list-disc list-inside text-[11px] font-medium space-y-1 pt-1 text-slate-800 max-h-40 overflow-y-auto">
                  {monthCallDuties.map((item) => (
                    <li key={item.id} className="truncate">
                      <strong>{item.startDate}</strong>: {item.title} ({item.startTime} - {item.endTime})
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-slate-500 italic">
                💡 Tip: You can easily restore these shifts using the <strong>Undo Action</strong> button at any time.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsCancelCallsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Keep Call Duties
                </button>
                <button
                  onClick={() => {
                    if (onCancelMonthCallDuties) {
                      onCancelMonthCallDuties(currentYear, currentMonth);
                    }
                    setIsCancelCallsModalOpen(false);
                  }}
                  className="px-5 py-2 font-black text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Yes, Cancel All ({monthCallDuties.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
