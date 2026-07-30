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
            description: "Who this applies to (e.g. Surentheran, Nicole, Gerard, or Family)" 
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

// API Endpoint: Parse Doctor Roster (Text, PDF base64, Image, Excel data)
app.post("/api/parse-roster", async (req, res) => {
  try {
    const { text, fileData, mimeType, referenceMonthYear, familyNames } = req.body;
    const husbandName = familyNames?.husband || "Surentheran";
    const ai = getGeminiClient();

    const promptText = `
You are an expert medical roster and work schedule parser. 
The user (${husbandName}) is a busy hospital doctor with on-call duties.
Parse the provided roster content into structured calendar events for the month/period: ${referenceMonthYear || "current month"}.

Rules:
1. Identify all work shifts: 24h On-Call, Night Duty, Day Clinic, Ward Rounds, Post-Call Rest, ED Shift, ICU Cover, Grand Rounds.
2. If a shift is "24h On-Call", calculate start time (e.g. 08:00) and end time on next day (08:00), and mark requiresPostCallRest as true.
3. Post-call days must be flagged so the doctor gets adequate rest window.
4. Assign person = "${husbandName}".
5. Return exact dates (YYYY-MM-DD) and times (HH:MM). If only day of month is provided (e.g., "5th", "Day 12"), append to reference month: ${referenceMonthYear || "2026-08"}.

Roster Content / Instructions:
${text || "See attached document/image content."}
`;

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

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: eventSchema,
        systemInstruction: "You are a precise schedule extraction AI for hospital doctor rosters.",
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error("Error parsing roster:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to parse roster document." });
  }
});

// API Endpoint: Parse Family WhatsApp Messages
app.post("/api/parse-whatsapp", async (req, res) => {
  try {
    const { chatText, referenceMonthYear, familyNames } = req.body;
    const husbandName = familyNames?.husband || "Surentheran";
    const wifeName = familyNames?.wife || "Nicole (Lawyer)";
    const childName = familyNames?.child || "Gerard (2yo)";
    const ai = getGeminiClient();

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
2. DR. SURENTHERAN CALL DUTIES IN CHAT:
   - When ${husbandName} or Dr. Surentheran mentions hospital on-call shifts or 24h calls (e.g., "I'm on call Aug 5, 12, 20", "24h shift on 8th", "Trauma call 15th"), generate event items attributed to "${husbandName}" with category "On-Call 24h", "isCallDuty": true, "isNightShift": true, "requiresPostCallRest": true.
   - Set "startDate" and "endDate" BOTH to the call date itself (e.g., "2026-08-05") so call duties strictly reflect on the call day!
3. Determine start/end times. If a late night lawyer call is mentioned like "Late call 9pm-11pm", set 21:00 to 23:00. For 24h call duty, default to 08:30 to 08:30.
4. If bedtime for ${childName} is mentioned, create a daily/routine event for ${childName} "${childName} Bedtime Routine" (e.g. 19:30-20:30).
5. Return YYYY-MM-DD format for dates and 24-hour HH:MM for times.
6. MULTI-DAY EVENTS & DATE RANGES:
   - When a message mentions an event over a range of days (e.g. "High Court trial from Aug 12 to Aug 15", "Nursery camp Aug 10-14", "Family holiday Aug 20 to Aug 24"), set 'startDate' to the start date (e.g. 2026-08-12) and 'endDate' to the end date (e.g. 2026-08-15).
   - If a message lists multiple specific dates for an event (e.g. "Late night calls on Aug 10, 12, and 15", "On-call on 5th, 8th, 12th"), generate a separate event item for EACH specified date.
   - If a message specifies recurring weekly days (e.g. "Every Tuesday in August", "Mon to Fri swim class"), generate individual event items for each matching date in the target month.

WhatsApp Text:
${chatText}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: eventSchema,
        systemInstruction: "You are a family WhatsApp chat schedule parser.",
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error("Error parsing WhatsApp:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to parse WhatsApp text." });
  }
});

// API Endpoint: AI Free Time & Family Harmony Analysis
app.post("/api/analyze-schedule", async (req, res) => {
  try {
    const { events, monthYear, familyNames } = req.body;
    const husbandName = familyNames?.husband || "Surentheran";
    const wifeName = familyNames?.wife || "Nicole";
    const childName = familyNames?.child || "Gerard";
    const ai = getGeminiClient();

    const promptText = `
You are a top executive family & doctor work-life balance advisor for SUNIK Family Sync.
Given the combined calendar schedule of a busy Hospital Doctor (${husbandName}), a Lawyer (${wifeName} with late night calls), and their 2-year-old child (${childName}):

CRITICAL RULES FOR DATE NIGHTS & POST-CALL EVENINGS:
1. EVENING PLANS ON POST-CALL DAYS ARE EXPLICITLY ALLOWED AND ENCOURAGED:
   - Dr. Surentheran's post-call recovery sleep takes place during daytime hours (08:30 to 16:00/17:00).
   - EVENINGS (after 18:00 / 6:00 PM) on post-call days are FULLY AVAILABLE for evening family plans, dinner, or couple date nights! Do NOT treat post-call evenings as locked sleep time.
2. AT LEAST 3 DATE NIGHT RECOMMENDATIONS PER MONTH:
   - You MUST identify and recommend AT LEAST 3 high-scoring Couple Date Night slots ('couple_date') for ${husbandName} and ${wifeName} in the given month!
   - Ideal date night slots are evenings (19:30 - 22:30) after ${childName} is asleep, including post-call evenings (after 18:30), and weekday/weekend evenings with no late-night work calls.

Identify top free timing slots for:
- Couple Date Night ('couple_date' - MUST HAVE AT LEAST 3 SLOTS PER MONTH)
- Quality Family Time ('quality_family' - Both parents free, ${childName} awake 08:00-19:30)
- Doctor Solo Rest Window ('doctor_solo_rest' - Daytime recovery after 24h shift)
- Lawyer Wife Solo Rest / Recharge ('lawyer_solo_rest')

Highlight any Childcare Coverage Gaps (where both Dad is on call/night duty and Mom has late night lawyer calls/court hearings during toddler hours).
Provide 3 actionable, empathetic tips for Dr. Surentheran & Nicole to preserve energy and prevent burnout while raising 2yo ${childName}.

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

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error("Error analyzing schedule:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to analyze schedule." });
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
