import React, { useState } from 'react';
import { ScheduleEvent, FamilyNames } from '../types';
import { SAMPLE_HOSPITAL_ROSTER_TEXT, SAMPLE_WHATSAPP_CHAT_TEXT } from '../data/initialData';
import { ensurePostCallRestForEvents } from '../utils/rosterUtils';
import { 
  FileText, 
  MessageSquare, 
  Upload, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  FileSpreadsheet, 
  Loader2,
  Calendar,
  Check,
  Plus
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  onAddEvents: (events: ScheduleEvent[]) => void;
  familyNames: FamilyNames;
}

export const ImportSection: React.FC<Props> = ({ onAddEvents, familyNames }) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'whatsapp'>('roster');

  // Roster Tab States
  const [rosterText, setRosterText] = useState('');
  const [rosterFileName, setRosterFileName] = useState('');
  const [rosterFileData, setRosterFileData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isParsingRoster, setIsParsingRoster] = useState(false);

  // WhatsApp Tab States
  const [whatsappText, setWhatsappText] = useState('');
  const [isParsingWhatsapp, setIsParsingWhatsapp] = useState(false);

  // Reference Month/Year
  const [referenceMonthYear, setReferenceMonthYear] = useState('2026-08');

  // Extracted Preview Items
  const [extractedEvents, setExtractedEvents] = useState<ScheduleEvent[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Excel File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRosterFileName(file.name);
    setErrorMessage('');

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csvText = XLSX.utils.sheet_to_csv(worksheet);
          setRosterText(`--- Excel/CSV Content from ${file.name} ---\n` + csvText);
        } catch (err: any) {
          setErrorMessage('Could not read Excel file. Please try pasting raw text.');
        }
      };
      reader.readAsBinaryString(file);
    } else if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      // PDF or Image file
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result) {
          const base64Data = result.split(',')[1];
          setRosterFileData({ base64: base64Data, mimeType: file.type });
          setRosterText(`[File attached: ${file.name} (${file.type}) - Ready for Gemini AI Parsing]`);
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Standard Text File
      const reader = new FileReader();
      reader.onload = (evt) => {
        setRosterText(evt.target?.result as string || '');
      };
      reader.readAsText(file);
    }
  };

  // Parse Hospital Roster via Gemini Server API
  const handleParseRoster = async () => {
    if (!rosterText.trim() && !rosterFileData) {
      setErrorMessage('Please enter text or upload a hospital roster document first.');
      return;
    }

    setIsParsingRoster(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/parse-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rosterText,
          fileData: rosterFileData?.base64,
          mimeType: rosterFileData?.mimeType,
          referenceMonthYear
        }),
      });

      const json = await res.json();

      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to parse hospital roster.');
      }

      const parsed: ScheduleEvent[] = (json.data.events || []).map((ev: any, idx: number) => ({
        id: `extracted-roster-${Date.now()}-${idx}`,
        title: ev.title || 'Hospital Duty Shift',
        person: familyNames.husband,
        category: ev.category || 'On-Call 24h',
        startDate: ev.startDate || `${referenceMonthYear}-01`,
        startTime: ev.startTime || '08:00',
        endDate: ev.endDate || ev.startDate || `${referenceMonthYear}-01`,
        endTime: ev.endTime || '17:00',
        isCallDuty: Boolean(ev.isCallDuty),
        isNightShift: Boolean(ev.isNightShift),
        requiresPostCallRest: Boolean(ev.requiresPostCallRest),
        location: ev.location || 'Hospital Ward',
        notes: ev.notes || '',
        source: 'doctor_roster'
      }));

      const withRest = ensurePostCallRestForEvents(parsed, familyNames.husband);

      setExtractedEvents(withRest);
      setSelectedIds(new Set(withRest.map((p) => p.id)));
      setSuccessMessage(`Successfully extracted ${withRest.length} hospital roster shift(s) and post-call rest windows!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with Gemini AI.');
    } finally {
      setIsParsingRoster(false);
    }
  };

  // Parse WhatsApp Chat via Gemini Server API
  const handleParseWhatsapp = async () => {
    if (!whatsappText.trim()) {
      setErrorMessage('Please paste WhatsApp chat text first.');
      return;
    }

    setIsParsingWhatsapp(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/parse-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatText: whatsappText,
          referenceMonthYear
        }),
      });

      const json = await res.json();

      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to parse WhatsApp chat.');
      }

      const parsed: ScheduleEvent[] = (json.data.events || []).map((ev: any, idx: number) => ({
        id: `extracted-wa-${Date.now()}-${idx}`,
        title: ev.title || 'Family Activity',
        person: ev.person || familyNames.wife,
        category: ev.category || 'Court Hearing',
        startDate: ev.startDate || `${referenceMonthYear}-01`,
        startTime: ev.startTime || '09:00',
        endDate: ev.endDate || ev.startDate || `${referenceMonthYear}-01`,
        endTime: ev.endTime || '17:00',
        isCallDuty: Boolean(ev.isCallDuty),
        isNightShift: Boolean(ev.isNightShift),
        requiresPostCallRest: Boolean(ev.requiresPostCallRest),
        location: ev.location || '',
        notes: ev.notes || '',
        source: 'wife_whatsapp'
      }));

      setExtractedEvents(parsed);
      setSelectedIds(new Set(parsed.map((p) => p.id)));
      setSuccessMessage(`Successfully extracted ${parsed.length} events from WhatsApp chat!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with Gemini AI.');
    } finally {
      setIsParsingWhatsapp(false);
    }
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Save selected events to calendar
  const handleImportToCalendar = () => {
    const toImport = extractedEvents.filter((e) => selectedIds.has(e.id));
    if (toImport.length === 0) return;

    onAddEvents(toImport);
    setSuccessMessage(`Added ${toImport.length} events to your main calendar!`);
    setExtractedEvents([]);
    setSelectedIds(new Set());
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Top Header */}
      <div className="bg-slate-900 text-white px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-400/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold">AI Document & WhatsApp Schedule Parser</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Seamlessly import Suren&apos;s hospital doctor call rosters (PDF/Excel) &amp; Nicole&apos;s WhatsApp messages using Gemini AI
          </p>
        </div>

        {/* Reference Month picker */}
        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
          <Calendar className="w-4 h-4 text-sky-400" />
          <span className="text-xs text-slate-300 font-medium">Target Month:</span>
          <input
            type="month"
            value={referenceMonthYear}
            onChange={(e) => setReferenceMonthYear(e.target.value)}
            className="bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg border border-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex-1 py-3.5 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'roster'
              ? 'border-sky-600 text-sky-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>1. Doctor Hospital Roster (PDF / Excel / Document)</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex-1 py-3.5 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'whatsapp'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>2. Nicole &amp; Family WhatsApp Messages</span>
        </button>
      </div>

      <div className="p-6">
        {/* Tab 1: Doctor Hospital Roster */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  Hospital Doctor Roster Input
                </h3>
                <p className="text-xs text-slate-500">
                  Upload PDF, Excel (.xlsx), or paste doctor duty rosters (24h On-Call, ICU cover, Night duty)
                </p>
              </div>

              <button
                onClick={() => {
                  setRosterText(SAMPLE_HOSPITAL_ROSTER_TEXT);
                  setRosterFileName('');
                  setRosterFileData(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Hospital Roster</span>
              </button>
            </div>

            {/* File Upload Box */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-center relative">
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.txt,image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-2 py-2">
                <Upload className="w-6 h-6 text-slate-400" />
                <div className="text-xs font-medium text-slate-700">
                  {rosterFileName ? (
                    <span className="text-sky-700 font-bold">{rosterFileName}</span>
                  ) : (
                    <span>
                      Drop PDF, Excel (.xlsx), or Image roster here, or <span className="text-sky-600 underline">browse files</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Supports PDF documents, Excel spreadsheets, images, or plain text
                </p>
              </div>
            </div>

            {/* Text Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Or Paste Roster Text / PDF Transcript Below:
              </label>
              <textarea
                rows={6}
                value={rosterText}
                onChange={(e) => setRosterText(e.target.value)}
                placeholder="Aug 3: 24H Emergency On-Call Duty (08:00 - 08:00 next day)&#10;Aug 4: Post-Call Rest&#10;Aug 10: Overnight ICU Shift 21:00 - 08:30..."
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <button
                onClick={handleParseRoster}
                disabled={isParsingRoster}
                className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isParsingRoster ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI Extracting Shifts...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract Hospital Shifts with Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Nicole WhatsApp Messages */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Nicole &amp; Family WhatsApp Chat
                </h3>
                <p className="text-xs text-slate-500">
                  Paste copied WhatsApp messages containing court dates, late night calls, nursery activities, or pediatrician visits
                </p>
              </div>

              <button
                onClick={() => setWhatsappText(SAMPLE_WHATSAPP_CHAT_TEXT)}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample WhatsApp Chat</span>
              </button>
            </div>

            <div>
              <textarea
                rows={8}
                value={whatsappText}
                onChange={(e) => setWhatsappText(e.target.value)}
                placeholder="Paste WhatsApp messages here... e.g.&#10;Nicole: Mon Aug 3 High Court trial 9am-4:30pm, then late night US call 9:30pm-11:30pm&#10;Nicole: Pediatrician visit Friday Aug 7 at 4pm..."
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleParseWhatsapp}
                disabled={isParsingWhatsapp}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isParsingWhatsapp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI Parsing Chat...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Parse WhatsApp Chat with Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success/Error Alerts */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Extracted Preview Table */}
        {extractedEvents.length > 0 && (
          <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Extracted Preview ({selectedIds.size} of {extractedEvents.length} selected)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Review Gemini AI extracted items before adding to main calendar
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds(new Set(extractedEvents.map((e) => e.id)))}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Select All
                </button>
                <button
                  onClick={handleImportToCalendar}
                  disabled={selectedIds.size === 0}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Import {selectedIds.size} Events</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-200 max-h-80 overflow-y-auto">
              {extractedEvents.map((event) => {
                const isSelected = selectedIds.has(event.id);
                return (
                  <div
                    key={event.id}
                    onClick={() => toggleSelect(event.id)}
                    className={`p-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white transition-colors ${
                      isSelected ? 'bg-sky-50/60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(event.id)}
                        className="mt-1 rounded text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{event.title}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              event.person === familyNames.husband || event.person.includes('Suren')
                                ? 'bg-red-100 text-red-800'
                                : event.person === familyNames.wife || event.person.includes('Nicole')
                                ? 'bg-indigo-100 text-indigo-800'
                                : event.person === familyNames.child || event.person.includes('Gerard')
                                ? 'bg-cyan-100 text-cyan-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {event.person}
                          </span>
                          <span className="text-[10px] font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                            {event.category}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>
                            📅 {event.startDate} ({event.startTime} - {event.endTime})
                          </span>
                          {event.location && <span>📍 {event.location}</span>}
                          {event.isCallDuty && (
                            <span className="text-red-600 font-semibold">⚡ On-Call/Duty</span>
                          )}
                          {event.requiresPostCallRest && (
                            <span className="text-amber-600 font-semibold">😴 Post-Call Rest</span>
                          )}
                        </div>

                        {event.notes && (
                          <p className="text-[11px] text-slate-600 mt-1 italic">"{event.notes}"</p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
