const WEBSITE_PATTERN = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/;

/** Validate company input. Returns { valid, errors, value }. */
export function validateCompany(input) {
  const errors = {};
  const name = String(input?.name ?? "").trim();
  const industry = String(input?.industry ?? "").trim();
  const website = String(input?.website ?? "").trim();

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
