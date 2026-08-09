export interface ContactInput {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_id: number | null;
}

export interface ValidationResult<T> {
  valid: boolean;
  errors: Record<string, string>;
  value: T;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validate contact input. Returns { valid, errors, value }. */
export function validateContact(input: unknown): ValidationResult<ContactInput> {
  const raw = (input ?? {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const firstName = String(raw.first_name ?? "").trim();
  const lastName = String(raw.last_name ?? "").trim();
  const email = String(raw.email ?? "").trim();
  const phone = String(raw.phone ?? "").trim();
  const rawCompanyId = raw.company_id;
  const companyId =
    rawCompanyId === undefined || rawCompanyId === null || rawCompanyId === ""
      ? null
      : Number(rawCompanyId);

  if (!firstName) errors.first_name = "First name is required";
  if (!lastName) errors.last_name = "Last name is required";
  if (!email) errors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Email must be a valid address";
  if (companyId !== null && (!Number.isInteger(companyId) || companyId <= 0))
    errors.company_id = "Company is invalid";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      company_id: companyId,
    },
  };
}
