export const STAGES = ["lead", "qualified", "proposal", "won", "lost"] as const;
export type Stage = (typeof STAGES)[number];

export interface DealInput {
  title: string;
  value_cents: number;
  stage: Stage;
  contact_id: number | null;
  company_id: number | null;
}

export interface ValidationResult<T> {
  valid: boolean;
  errors: Record<string, string>;
  value: T;
}

function parseOptionalId(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  return Number(raw);
}

/** Validate deal input. `value` is accepted in dollars and stored as cents. */
export function validateDeal(input: unknown): ValidationResult<DealInput> {
  const raw = (input ?? {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const title = String(raw.title ?? "").trim();
  const stage = String(raw.stage ?? "lead").trim();
  const rawValue = String(raw.value ?? "").trim();
  const contactId = parseOptionalId(raw.contact_id);
  const companyId = parseOptionalId(raw.company_id);

  if (!title) errors.title = "Title is required";

  let valueCents = 0;
  if (rawValue !== "") {
    const dollars = Number(rawValue);
    if (!Number.isFinite(dollars) || dollars < 0)
      errors.value = "Value must be a non-negative number";
    else valueCents = Math.round(dollars * 100);
  }

  if (!STAGES.includes(stage as Stage)) errors.stage = "Stage is invalid";
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
      stage: stage as Stage,
      contact_id: contactId,
      company_id: companyId,
    },
  };
}

/** Validate a stage-only change (moving a deal through the pipeline). */
export function validateStageChange(
  input: unknown
): ValidationResult<{ stage: Stage }> {
  const raw = (input ?? {}) as Record<string, unknown>;
  const stage = String(raw.stage ?? "").trim();
  if (!STAGES.includes(stage as Stage))
    return {
      valid: false,
      errors: { stage: "Stage is invalid" },
      value: { stage: "lead" },
    };
  return { valid: true, errors: {}, value: { stage: stage as Stage } };
}
