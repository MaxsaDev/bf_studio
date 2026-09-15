import { describe, it, expect, vi } from "vitest";

// Flip the site-wide switch off for this file only
vi.mock("@/lib/site-config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/site-config")>();
  return {
    ...actual,
    siteConfig: {
      ...actual.siteConfig,
      features: {
        ...actual.siteConfig.features,
        addons: { enabled: false },
      },
    },
  };
});

import { certificates } from "@/data/certificates";
import {
  getAvailableAddons,
  isAddonUpsellEnabled,
  resolveAddonLines,
  validateAddonSelection,
} from "../addons";

const gift = certificates.find((c) => c.id === 9)!;

describe("add-on upsell switched off in site-config", () => {
  it("reports disabled", () => {
    expect(isAddonUpsellEnabled()).toBe(false);
  });

  it("offers nothing, even for products that list add-ons", () => {
    expect(getAvailableAddons(gift)).toEqual([]);
    expect(resolveAddonLines(gift, null, { candles: 1 })).toEqual([]);
  });

  it("rejects any add-on on the server side", () => {
    expect(validateAddonSelection(gift, null, [{ id: "candles", qty: 1 }]).ok).toBe(false);
    expect(validateAddonSelection(gift, null, []).ok).toBe(true);
  });
});
