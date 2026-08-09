export const STAGES = ["lead", "qualified", "proposal", "won", "lost"];

function parseOptionalId(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  return Number(raw);
}

/** Validate deal input. `value` is accepted in dollars and stored as cents. */
export function validateDeal(input) {
  const errors = {};
  const title = String(input?.title ?? "").trim();
  const stage = String(input?.stage ?? "lead").trim();
  const rawValue = String(input?.value ?? "").trim();
  const contactId = parseOptionalId(input?.contact_id);
  const companyId = parseOptionalId(input?.company_id);

  if (!title) errors.title = "Title is required";

  let valueCents = 0;
  if (rawValue !== "") {
    const dollars = Number(rawValue);
    if (!Number.isFinite(dollars) || dollars < 0)
      errors.value = "Value must be a non-negative number";
    else valueCents = Math.round(dollars * 100);
  }

  if (!STAGES.includes(stage)) errors.stage = "Stage is invalid";
  if (contactId !== null && (!Number.isInteger(contactId) || contactId <= 0))
    errors.contact_id = "Contact is invalid";
  if (companyId !== null && (!Number.isInteger(companyId) || companyId <= 0))
    errors.company_id = "Company is invalid";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      title,
      value_cents: valueCents,
      stage,
      contact_id: contactId,
      company_id: companyId,
    },
  };
}

/** Validate a stage-only change (moving a deal through the pipeline). */
export function validateStageChange(input) {
  const stage = String(input?.stage ?? "").trim();
  if (!STAGES.includes(stage))
    return { valid: false, errors: { stage: "Stage is invalid" } };
  return { valid: true, errors: {}, value: { stage } };
}
