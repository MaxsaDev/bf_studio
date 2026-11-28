// Kyiv is UTC+02:00 throughout the November 2026 campaign.
const startsAt = Date.parse("2026-11-23T08:00:00+02:00");
// First cutoff was Nov 28 00:00; the studio extended the campaign to 20:00 that day.
const endsAt = Date.parse("2026-11-28T20:00:00+02:00");

export const BLACK_FRIDAY_LABEL = "Чорна п’ятниця 2026";

export function blackFridaySchedule(now = Date.now()) {
  const active = now >= startsAt && now < endsAt;
  const nextChange = now < startsAt ? startsAt : active ? endsAt : null;
  return { active, refreshAfterMs: nextChange === null ? null : nextChange - now };
}
