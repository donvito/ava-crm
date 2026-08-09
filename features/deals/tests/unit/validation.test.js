import { describe, expect, it } from "vitest";
import { STAGES, validateDeal, validateStageChange } from "../../backend/validation.js";

describe("validateDeal", () => {
  it("accepts a minimal valid deal and defaults stage to lead", () => {
    const result = validateDeal({ title: "Big deal" });
    expect(result.valid).toBe(true);
    expect(result.value).toEqual({
      title: "Big deal",
      value_cents: 0,
      stage: "lead",
      contact_id: null,
      company_id: null,
    });
  });

  it("converts dollar values to cents", () => {
    expect(validateDeal({ title: "D", value: "1234.56" }).value.value_cents).toBe(
      123456
    );
    expect(validateDeal({ title: "D", value: "0.1" }).value.value_cents).toBe(10);
  });

  it("requires a title", () => {
    const result = validateDeal({ title: "  " });
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBe("Title is required");
  });

  it("rejects negative or non-numeric values", () => {
    expect(validateDeal({ title: "D", value: "-5" }).valid).toBe(false);
    expect(validateDeal({ title: "D", value: "abc" }).valid).toBe(false);
  });

  it("rejects unknown stages", () => {
    const result = validateDeal({ title: "D", stage: "unicorn" });
    expect(result.valid).toBe(false);
    expect(result.errors.stage).toBe("Stage is invalid");
  });
});

describe("validateStageChange", () => {
  it("accepts every known stage", () => {
    for (const stage of STAGES)
      expect(validateStageChange({ stage }).valid).toBe(true);
  });

  it("rejects unknown stages", () => {
    expect(validateStageChange({ stage: "nope" }).valid).toBe(false);
    expect(validateStageChange({}).valid).toBe(false);
  });
});
