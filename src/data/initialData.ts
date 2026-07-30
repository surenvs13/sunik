import { ScheduleEvent, FreeSlot, ChildcareGap, FamilyNames } from '../types';

export const INITIAL_FAMILY_NAMES: FamilyNames = {
  husband: 'Suren',
  wife: 'Nicole',
  child: 'Gerard (2yo)'
};

// Utility to get dates for current month (August 2026)
const getMonthPrefix = () => {
  const d = new Date();
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${yr}-${mo}`;
};

const prefix = '2026-08'; // Fixed clean date anchor for consistent demo

export const INITIAL_EVENTS: ScheduleEvent[] = [
  // --- DOCTOR HUSBAND (SUREN) ROSTER ---
  {
    id: 'doc-1',
    title: 'Hospital On-Call Duty (Until 12 Midnight)',
    person: 'Suren',
    category: 'On-Call 24h',
    startDate: `${prefix}-03`,
    startTime: '08:00',
    endDate: `${prefix}-03`,
    endTime: '00:00',
    isCallDuty: true,
    isNightShift: false,
    requiresPostCallRest: true,
    location: 'Central General Hospital - Acute Medical Unit',
    notes: 'Senior Medical Registrar Lead on duty until 12 midnight.',
    source: 'doctor_roster'
  },
  {
    id: 'doc-1-rest',
    title: 'Post-Call Sleep & Recovery',
    person: 'Suren',
    category: 'Post-Call Rest',
    startDate: `${prefix}-04`,
    startTime: '08:30',
    endDate: `${prefix}-04`,
    endTime: '16:00',
    requiresPostCallRest: true,
    location: 'Home - Master Bedroom',
    notes: 'Mandatory rest window following on-call duty until midnight.',
    source: 'doctor_roster'
  },
  {
    id: 'doc-2',
    title: 'General Outpatient Clinic & Grand Rounds',
    person: 'Suren',
    category: 'Day Clinic',
    startDate: `${prefix}-05`,
    startTime: '08:00',
    endDate: `${prefix}-05`,
    endTime: '17:00',
    location: 'Clinic Block B, Room 402',
    notes: '22 appointments scheduled + teaching medical interns.',
    source: 'doctor_roster'
  },
  {
    id: 'doc-3',
    title: 'Ward Rounds & Inpatient Consults',
    person: 'Suren',
    category: 'Ward Rounds',
    startDate: `${prefix}-07`,
    startTime: '07:30',
    endDate: `${prefix}-07`,
    endTime: '15:30',
    location: 'Main Medical Tower - Ward 7A',
    notes: 'Discharge summaries & post-op assessments.',
    source: 'doctor_roster'
  },
  {
    id: 'doc-4',
    title: 'Overnight Intensive Care Duty (Until 12 Midnight)',
    person: 'Suren',
    category: 'Night Shift',
    startDate: `${prefix}-10`,
    startTime: '21:00',
    endDate: `${prefix}-10`,
    endTime: '00:00',
    isCallDuty: true,
    isNightShift: false,
    requiresPostCallRest: true,
    location: 'ICU Unit 2',
    notes: 'Covering acute respiratory cases until 12 midnight.',
    source: 'doctor_roster'
  },
  {
    id: 'doc-4-rest',
    title: 'Post-Night Shift Rest',
    person: 'Suren',
    category: 'Post-Call Rest',
    startDate: `${prefix}-11`,
    startTime: '09:00',
    endDate: `${prefix}-11`,
    endTime: '17:00',
    requiresPostCallRest: true,
    location: 'Home',
    notes: 'Sleep recovery after ICU cover.',
    source: 'doctor_roster'
  },
  {
    id: 'doc-5',
    title: 'On-Call Weekend Shift (Until 12 Midnight)',
    person: 'Suren',
    category: 'On-Call 24h',
    startDate: `${prefix}-15`,
    startTime: '08:00',
    endDate: `${prefix}-15`,
    endTime: '00:00',
    isCallDuty: true,
    isNightShift: false,
    requiresPostCallRest: true,
    location: 'Acute Medical Unit',
    notes: 'Weekend inpatient hospital duty until 12 midnight.',
    source: 'doctor_roster'
  },
  {
    id: 'doc-5-rest',
    title: 'Post-Call Sleep & Recovery',
    person: 'Suren',
    category: 'Post-Call Rest',
    startDate: `${prefix}-16`,
    startTime: '08:30',
    endDate: `${prefix}-16`,
    endTime: '15:00',
    requiresPostCallRest: true,
    location: 'Home - Master Bedroom',
    notes: 'Mandatory sleep & fatigue recovery following weekend shift.',
    source: 'doctor_roster'
  },
  {
    id: 'doc-6',
    title: 'Surgical Day Theater & Ward Cover',
    person: 'Suren',
    category: 'Day Clinic',
    startDate: `${prefix}-19`,
    startTime: '08:00',
    endDate: `${prefix}-19`,
    endTime: '17:30',
    location: 'Operating Theater 3',
    notes: 'Elective minor surgical list.',
    source: 'doctor_roster'
  },
  {
    id: 'doc-7',
    title: 'Hospital On-Call Duty (Until 12 Midnight)',
    person: 'Suren',
    category: 'On-Call 24h',
    startDate: `${prefix}-23`,
    startTime: '08:00',
    endDate: `${prefix}-23`,
    endTime: '00:00',
    isCallDuty: true,
    isNightShift: false,
    requiresPostCallRest: true,
    location: 'Acute Medical Unit',
    notes: 'Covering senior registrar calls until 12 midnight.',
    source: 'doctor_roster'
  },
  {
    id: 'doc-7-rest',
    title: 'Post-Call Sleep & Recovery',
    person: 'Suren',
    category: 'Post-Call Rest',
    startDate: `${prefix}-24`,
    startTime: '08:30',
    endDate: `${prefix}-24`,
    endTime: '16:00',
    requiresPostCallRest: true,
    location: 'Home - Master Bedroom',
    notes: 'Mandatory sleep recovery following hospital on-call duty.',
    source: 'doctor_roster'
  },

  // --- NICOLE SCHEDULE ---
  {
    id: 'wife-1',
    title: 'High Court Trial Opening - Commercial Dispute',
    person: 'Nicole',
    category: 'Court Hearing',
    startDate: `${prefix}-03`,
    startTime: '09:00',
    endDate: `${prefix}-03`,
    endTime: '16:30',
    location: 'Supreme High Court 4B',
    notes: 'Lead counsel for cross-examination.',
    source: 'wife_whatsapp'
  },
  {
    id: 'wife-2',
    title: 'Urgent Cross-Border Acquisition Conference Call',
    person: 'Nicole',
    category: 'Late Night Call',
    startDate: `${prefix}-03`,
    startTime: '21:30',
    endDate: `${prefix}-03`,
    endTime: '23:30',
    isCallDuty: true,
    location: 'Home Office (Zoom)',
    notes: 'NY & London legal counsel alignment on acquisition terms.',
    source: 'wife_whatsapp'
  },
  {
    id: 'wife-3',
    title: 'Late Night Client Negotiations',
    person: 'Nicole',
    category: 'Late Night Call',
    startDate: `${prefix}-06`,
    startTime: '20:30',
    endDate: `${prefix}-06`,
    endTime: '22:30',
    isCallDuty: true,
    location: 'Home Office',
    notes: 'Pre-arbitration briefing call.',
    source: 'wife_whatsapp'
  },
  {
    id: 'wife-4',
    title: 'Firm Partner Dinner & Client Retention',
    person: 'Nicole',
    category: 'Client Briefing',
    startDate: `${prefix}-10`,
    startTime: '19:00',
    endDate: `${prefix}-10`,
    endTime: '22:00',
    location: 'Bistro Luxe Downtown',
    notes: 'Networking dinner with key banking client.',
    source: 'wife_whatsapp'
  },
  {
    id: 'wife-5',
    title: 'Arbitration Deposition Session',
    person: 'Nicole',
    category: 'Court Hearing',
    startDate: `${prefix}-14`,
    startTime: '10:00',
    endDate: `${prefix}-14`,
    endTime: '17:00',
    location: 'Law Firm Boardroom 12',
    notes: 'Witness examination.',
    source: 'wife_whatsapp'
  },
  {
    id: 'wife-6',
    title: 'Late Night European Law Briefing',
    person: 'Nicole',
    category: 'Late Night Call',
    startDate: `${prefix}-18`,
    startTime: '21:00',
    endDate: `${prefix}-18`,
    endTime: '23:00',
    isCallDuty: true,
    location: 'Home Office',
    notes: 'Global regulatory compliance update call.',
    source: 'wife_whatsapp'
  },

  // --- GERARD (2 YO SON) & CHILDCARE ---
  {
    id: 'gerard-1',
    title: 'Sunshine Toddler Nursery',
    person: 'Gerard (2yo)',
    category: 'Nursery/Daycare',
    startDate: `${prefix}-03`,
    startTime: '08:30',
    endDate: `${prefix}-03`,
    endTime: '17:00',
    location: 'Sunshine Montessori Toddler Care',
    notes: 'Pack extra snacks and change of clothes for Gerard.',
    source: 'wife_whatsapp'
  },
  {
    id: 'gerard-2',
    title: '24-Month Pediatrician Growth & Vaccine Check',
    person: 'Gerard (2yo)',
    category: 'Pediatrician',
    startDate: `${prefix}-07`,
    startTime: '16:00',
    endDate: `${prefix}-07`,
    endTime: '17:30',
    location: 'KidCare Pediatric Clinic',
    notes: '2-year wellness checkup & booster shot for Gerard.',
    source: 'wife_whatsapp'
  },
  {
    id: 'gerard-3',
    title: 'Gerard Weekend Toddler Gym & Ball Pit',
    person: 'Gerard (2yo)',
    category: 'Playgroup/Park',
    startDate: `${prefix}-08`,
    startTime: '10:00',
    endDate: `${prefix}-08`,
    endTime: '11:30',
    location: 'Little Gym Playland',
    notes: 'Great energy outlet for Gerard!',
    source: 'wife_whatsapp'
  },

  // --- FAMILY & COUPLE EVENTS ---
  {
    id: 'fam-1',
    title: 'Family Saturday Park & Ice Cream with Gerard',
    person: 'Family',
    category: 'Family Outing',
    startDate: `${prefix}-08`,
    startTime: '15:30',
    endDate: `${prefix}-08`,
    endTime: '18:00',
    location: 'Botanical Gardens Playground',
    notes: 'Quality time for Suren & Nicole + 2yo Gerard!',
    source: 'manual'
  },
  {
    id: 'fam-2',
    title: 'Date Night #1 (Post-Call Evening Dinner)',
    person: 'Family',
    category: 'Date Night',
    startDate: `${prefix}-04`,
    startTime: '18:30',
    endDate: `${prefix}-04`,
    endTime: '21:30',
    location: 'Trattoria Bella Vista',
    notes: 'Post-Call Evening Date Night! Suren finished daytime sleep recovery at 16:00 and is fully refreshed.',
    source: 'ai_suggested'
  },
  {
    id: 'fam-3',
    title: 'Date Night #2 - Japanese Omakase',
    person: 'Family',
    category: 'Date Night',
    startDate: `${prefix}-12`,
    startTime: '19:45',
    endDate: `${prefix}-12`,
    endTime: '22:00',
    location: 'Sakura Sushi Lounge',
    notes: 'Gerard is asleep at home with Nanny Maya! Perfect free evening window.',
    source: 'ai_suggested'
  },
  {
    id: 'fam-4',
    title: 'Date Night #3 (Post-Call Sunset Cocktails & Dinner)',
    person: 'Family',
    category: 'Date Night',
    startDate: `${prefix}-24`,
    startTime: '18:30',
    endDate: `${prefix}-24`,
    endTime: '21:30',
    location: 'Rooftop Horizon Lounge',
    notes: 'Post-Call Evening Date Night! Suren fully rested after post-call sleep. Nicole free.',
    source: 'ai_suggested'
  },
  {
    id: 'fam-5',
    title: 'Sunday Family Brunch & Zoo Trip',
    person: 'Family',
    category: 'Family Outing',
    startDate: `${prefix}-22`,
    startTime: '10:00',
    endDate: `${prefix}-22`,
    endTime: '14:30',
    location: 'City Zoo & Picnic Park',
    notes: 'Both Suren & Nicole completely off duty!',
    source: 'manual'
  },
  {
    id: 'fam-6',
    title: 'Post-Call Sunday Family Beach & Splash Park',
    person: 'Family',
    category: 'Family Outing',
    startDate: `${prefix}-16`,
    startTime: '15:30',
    endDate: `${prefix}-16`,
    endTime: '18:30',
    location: 'Sunny Cove Beach & Playground',
    notes: 'Suren post-call sleep completed at 15:00. Family beach time with Suren, Nicole & 2yo Gerard!',
    source: 'ai_suggested'
  },
  {
    id: 'church-1',
    title: 'Sunday Holy Mass & Church Service',
    person: 'Family',
    category: 'Church/Catechism',
    startDate: `${prefix}-02`,
    startTime: '09:00',
    endDate: `${prefix}-02`,
    endTime: '10:30',
    location: 'St. Mary Cathedral',
    notes: 'Weekly family Sunday church worship.',
    source: 'manual'
  },
  {
    id: 'catechism-1',
    title: 'Children Catechism & Sunday School Class',
    person: 'Gerard (2yo)',
    category: 'Church/Catechism',
    startDate: `${prefix}-09`,
    startTime: '10:30',
    endDate: `${prefix}-09`,
    endTime: '11:45',
    location: 'Church Parish Hall',
    notes: 'Toddlers faith formation and catechism session.',
    source: 'manual'
  }
];

export const INITIAL_FREE_SLOTS: FreeSlot[] = [
  {
    id: 'free-0',
    title: 'Family Time: Sunday Family Brunch & Playground Outing',
    type: 'quality_family',
    date: `${prefix}-02`,
    startTime: '10:30',
    endTime: '14:00',
    durationHours: 3.5,
    reason: 'Sunday Off-Duty Golden Window! Zero hospital call shifts or legal briefs for Suren and Nicole. Great post-church outing with 2yo Gerard.',
    score: 9.8
  },
  {
    id: 'free-1',
    title: 'Date Night #1: Post-Call Evening Italian Dinner',
    type: 'couple_date',
    date: `${prefix}-04`,
    startTime: '18:30',
    endTime: '21:30',
    durationHours: 3.0,
    reason: 'Suren completed daytime post-call sleep at 16:00 and is fully energized for the evening! Nicole has no calls, Gerard in bed by 19:30.',
    score: 9.9
  },
  {
    id: 'free-2',
    title: 'Date Night #2: Mid-Month Japanese Omakase',
    type: 'couple_date',
    date: `${prefix}-12`,
    startTime: '19:45',
    endTime: '22:30',
    durationHours: 2.75,
    reason: 'Gerard asleep by 19:30. Zero hospital duty or international calls for Suren & Nicole.',
    score: 9.7
  },
  {
    id: 'free-3',
    title: 'Date Night #3: Post-Call Rooftop Sunset & Cocktails',
    type: 'couple_date',
    date: `${prefix}-24`,
    startTime: '18:30',
    endTime: '21:30',
    durationHours: 3.0,
    reason: 'Post-call evening window! Suren well rested after daytime recovery. Nicole off duty.',
    score: 9.8
  },
  {
    id: 'free-4',
    title: 'Family Time #1: Saturday Botanical Gardens Park & Ice Cream',
    type: 'quality_family',
    date: `${prefix}-08`,
    startTime: '15:30',
    endTime: '18:00',
    durationHours: 2.5,
    reason: 'Suren has no hospital duty, Nicole has no court or calls, Gerard is awake and energetic! Perfect outdoor park time.',
    score: 9.8
  },
  {
    id: 'free-5',
    title: 'Family Time #2: Post-Call Sunday Beach & Splash Park',
    type: 'quality_family',
    date: `${prefix}-16`,
    startTime: '15:30',
    endTime: '18:30',
    durationHours: 3.0,
    reason: 'Suren post-call sleep finishes at 15:00. Great afternoon window for Suren, Nicole & 2yo Gerard at the beach!',
    score: 9.8
  },
  {
    id: 'free-6',
    title: 'Family Time #3: Sunday City Zoo & Picnic Day',
    type: 'quality_family',
    date: `${prefix}-22`,
    startTime: '10:00',
    endTime: '14:30',
    durationHours: 4.5,
    reason: 'Golden weekend window! Zero calls or hospital duties for both parents all day. Great outing with 2yo Gerard.',
    score: 9.9
  }
];

export const INITIAL_CHILDCARE_GAPS: ChildcareGap[] = [
  {
    id: 'gap-1',
    date: `${prefix}-03`,
    startTime: '21:30',
    endTime: '23:30',
    conflictReason: 'CRITICAL OVERLAP: Suren is on 24h Hospital On-Call duty at Acute Unit & Nicole has an urgent 2h Cross-Border Legal Call at home.',
    recommendedSolution: 'Ensure Night Nanny/Grandmother is present at home to respond if 2yo Gerard wakes up during the late call.'
  },
  {
    id: 'gap-2',
    date: `${prefix}-10`,
    startTime: '21:00',
    endTime: '22:00',
    conflictReason: 'Suren starts ICU Night Shift at 21:00 & Nicole is at Firm Partner Client Dinner downtown until 22:00.',
    recommendedSolution: 'Babysitter coverage required from 20:30 to 22:30 at home.'
  }
];

export const SAMPLE_HOSPITAL_ROSTER_TEXT = `
CENTRAL GENERAL HOSPITAL - DEPARTMENT OF MEDICINE
ROSTER FOR SUREN (SENIOR REGISTRAR) - AUGUST 2026

Aug 2 (Sun): OFF DUTY / SUNDAY HOLY MASS & FAMILY BRUNCH
Aug 3 (Mon): 08:00 - 24H ACUTE MEDICAL ON-CALL
Aug 4 (Tue): POST-CALL MANDATORY REST
Aug 5 (Wed): 08:00 - 17:00 OUTPATIENT CLINIC & INTERN ROUNDS
Aug 7 (Fri): 07:30 - 15:30 WARD ROUNDS (WARD 7A)
Aug 10 (Mon): 21:00 - 08:30 OVERNIGHT ICU COVER SHIFT
Aug 11 (Tue): POST-NIGHT SHIFT REST
Aug 15 (Sat): 08:00 - 24H WEEKEND ON-CALL DUTY
Aug 16 (Sun): POST-CALL REST
Aug 19 (Wed): 08:00 - 17:30 DAY SURGICAL THEATER & CLINIC
Aug 23 (Sun): 08:00 - 24H ACUTE MEDICAL UNIT ON-CALL
Aug 24 (Mon): POST-CALL REST
`;

export const SAMPLE_WHATSAPP_CHAT_TEXT = `
[01/08/2026, 08:15] Nicole: Morning dear! Here is my legal schedule & Gerard's items for August:
- Sun Aug 2: Sunday Holy Mass & Church Service 9:00am-10:30am + Family Sunday Brunch 10:30am-2:00pm.
- Aug 3: High Court commercial trial 9am-4:30pm + Late night Zoom call with London legal team 9:30pm-11:30pm.
- Aug 10 to Aug 14 (Mon-Fri): High Court International Arbitration Trial from 9am to 4:30pm every day!
- Aug 18, 19, and 20: Late night European compliance client calls 9pm-11pm each night.
- Aug 24 to Aug 28: Gerard Summer Nursery Toddler Camp (8:30am - 12:30pm).
- Fri Aug 7: Pediatrician 2yo vaccine check for Gerard at 4pm.
- Sat Aug 8: Gerard Little Gym playgroup at 10am + Family park outing at 3:30pm.
- Wed Aug 12: Date Night Japanese Omakase after Gerard's 7:30pm bedtime!

[01/08/2026, 08:22] Suren: Thanks honey! Adding my 24h hospital call duties for August too:
- I'm on 24h hospital on-call duty on Aug 3, Aug 15, and Aug 23!
`;
