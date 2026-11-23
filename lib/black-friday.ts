// Kyiv is UTC+02:00 throughout the November 2026 campaign.
const startsAt = Date.parse("2026-11-23T08:00:00+02:00");
const standardEnd = Date.parse("2026-11-28T00:00:00+02:00");
const extendedEnd = Date.parse("2026-11-29T08:00:00+02:00");

export const BLACK_FRIDAY_LABEL = "Чорна п’ятниця 2026";

export function blackFridaySchedule(
  now = Date.now(),
  extended = process.env.BF_BLACK_FRIDAY_2026_EXTENDED === "true"
) {
  const endsAt = extended ? extendedEnd : standardEnd;
  const active = now >= startsAt && now < endsAt;
  const nextChange = now < startsAt ? startsAt : active ? endsAt : null;
  return { active, refreshAfterMs: nextChange === null ? null : nextChange - now };
}
