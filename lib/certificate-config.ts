/**
 * Certificate Visual Configuration
 *
 * Centralized configuration for all certificate card visuals.
 * Change settings here to update across all certificate types.
 */

// ============================================================================
// VISUAL SETTINGS
// ============================================================================

/**
 * Certificate card background image
 * Used across all certificate types
 */
export const CERTIFICATE_IMAGE = "/bf_card_white_template.jpg";

/**
 * Image overlay darkness
 * true = darker overlay for better text contrast
 * false = lighter overlay
 */
export const CERTIFICATE_IMAGE_DARK_OVERLAY = false;

/**
 * Maximum card width in pixels
 */
export const CERTIFICATE_MAX_WIDTH = 650;

// ============================================================================
// NAMED CERTIFICATE COLORS (Gemstone Collection)
// ============================================================================

/**
 * Color mapping for named gift certificates
 * Each gemstone name maps to its brand color
 */
export const NAMED_CERTIFICATE_COLORS: Record<string, string> = {
  Смарагдовий: "#4da28f", // Emerald
  Сапфіровий: "#00587c", // Sapphire
  Рубіновий: "#e5403a", // Ruby
};

/**
 * Default color for named certificates if no match found
 */
export const NAMED_CERTIFICATE_DEFAULT_COLOR = undefined;

/**
 * Background color for named certificates
 */
export const NAMED_CERTIFICATE_BACKGROUND = "bg-stone-100 dark:bg-stone-900";

// ============================================================================
// MASTER CLASS SETTINGS
// ============================================================================

/**
 * Subtitle text for all master classes
 */
export const MASTER_CLASS_SUBTITLE = "Майстер клас";

/**
 * Subtitle color for master classes
 */
export const MASTER_CLASS_SUBTITLE_COLOR = "#f8bf00";

// ============================================================================
// SPECIAL CERTIFICATE SETTINGS
// ============================================================================

/**
 * Subtitle text for special certificates
 */
export const SPECIAL_CERTIFICATE_SUBTITLE = "ОСОБЛИВИЙ СЕАНС";

/**
 * Title color for special certificates (Gold)
 */
export const SPECIAL_CERTIFICATE_COLOR = "#d4af37";

// ============================================================================
// TYPOGRAPHY SETTINGS
// ============================================================================

/**
 * Gift certificate denomination typography
 */
export const GIFT_CERT_DENOMINATION_SIZE = "text-[6rem] sm:text-[8rem]";
export const GIFT_CERT_CURRENCY_SIZE = "text-2xl sm:text-3xl";

/**
 * Named certificate title typography
 */
export const NAMED_CERT_TITLE_SIZE = "text-[3rem] sm:text-[4rem]";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color for named certificate by theme name
 */
export function getNamedCertificateColor(
  themeName: string
): string | undefined {
  return NAMED_CERTIFICATE_COLORS[themeName] ?? NAMED_CERTIFICATE_DEFAULT_COLOR;
}

/**
 * Extract theme name from certificate description
 */
export function extractThemeName(title: string): string {
  const themeMatch = title.match(/(.*?)$/);
  return themeMatch ? themeMatch[1] : "Premium";
}
