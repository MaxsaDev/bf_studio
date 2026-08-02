import { describe, it, expect } from "vitest";
import {
  formatPhoneDisplay,
  formatPhoneForAPI,
  UA_PHONE_DISPLAY_REGEX,
} from "../phone";

describe("formatPhoneDisplay", () => {
  it("formats progressive typing", () => {
    expect(formatPhoneDisplay("0")).toBe("+38 (0");
    expect(formatPhoneDisplay("096")).toBe("+38 (096");
    expect(formatPhoneDisplay("0969")).toBe("+38 (096) 9");
    expect(formatPhoneDisplay("0969189089")).toBe("+38 (096) 918-90-89");
  });

  it("handles pasted international numbers", () => {
    expect(formatPhoneDisplay("+380969189089")).toBe("+38 (096) 918-90-89");
    expect(formatPhoneDisplay("380969189089")).toBe("+38 (096) 918-90-89");
  });

  it("prepends national 0 when missing", () => {
    expect(formatPhoneDisplay("969189089")).toBe("+38 (096) 918-90-89");
  });

  it("returns empty string when cleared", () => {
    expect(formatPhoneDisplay("")).toBe("");
    expect(formatPhoneDisplay("+38 (")).toBe("");
  });

  it("truncates extra digits", () => {
    expect(formatPhoneDisplay("09691890891234")).toBe("+38 (096) 918-90-89");
  });

  it("produces output matching the validation regex when complete", () => {
    expect(formatPhoneDisplay("0969189089")).toMatch(UA_PHONE_DISPLAY_REGEX);
  });
});

describe("formatPhoneForAPI", () => {
  it("converts display format", () => {
    expect(formatPhoneForAPI("+38 (096) 918-90-89")).toBe("+380969189089");
  });

  it("handles national format", () => {
    expect(formatPhoneForAPI("0969189089")).toBe("+380969189089");
  });

  it("keeps already-international digits", () => {
    expect(formatPhoneForAPI("380969189089")).toBe("+380969189089");
  });
});
