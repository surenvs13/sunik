import { ScheduleEvent } from '../types';

export const addDaysToDateStr = (dateStr: string, days: number = 1): string => {
  if (!dateStr) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Ensures that every On-Call or Night Duty shift for Suren (or doctor)
 * ends at 12 midnight (00:00) on the call date and is followed by a 
 * Post-Call Rest event on the next day.
 */
export const ensurePostCallRestForEvents = (
  events: ScheduleEvent[],
  husbandName: string = 'Suren'
): ScheduleEvent[] => {
  const result: ScheduleEvent[] = [];

  // Step 1: Normalize existing events (capping Suren's calls to 12 Midnight)
  events.forEach((originalEvent) => {
    const event = { ...originalEvent };
    const personLower = (event.person || '').toLowerCase();
    const isSuren =
      event.person === husbandName ||
      personLower.includes('suren') ||
      personLower.includes('husband') ||
      personLower.includes('doctor');

    const catLower = (event.category || '').toLowerCase();
    const titleLower = (event.title || '').toLowerCase();

    const isOnCallDuty =
      event.category === 'On-Call 24h' ||
      event.isCallDuty === true ||
      catLower.includes('on-call') ||
      catLower.includes('call duty') ||
      titleLower.includes('on-call') ||
      titleLower.includes('24h call') ||
      titleLower.includes('on call');

    if (isSuren && isOnCallDuty) {
      // Set call shift to end strictly at 12 midnight (00:00) on the same day
      event.endDate = event.startDate;
      event.endTime = '00:00';
      event.requiresPostCallRest = true;
      event.isCallDuty = true;
      if (!event.title.includes('12 Midnight') && !event.title.includes('Midnight')) {
        event.title = event.title.replace(/24h/gi, 'On-Call').trim();
        if (!event.title.includes('Midnight')) {
          event.title = `${event.title} (Until 12 Midnight)`;
        }
      }
    }

    result.push(event);
  });

  // Step 2: Ensure every call duty shift for Suren has a Post-Call Rest on the next day
  result.forEach((event) => {
    const personLower = (event.person || '').toLowerCase();
    const isSuren =
      event.person === husbandName ||
      personLower.includes('suren') ||
      personLower.includes('husband') ||
      personLower.includes('doctor');

    const catLower = (event.category || '').toLowerCase();
    const titleLower = (event.title || '').toLowerCase();

    const isOnCallDuty =
      event.category === 'On-Call 24h' ||
      event.category === 'Night Shift' ||
      event.isCallDuty === true ||
      event.requiresPostCallRest === true ||
      catLower.includes('on-call') ||
      catLower.includes('night shift') ||
      titleLower.includes('on-call') ||
      titleLower.includes('24h call') ||
      titleLower.includes('night shift') ||
      titleLower.includes('icu shift');

    if (isSuren && isOnCallDuty && event.category !== 'Post-Call Rest') {
      const restDate = addDaysToDateStr(event.startDate, 1);

      // Check if a Post-Call Rest event already exists on restDate for Suren
      const hasPostCallRest = result.some((e) => {
        const ePersonLower = (e.person || '').toLowerCase();
        const eMatchPerson =
          e.person === event.person ||
          (isSuren &&
            (ePersonLower.includes('suren') ||
              ePersonLower.includes('husband') ||
              ePersonLower.includes('doctor')));

        if (!eMatchPerson) return false;

        const isRestDate = e.startDate === restDate || e.endDate === restDate;
        if (!isRestDate) return false;

        const eCatLower = (e.category || '').toLowerCase();
        const eTitleLower = (e.title || '').toLowerCase();

        return (
          e.category === 'Post-Call Rest' ||
          eCatLower.includes('post-call') ||
          eCatLower.includes('post-night') ||
          eTitleLower.includes('post-call') ||
          eTitleLower.includes('post night') ||
          eTitleLower.includes('sleep & recovery')
        );
      });

      if (!hasPostCallRest) {
        result.push({
          id: `post-call-rest-auto-${event.id}-${Date.now()}`,
          title: 'Post-Call Sleep & Fatigue Recovery',
          person: event.person,
          category: 'Post-Call Rest',
          startDate: restDate,
          startTime: '08:30',
          endDate: restDate,
          endTime: '16:00',
          isCallDuty: false,
          isNightShift: false,
          requiresPostCallRest: true,
          location: 'Home / Recovery Rest',
          notes: `Mandatory post-call rest following ${event.title} (${event.startDate})`,
          source: 'doctor_roster'
        });
      }
    }
  });

  return result;
};
