export interface CompanyInput {
  name: string;
  industry: string;
  website: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  errors: Record<string, string>;
  value: T;
}

const WEBSITE_PATTERN = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/;

/** Validate company input. Returns { valid, errors, value }. */
export function validateCompany(input: unknown): ValidationResult<CompanyInput> {
  const raw = (input ?? {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const name = String(raw.name ?? "").trim();
  const industry = String(raw.industry ?? "").trim();
  const website = String(raw.website ?? "").trim();

  if (!name) errors.name = "Name is required";
  else if (name.length > 200) errors.name = "Name must be 200 characters or fewer";

  if (website && !WEBSITE_PATTERN.test(website))
    errors.website = "Website must be a valid URL";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: { name, industry, website },
  };
}
