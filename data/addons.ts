import type { Addon, AddonId, AddonLimits } from "@/types/addon";

/**
 * Source: "bf-card-additions" sheet, rows 1-3 (title, fiscal name, price).
 * Array order is the display order in checkout and on the card.
 */
export const addons: Addon[] = [
  {
    id: "foot_massage",
    title: "Масаж стоп",
    fiscalTitle: 'Додаток до масажу "Масаж стоп"',
    price: 400,
    icon: "/addons/foot-massage.svg",
  },
  {
    id: "hand_massage",
    title: "Масаж долонь",
    fiscalTitle: 'Додаток до масажу "Масаж долонь"',
    price: 400,
    icon: "/addons/hand-massage.svg",
  },
  {
    id: "head_massage",
    title: "Масаж голови",
    fiscalTitle: 'Додаток до масажу "Масаж голови"',
    price: 400,
    icon: "/addons/head-massage.svg",
  },
  {
    id: "aroma_oils",
    title: "Ефірні олії",
    fiscalTitle: 'Додаток до масажу "Ефірна олія"',
    price: 100,
    icon: "/addons/aroma-oils.svg",
  },
  {
    id: "candles",
    title: "Композиція свічок",
    fiscalTitle: 'Додаток до масажу "Композиція свічок у кабінет"',
    price: 125,
    icon: "/addons/candles.svg",
  },
  {
    id: "extra_time",
    title: "Збільшення часу сеансу",
    fiscalTitle: 'Додаток до масажу "Збільшення часу сеансу"',
    price: 750,
    icon: "/addons/extra-time.svg",
  },
];

/** Non-empty tuple form for zod enums */
export const ADDON_IDS = addons.map((a) => a.id) as [AddonId, ...AddonId[]];

/** Hard cap from the sheet ("6 - пропонувати обрати кількість від 0 до 6") */
export const ADDON_MAX_QTY = 6;

/** Sheet preset: single sessions, gift and named cards offer one of each */
export const ADDONS_SINGLE: AddonLimits = {
  foot_massage: 1,
  hand_massage: 1,
  head_massage: 1,
  aroma_oils: 1,
  candles: 1,
  extra_time: 1,
};

/** Sheet preset: full courses let the buyer pick 0-6 of each */
export const ADDONS_COURSE: AddonLimits = {
  foot_massage: 6,
  hand_massage: 6,
  head_massage: 6,
  aroma_oils: 6,
  candles: 6,
  extra_time: 6,
};

export function getAddon(id: AddonId): Addon | undefined {
  return addons.find((a) => a.id === id);
}
