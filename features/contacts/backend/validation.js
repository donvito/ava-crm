const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validate contact input. Returns { valid, errors, value }. */
export function validateContact(input) {
  const errors = {};
  const firstName = String(input?.first_name ?? "").trim();
  const lastName = String(input?.last_name ?? "").trim();
  const email = String(input?.email ?? "").trim();
  const phone = String(input?.phone ?? "").trim();
  const rawCompanyId = input?.company_id;
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
