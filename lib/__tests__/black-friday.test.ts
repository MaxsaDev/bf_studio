import { describe, expect, it } from "vitest";
import { certificates } from "@/data/certificates";
import { blackFridaySchedule } from "@/lib/black-friday";
import { resolvePrice } from "@/lib/pricing";

describe("Black Friday 2026 in Kyiv", () => {
  it.each([
    ["2026-11-23T07:59:59+02:00", false],
    ["2026-11-23T08:00:00+02:00", true],
    ["2026-11-28T00:00:00+02:00", true],
    ["2026-11-28T19:59:59+02:00", true],
    ["2026-11-28T20:00:00+02:00", false],
    ["2026-11-29T08:00:00+02:00", false],
  ] as const)("at %s active=%s", (time, expected) => {
    expect(blackFridaySchedule(Date.parse(time)).active).toBe(expected);
  });

  it("refreshes open pages exactly at 20:00 Kyiv, and never after", () => {
    expect(blackFridaySchedule(Date.parse("2026-11-28T19:00:00+02:00")).refreshAfterMs)
      .toBe(60 * 60 * 1000);
    expect(blackFridaySchedule(Date.parse("2026-11-28T20:00:00+02:00")).refreshAfterMs)
      .toBeNull();
  });

  it("matches the sheet for every purchasable variant and restores the regular price", () => {
    // [certificate, variant, Black Friday price, regular price including loyalty]
    const sheet: [number, string | null, number, number][] = [
      [9, null, 450, 500], [10, null, 900, 1000], [11, null, 1800, 2000],
      [12, null, 2700, 3000], [13, null, 4500, 5000],
      [26, null, 8500, 10000], [27, null, 17000, 20000],
      [8, "session", 1215, 1350], [8, "course", 6885, 7695],
      [7, "session", 1215, 1350], [7, "course", 6885, 7695],
      [4, "session", 990, 1100], [4, "course", 5610, 6270],
      [6, "session", 1215, 1350], [6, "course", 6885, 7695],
      [1, "session", 1260, 1400], [2, "session", 1260, 1400],
      [2, "express", 7140, 7980], [1, "basic", 11900, 13300],
      [5, "session", 1350, 1500], [5, "course", 7650, 8550],
      [3, null, 2970, 3300], [23, null, 1170, 1300], [22, null, 1710, 1900],
      [24, null, 1395, 1550], [25, null, 1710, 1900],
      [15, null, 450, 500], [16, null, 900, 1000], [14, null, 1800, 2000],
      [17, null, 3375, 3750], [18, null, 3600, 4000], [19, null, 4500, 5000],
      [20, null, 5400, 6000], [21, null, 4455, 4950],
    ];
    const actual = certificates.flatMap((certificate) => {
      const variants = certificate.type === "massage_course"
        ? certificate.variants.map((v) => v.id)
        : [null];
      return variants.map((id) => [
        certificate.id,
        id,
        resolvePrice(certificate, id, true).finalPrice,
        resolvePrice(certificate, id, false).finalPrice,
      ]);
    });
    expect(actual).toHaveLength(sheet.length);
    expect(actual).toEqual(expect.arrayContaining(sheet));
  });
});
