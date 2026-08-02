/**
 * Ukrainian phone number helpers.
 * Display format: +38 (0XX) XXX-XX-XX
 * API format: +380XXXXXXXXX
 */

export const UA_PHONE_DISPLAY_REGEX = /^\+38 \(0\d{2}\) \d{3}-\d{2}-\d{2}$/;

/**
 * Format arbitrary input (typing, paste of "+380...", "0...", "380...")
 * into the display mask. Returns "" when cleared so the field is deletable.
 */
export function formatPhoneDisplay(value: string): string {
  let digits = value.replace(/\D/g, "");

  // Strip country code, keep the national leading 0
  if (digits.startsWith("380")) digits = digits.slice(2);
  else if (digits.startsWith("38")) digits = digits.slice(2);
  if (digits && !digits.startsWith("0")) digits = `0${digits}`;
  digits = digits.slice(0, 10);

  if (!digits) return "";

  let out = `+38 (${digits.slice(0, 3)}`;
  if (digits.length > 3) out += `) ${digits.slice(3, 6)}`;
  if (digits.length > 6) out += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) out += `-${digits.slice(8, 10)}`;
  return out;
}

/** Display or raw input → +380XXXXXXXXX */
export function formatPhoneForAPI(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("38")) {
    return `+${digits}`;
  }

  return `+38${digits}`;
}
