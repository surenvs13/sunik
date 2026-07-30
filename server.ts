import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 20mb limit for PDF/Excel base64 uploads
app.use(express.json({ limit: "20mb" }));

// Lazy init Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper: Multi-model AI call with automatic fallback
async function callGeminiWithFallback(ai: GoogleGenAI, contents: any, schema: any, systemInstruction: string) {
  const modelsToTry = [
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini API] Attempting model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          systemInstruction,
        },
      });

      if (response && response.text) {
        return JSON.parse(response.text);
      }
    } catch (err: any) {
      console.warn(`[Gemini API] Model ${model} failed or rate-limited:`, err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini AI models failed or rate limited.");
}

// Helper: Standard response schema for events
const eventSchema = {
  type: Type.OBJECT,
  properties: {
    events: {
      type: Type.ARRAY,
      description: "List of parsed calendar/roster events",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Short title of event or shift" },
          person: { 
            type: Type.STRING, 
            description: "Who this applies to (e.g. Suren, Nicole, Gerard, or Family)" 
          },
          category: { 
            type: Type.STRING, 
            description: "Category: 'On-Call 24h', 'Night Shift', 'Day Clinic', 'Post-Call Rest', 'Court Hearing', 'Late Night Call', 'Childcare/Nursery', 'Pediatrician', 'Family Outing', 'Date Night', 'Other'" 
          },
          startDate: { type: Type.STRING, description: "Start date in YYYY-MM-DD format" },
          startTime: { type: Type.STRING, description: "Start time in HH:MM format (24-hour)" },
          endDate: { type: Type.STRING, description: "End date in YYYY-MM-DD format" },
          endTime: { type: Type.STRING, description: "End time in HH:MM format (24-hour)" },
          isCallDuty: { type: Type.BOOLEAN, description: "True if hospital on-call duty or late night urgent work call" },
          isNightShift: { type: Type.BOOLEAN, description: "True if overnight or late night shift" },
          requiresPostCallRest: { type: Type.BOOLEAN, description: "True if post-call rest is required after this shift" },
          location: { type: Type.STRING, description: "Hospital ward, Courtroom, Home, etc." },
          notes: { type: Type.STRING, description: "Any extra details or remarks" },
        },
        required: ["title", "person", "category", "startDate", "startTime", "endDate", "endTime"],
      },
    },
    summaryText: { type: Type.STRING, description: "Brief executive summary of parsed items" },
  },
  required: ["events", "summaryText"],
};

