import { describe, expect, it } from "vitest";
import { validateContact } from "../../backend/validation";

describe("validateContact", () => {
  const valid = {
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@example.com",
  };

  it("accepts a valid contact without a company", () => {
    const result = validateContact(valid);
    expect(result.valid).toBe(true);
    expect(result.value.company_id).toBeNull();
  });

  it("coerces empty company_id to null and numeric strings to numbers", () => {
    expect(validateContact({ ...valid, company_id: "" }).value.company_id).toBeNull();
    expect(validateContact({ ...valid, company_id: "3" }).value.company_id).toBe(3);
  });

  it("requires first name, last name and email", () => {
    const result = validateContact({});
    expect(result.valid).toBe(false);
    expect(result.errors).toMatchObject({
      first_name: "First name is required",
      last_name: "Last name is required",
      email: "Email is required",
    });
  });

  it("rejects malformed emails", () => {
    const result = validateContact({ ...valid, email: "not-an-email" });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("Email must be a valid address");
  });

  it("rejects non-positive or non-integer company ids", () => {
    expect(validateContact({ ...valid, company_id: "-1" }).valid).toBe(false);
    expect(validateContact({ ...valid, company_id: "abc" }).valid).toBe(false);
  });
});
