import { describe, expect, it } from "vitest";
import { validateCompany } from "../../backend/validation.js";

describe("validateCompany", () => {
  it("accepts a minimal valid company", () => {
    const result = validateCompany({ name: "Acme Corp" });
    expect(result.valid).toBe(true);
    expect(result.value).toEqual({ name: "Acme Corp", industry: "", website: "" });
  });

  it("trims whitespace", () => {
    const result = validateCompany({ name: "  Acme  ", industry: " SaaS " });
    expect(result.value.name).toBe("Acme");
    expect(result.value.industry).toBe("SaaS");
  });

  it("rejects a missing name", () => {
    const result = validateCompany({ name: "   " });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe("Name is required");
  });

  it("rejects an invalid website", () => {
    const result = validateCompany({ name: "Acme", website: "not a url" });
    expect(result.valid).toBe(false);
    expect(result.errors.website).toMatch(/valid URL/);
  });

  it("accepts websites with and without protocol", () => {
    expect(validateCompany({ name: "A", website: "acme.com" }).valid).toBe(true);
    expect(
      validateCompany({ name: "A", website: "https://acme.com/about" }).valid
    ).toBe(true);
  });
});
