export interface FamilyNames {
  husband: string;
  wife: string;
  child: string;
}

export type PersonType = string; // Suren | Nicole | Gerard (2yo) | Family or custom names

export type EventCategory = 
  | 'On-Call 24h'
  | 'Night Shift'
  | 'Day Clinic'
  | 'Post-Call Rest'
  | 'Ward Rounds'
  | 'Court Hearing'
  | 'Late Night Call'
  | 'Client Briefing'
  | 'Nursery/Daycare'
  | 'Pediatrician'
  | 'Playgroup/Park'
  | 'Family Outing'
  | 'Date Night'
  | 'Bedtime Routine'
  | 'Church/Catechism'
  | 'Custom Event'
  | 'Other';

export interface ScheduleEvent {
  id: string;
  title: string;
  person: PersonType;
  category: EventCategory;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endDate: string;   // YYYY-MM-DD
  endTime: string;   // HH:MM
  isCallDuty?: boolean;
  isNightShift?: boolean;
  requiresPostCallRest?: boolean;
  location?: string;
  notes?: string;
  source?: 'doctor_roster' | 'wife_whatsapp' | 'manual' | 'ai_suggested';
}

export interface FreeSlot {
  id: string;
  title: string;
  type: 'quality_family' | 'couple_date' | 'doctor_solo_rest' | 'lawyer_solo_rest';
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  reason: string;
  score: number; // 1-10
}

export interface ChildcareGap {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  conflictReason: string;
  recommendedSolution: string;
}

export interface AIAnalysisResult {
  freeSlots: FreeSlot[];
  childcareGaps: ChildcareGap[];
  wellnessAdvice: string[];
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  actionType: 'ADD' | 'DELETE' | 'EDIT' | 'BATCH_ADD' | 'RESET';
  description: string;
  affectedPerson?: string;
  eventTitle?: string;
  eventDate?: string;
  previousEventsSnapshot: ScheduleEvent[];
}