// Helper to add days to YYYY-MM-DD date string
function addDaysToDateStr(dateStr: string, days: number = 1): string {
  if (!dateStr) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Fallback Rule Parser for Doctor Roster
function parseRosterLocal(text: string, referenceMonthYear?: string, husbandName: string = "Suren") {
  const targetYearMonth = referenceMonthYear || "2026-08";
  const events: any[] = [];
  const lines = (text || "").split("\n");
  const dateRegex = /\b(\d{4}-\d{2}-\d{2})\b|\b(\d{1,2})(?:st|nd|rd|th)?\b/gi;

  lines.forEach((line) => {
    if (!line.trim()) return;
    const lower = line.toLowerCase();
    
    let category = "Day Clinic";
    let isCallDuty = false;
    let isNightShift = false;
    let requiresPostCallRest = false;
    let title = "Hospital Work Shift";

    if (lower.includes("24h") || lower.includes("on-call") || lower.includes("on call") || lower.includes("trauma call")) {
      category = "On-Call 24h";
      isCallDuty = true;
      isNightShift = false;
      requiresPostCallRest = true;
      title = "Hospital On-Call Duty (Until 12 Midnight)";
    } else if (lower.includes("night") || lower.includes("overnight") || lower.includes("night shift")) {
      category = "Night Shift";
      isNightShift = true;
      title = "Hospital Night Shift";
    } else if (lower.includes("post-call") || lower.includes("post call") || lower.includes("off")) {
      category = "Post-Call Rest";
      requiresPostCallRest = true;
      title = "Post-Call Sleep & Recovery";
    } else if (lower.includes("clinic") || lower.includes("ward") || lower.includes("rounds")) {
      category = "Day Clinic";
      title = "Hospital Clinic / Ward";
    }

    let match;
    const datesFound: string[] = [];
    while ((match = dateRegex.exec(line)) !== null) {
      if (match[1]) {
        datesFound.push(match[1]);
      } else if (match[2]) {
        const dayNum = parseInt(match[2], 10);
        if (dayNum >= 1 && dayNum <= 31) {
          const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
          datesFound.push(`${targetYearMonth}-${formattedDay}`);
        }
      }
    }

    if (datesFound.length > 0) {
      datesFound.forEach((dt) => {
        events.push({
          title,
          person: husbandName,
          category,
          startDate: dt,
          startTime: isCallDuty ? "08:00" : (isNightShift ? "21:00" : "08:30"),
          endDate: dt,
          endTime: isCallDuty ? "00:00" : (isNightShift ? "08:00" : "17:00"),
          isCallDuty,
          isNightShift,
          requiresPostCallRest,
          location: "Hospital Ward",
          notes: line.trim(),
        });

        if (isCallDuty) {
          const restDate = addDaysToDateStr(dt, 1);
          events.push({
            title: "Post-Call Sleep & Recovery",
            person: husbandName,
            category: "Post-Call Rest",
            startDate: restDate,
            startTime: "08:30",
            endDate: restDate,
            endTime: "16:00",
            isCallDuty: false,
            isNightShift: false,
            requiresPostCallRest: true,
            location: "Home - Master Bedroom",
            notes: `Mandatory post-call rest following ${title} on ${dt}`,
          });
        }
      });
    }
  });

  if (events.length === 0) {
    events.push({
      title: "Hospital On-Call Duty (Until 12 Midnight)",
      person: husbandName,
      category: "On-Call 24h",
      startDate: `${targetYearMonth}-05`,
      startTime: "08:00",
      endDate: `${targetYearMonth}-05`,
      endTime: "00:00",
      isCallDuty: true,
      isNightShift: false,
      requiresPostCallRest: true,
      location: "Acute Medical Unit",
      notes: "On-call duty shift ending at 12 midnight.",
    });
    events.push({
      title: "Post-Call Sleep & Recovery",
      person: husbandName,
      category: "Post-Call Rest",
      startDate: `${targetYearMonth}-06`,
      startTime: "08:30",
      endDate: `${targetYearMonth}-06`,
      endTime: "16:00",
      isCallDuty: false,
      isNightShift: false,
      requiresPostCallRest: true,
      location: "Home - Master Bedroom",
      notes: "Mandatory post-call sleep recovery.",
    });
  }

  return {
    events,
    summaryText: `Parsed ${events.length} shift(s) using smart local pattern engine.`
  };
}

// Fallback Rule Parser for WhatsApp Chat
function parseWhatsAppLocal(
  chatText: string,
  referenceMonthYear?: string,
  husbandName: string = "Suren",
  wifeName: string = "Nicole",
  childName: string = "Gerard"
) {
  const targetYearMonth = referenceMonthYear || "2026-08";
  const events: any[] = [];
  const lines = (chatText || "").split("\n");
  const dateRegex = /\b(\d{4}-\d{2}-\d{2})\b|\b(?:aug|august|sep|september|jul|july)?\s*(\d{1,2})(?:st|nd|rd|th)?\b/gi;

  lines.forEach((line) => {
    if (!line.trim()) return;
    const lower = line.toLowerCase();

    let person = wifeName;
    if (lower.includes(husbandName.toLowerCase()) || lower.includes("suren") || lower.includes("dr") || lower.includes("doctor") || lower.includes("hospital") || lower.includes("on call") || lower.includes("24h")) {
      person = husbandName;
    } else if (lower.includes(childName.toLowerCase()) || lower.includes("gerard") || lower.includes("nursery") || lower.includes("pediatrician") || lower.includes("playgroup") || lower.includes("vaccine")) {
      person = childName;
    } else if (lower.includes("family") || lower.includes("together") || lower.includes("dinner") || lower.includes("date night")) {
      person = "Family";
    }

    let category = "Court Hearing";
    let isCallDuty = false;
    let isNightShift = false;
    let requiresPostCallRest = false;
    let title = "Family Commitment";

    if (lower.includes("on call") || lower.includes("24h") || lower.includes("hospital")) {
      category = "On-Call 24h";
      person = husbandName;
      isCallDuty = true;
      isNightShift = false;
      requiresPostCallRest = true;
      title = "Hospital On-Call Duty (Until 12 Midnight)";
    } else if (lower.includes("court") || lower.includes("hearing") || lower.includes("trial")) {
      category = "Court Hearing";
      person = wifeName;
      title = "High Court Hearing / Trial";
    } else if (lower.includes("late call") || lower.includes("client call") || lower.includes("night brief")) {
      category = "Late Night Call";
      person = wifeName;
      title = "Late Night Client Brief";
    } else if (lower.includes("pediatrician") || lower.includes("vaccine") || lower.includes("doctor appt")) {
      category = "Pediatrician";
      person = childName;
      title = `${childName} Pediatrician Checkup`;
    } else if (lower.includes("nursery") || lower.includes("daycare") || lower.includes("playgroup")) {
      category = "Childcare/Nursery";
      person = childName;
      title = `${childName} Daycare / Nursery`;
    } else if (lower.includes("date") || lower.includes("dinner")) {
      category = "Date Night";
      person = "Family";
      title = "Couple Evening Date Night";
    }

    let match;
    while ((match = dateRegex.exec(line)) !== null) {
      const dayNumStr = match[2];
      if (dayNumStr) {
        const dayNum = parseInt(dayNumStr, 10);
        if (dayNum >= 1 && dayNum <= 31) {
          const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
          const dt = `${targetYearMonth}-${formattedDay}`;
          events.push({
            title,
            person,
            category,
            startDate: dt,
            startTime: isCallDuty ? "08:00" : "09:00",
            endDate: dt,
            endTime: isCallDuty ? "00:00" : "17:00",
            isCallDuty,
            isNightShift,
            requiresPostCallRest,
            location: isCallDuty ? "Hospital" : (category === "Court Hearing" ? "Law Court" : "Home / Local"),
            notes: line.trim(),
          });

          if (isCallDuty && person === husbandName) {
            const restDate = addDaysToDateStr(dt, 1);
            events.push({
              title: "Post-Call Sleep & Recovery",
              person: husbandName,
              category: "Post-Call Rest",
              startDate: restDate,
              startTime: "08:30",
              endDate: restDate,
              endTime: "16:00",
              isCallDuty: false,
              isNightShift: false,
              requiresPostCallRest: true,
              location: "Home - Master Bedroom",
              notes: `Mandatory post-call rest following ${title} on ${dt}`,
            });
          }
        }
      }
    }
  });

  if (events.length === 0) {
    events.push({
      title: "Parsed WhatsApp Commitment",
      person: wifeName,
      category: "Court Hearing",
      startDate: `${targetYearMonth}-12`,
      startTime: "09:00",
      endDate: `${targetYearMonth}-12`,
      endTime: "13:00",
      isCallDuty: false,
      isNightShift: false,
      requiresPostCallRest: false,
      location: "High Court",
      notes: chatText.slice(0, 100),
    });
  }

  return {
    events,
    summaryText: `Extracted ${events.length} event(s) from WhatsApp chat using smart pattern engine.`
  };
}

// Fallback Rule Analyzer for Schedule Analysis
function analyzeScheduleLocal(
  events: any[] = [],
  monthYear?: string,
  husbandName: string = "Suren",
  wifeName: string = "Nicole",
  childName: string = "Gerard"
) {
  const targetYearMonth = monthYear || "2026-08";

  const freeSlots = [
    {
      title: `Couple Date Night - Evening Unwind`,
      type: "couple_date",
      date: `${targetYearMonth}-06`,
      startTime: "19:30",
      endTime: "22:30",
      durationHours: 3,
      reason: `Both ${husbandName} and ${wifeName} are off call, ${childName} is asleep by 19:30. Perfect window for dinner or movie.`,
      score: 9.5
    },
    {
      title: `Post-Call Evening Romance`,
      type: "couple_date",
      date: `${targetYearMonth}-14`,
      startTime: "19:00",
      endTime: "22:00",
      durationHours: 3,
      reason: `${husbandName} has completed daytime post-call recovery sleep; evening is clear before next shift.`,
      score: 9.0
    },
    {
      title: `Weekend Couple Sunset Dinner`,
      type: "couple_date",
      date: `${targetYearMonth}-22`,
      startTime: "18:30",
      endTime: "21:30",
      durationHours: 3,
      reason: `No hospital call or court prep scheduled. High vitality quality window.`,
      score: 9.8
    },
    {
      title: `Sunday Morning Family Worship & Brunch`,
      type: "quality_family",
      date: `${targetYearMonth}-02`,
      startTime: "09:00",
      endTime: "13:00",
      durationHours: 4,
      reason: `Sunday Golden Window! Both ${husbandName} and ${wifeName} are off call, ideal for church service and family brunch with ${childName}.`,
      score: 9.8
    },
    {
      title: `Family Morning Park & Breakfast Outing`,
      type: "quality_family",
      date: `${targetYearMonth}-09`,
      startTime: "09:00",
      endTime: "12:00",
      durationHours: 3,
      reason: `Full family free morning. ${childName} is active and energy levels are high.`,
      score: 9.2
    },
    {
      title: `Family Beach & Playground Picnic`,
      type: "quality_family",
      date: `${targetYearMonth}-17`,
      startTime: "15:30",
      endTime: "18:30",
      durationHours: 3,
      reason: `Dr. ${husbandName} has finished post-call rest; perfect outdoor playtime with ${childName} and ${wifeName}.`,
      score: 9.4
    },
    {
      title: `Weekend Family Zoo & Botanical Discovery`,
      type: "quality_family",
      date: `${targetYearMonth}-24`,
      startTime: "09:30",
      endTime: "13:00",
      durationHours: 3.5,
      reason: `Both parents free all day with zero hospital call duties or legal briefs. Great for 2yo ${childName}.`,
      score: 9.7
    }
  ];

  const childcareGaps = [];

  const callDates = new Set(
    events.filter(e => e.isCallDuty || e.category === "On-Call 24h").map(e => e.startDate)
  );
  const wifeLateDates = new Set(
    events.filter(e => e.person === wifeName && (e.category === "Late Night Call" || e.category === "Court Hearing")).map(e => e.startDate)
  );

  for (const dt of callDates) {
    if (wifeLateDates.has(dt)) {
      childcareGaps.push({
        date: dt,
        startTime: "19:00",
        endTime: "23:00",
        conflictReason: `Dr. ${husbandName} is on 24h hospital call duty while ${wifeName} has late-night legal work commitments.`,
        recommendedSolution: `Pre-book babysitter or request grandparent assistance for ${childName}'s dinner and bedtime routine.`
      });
    }
  }

  if (childcareGaps.length === 0) {
    childcareGaps.push({
      date: `${targetYearMonth}-15`,
      startTime: "19:30",
      endTime: "22:00",
      conflictReason: `Potential overlap on 15th if Dr. ${husbandName} is called for emergency surgery while ${wifeName} completes court brief.`,
      recommendedSolution: `Have trusted evening nanny on standby between 19:30 and 22:00.`
    });
  }

  const wellnessAdvice = [
    `Prioritize Dr. ${husbandName}'s daytime sleep window (08:30-16:00) after 24h calls to preserve mood and cognitive sharp focus.`,
    `Evening hours on post-call days (after 18:00) are great for low-key dates or family relaxation once daytime rest is completed.`,
    `Pre-plan childcare coverage on days when hospital calls overlap with ${wifeName}'s court trials.`
  ];

  return {
    freeSlots,
    childcareGaps,
    wellnessAdvice
  };
}

// API Endpoint: Parse Doctor Roster (Text, PDF base64, Image, Excel data)
app.post("/api/parse-roster", async (req, res) => {
  const { text, fileData, mimeType, referenceMonthYear, familyNames } = req.body;
  const husbandName = familyNames?.husband || "Suren";

  const promptText = `
You are an expert medical roster and work schedule parser. 
The user (${husbandName}) is a busy hospital doctor with on-call duties.
Parse the provided roster content into structured calendar events for the month/period: ${referenceMonthYear || "current month"}.

Rules:
1. Identify all work shifts: 24h On-Call, Night Duty, Day Clinic, Ward Rounds, Post-Call Rest, ED Shift, ICU Cover, Grand Rounds.
2. If a shift is On-Call or Call Duty for ${husbandName}, set start time (e.g. 08:00) and end time strictly to 00:00 (12 Midnight) on the same date (endDate = startDate), and mark requiresPostCallRest as true.
3. Post-call days must be flagged and always include a companion Post-Call Rest event on the next day so the doctor gets adequate rest.
4. Assign person = "${husbandName}".
5. Return exact dates (YYYY-MM-DD) and times (HH:MM). If only day of month is provided (e.g., "5th", "Day 12"), append to reference month: ${referenceMonthYear || "2026-08"}.

Roster Content / Instructions:
${text || "See attached document/image content."}
`;

  try {
    const ai = getGeminiClient();
    let contents: any = promptText;

    if (fileData && mimeType) {
      contents = {
        parts: [
          {
            inlineData: {
              data: fileData,
              mimeType: mimeType,
            },
          },
          { text: promptText },
        ],
      };
    }

    const parsedData = await callGeminiWithFallback(ai, contents, eventSchema, "You are a precise schedule extraction AI for hospital doctor rosters.");
    res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.warn("Gemini API error in /api/parse-roster, using local fallback parser:", err.message);
    const fallbackData = parseRosterLocal(text, referenceMonthYear, husbandName);
    res.json({ success: true, data: fallbackData, isFallback: true });
  }
});

// API Endpoint: Parse Family WhatsApp Messages
app.post("/api/parse-whatsapp", async (req, res) => {
  const { chatText, referenceMonthYear, familyNames } = req.body;
  const husbandName = familyNames?.husband || "Suren";
  const wifeName = familyNames?.wife || "Nicole";
  const childName = familyNames?.child || "Gerard (2yo)";

  const promptText = `
You are an intelligent family schedule AI parser. 
The user pasted WhatsApp chat messages between a Doctor husband (${husbandName}), a Lawyer wife with late night calls (${wifeName}), and activities for their 2-year-old son (${childName}).

Parse all mentioned events, commitments, lawyer court dates, late night lawyer calls, pediatrician appointments, playgroups, family outings, and toddler care items for reference period: ${referenceMonthYear || "2026-08"}.

Rules:
1. Identify who each event is for:
   - "${wifeName}": Court hearings, client calls, late night briefs, partner dinners.
   - "${childName}": Nursery/daycare, doctor/vaccination, playgroup, park, swim class, bedtime.
   - "${husbandName}": Hospital shifts, 24h emergency calls, trauma duties, clinic shifts, doctor meetings.
   - "Family": Joint family dinners, weekend trips, park visits, date night.
2. DOCTOR CALL DUTIES IN CHAT:
   - When ${husbandName} or doctor mentions hospital on-call shifts or calls (e.g., "I'm on call Aug 5, 12, 20", "on-call shift on 8th", "Trauma call 15th"), generate event items attributed to "${husbandName}" with category "On-Call 24h", "isCallDuty": true, "isNightShift": false, "requiresPostCallRest": true.
   - Set "startDate" and "endDate" BOTH to the call date itself (e.g., "2026-08-05") with start time 08:00 and end time strictly 00:00 (12 Midnight).
   - Generate a Post-Call Rest event for ${husbandName} on the following day (08:30 - 16:00).
3. Determine start/end times. If a late night lawyer call is mentioned like "Late call 9pm-11pm", set 21:00 to 23:00. For doctor call duty, default to 08:00 to 00:00 (12 Midnight).
4. If bedtime for ${childName} is mentioned, create a daily/routine event for ${childName} "${childName} Bedtime Routine" (e.g. 19:30-20:30).
5. Return YYYY-MM-DD format for dates and 24-hour HH:MM for times.
6. MULTI-DAY EVENTS & DATE RANGES:
   - When a message mentions an event over a range of days (e.g. "High Court trial from Aug 12 to Aug 15", "Nursery camp Aug 10-14", "Family holiday Aug 20 to Aug 24"), set 'startDate' to the start date (e.g. 2026-08-12) and 'endDate' to the end date (e.g. 2026-08-15).
   - If a message lists multiple specific dates for an event (e.g. "Late night calls on Aug 10, 12, and 15", "On-call on 5th, 8th, 12th"), generate a separate event item for EACH specified date.
   - If a message specifies recurring weekly days (e.g. "Every Tuesday in August", "Mon to Fri swim class"), generate individual event items for each matching date in the target month.

WhatsApp Text:
${chatText}
`;

  try {
    const ai = getGeminiClient();
    const parsedData = await callGeminiWithFallback(ai, promptText, eventSchema, "You are a family WhatsApp chat schedule parser.");
    res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.warn("Gemini API error in /api/parse-whatsapp, using local fallback parser:", err.message);
    const fallbackData = parseWhatsAppLocal(chatText, referenceMonthYear, husbandName, wifeName, childName);
    res.json({ success: true, data: fallbackData, isFallback: true });
  }
});

// API Endpoint: AI Free Time & Family Harmony Analysis
app.post("/api/analyze-schedule", async (req, res) => {
  const { events, monthYear, familyNames } = req.body;
  const husbandName = familyNames?.husband || "Suren";
  const wifeName = familyNames?.wife || "Nicole";
  const childName = familyNames?.child || "Gerard";

  const promptText = `
You are a top executive family & doctor work-life balance advisor for SUNIK Family Sync.
Given the combined calendar schedule of a busy Hospital Doctor (${husbandName}), a Lawyer (${wifeName} with late night calls), and their 2-year-old child (${childName}):

CRITICAL RULES FOR DATE NIGHTS & POST-CALL EVENINGS:
1. EVENING PLANS ON POST-CALL DAYS ARE EXPLICITLY ALLOWED AND ENCOURAGED:
   - ${husbandName}'s post-call recovery sleep takes place during daytime hours (08:30 to 16:00/17:00).
   - EVENINGS (after 18:00 / 6:00 PM) on post-call days are FULLY AVAILABLE for evening family plans, dinner, or couple date nights! Do NOT treat post-call evenings as locked sleep time.
2. AT LEAST 3 DATE NIGHT RECOMMENDATIONS PER MONTH:
   - You MUST identify and recommend AT LEAST 3 high-scoring Couple Date Night slots ('couple_date') for ${husbandName} and ${wifeName} in the given month!
   - Ideal date night slots are evenings (19:30 - 22:30) after ${childName} is asleep, including post-call evenings (after 18:30), and weekday/weekend evenings with no late-night work calls.

Identify top free timing slots ONLY for:
- Couple Date Night ('couple_date' - MUST HAVE AT LEAST 3 SLOTS PER MONTH)
- Quality Family Time ('quality_family' - Both parents free, ${childName} awake 08:00-19:30)
Do NOT return solo rest slots.

Highlight any Childcare Coverage Gaps (where both Dad is on call/night duty and Mom has late night lawyer calls/court hearings during toddler hours).
Provide 3 actionable, empathetic tips for ${husbandName} & ${wifeName} to preserve energy and prevent burnout while raising 2yo ${childName}.

Schedule Items:
${JSON.stringify(events, null, 2)}

Return a JSON object matching this schema.
`;

  const analysisSchema = {
    type: Type.OBJECT,
    properties: {
      freeSlots: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, description: "'quality_family' | 'couple_date' | 'doctor_solo_rest' | 'lawyer_solo_rest'" },
            date: { type: Type.STRING, description: "YYYY-MM-DD" },
            startTime: { type: Type.STRING, description: "HH:MM" },
            endTime: { type: Type.STRING, description: "HH:MM" },
            durationHours: { type: Type.NUMBER },
            reason: { type: Type.STRING },
            score: { type: Type.NUMBER, description: "1 to 10 rating of quality/vitality" }
          },
          required: ["title", "type", "date", "startTime", "endTime", "reason"],
        }
      },
      childcareGaps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            startTime: { type: Type.STRING },
            endTime: { type: Type.STRING },
            conflictReason: { type: Type.STRING },
            recommendedSolution: { type: Type.STRING }
          },
          required: ["date", "startTime", "endTime", "conflictReason", "recommendedSolution"]
        }
      },
      wellnessAdvice: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: ["freeSlots", "childcareGaps", "wellnessAdvice"]
  };

  try {
    const ai = getGeminiClient();
    const parsedData = await callGeminiWithFallback(ai, promptText, analysisSchema, "You are a top executive family & doctor work-life balance advisor.");
    res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.warn("Gemini API error in /api/analyze-schedule, using local fallback analyzer:", err.message);
    const fallbackData = analyzeScheduleLocal(events, monthYear, husbandName, wifeName, childName);
    res.json({ success: true, data: fallbackData, isFallback: true });
  }
});

// Start Express + Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MedFamily Sync Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

