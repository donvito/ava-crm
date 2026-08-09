import { Router } from "express";
import { STAGES, validateDeal, validateStageChange } from "./validation.js";

export function createDealRouter(repository, { contactDirectory, companyDirectory }) {
  const router = Router();

  const enrich = (deal) => ({
    ...deal,
    contact_name:
      deal.contact_id != null
        ? contactDirectory.getName(deal.contact_id) ?? null
        : null,
    company_name:
      deal.company_id != null
        ? companyDirectory.getName(deal.company_id) ?? null
        : null,
  });

  router.get("/stages", (_req, res) => res.json(STAGES));
  router.get("/contact-options", (_req, res) =>
    res.json(contactDirectory.listOptions())
  );
  router.get("/company-options", (_req, res) =>
    res.json(companyDirectory.listOptions())
  );

  router.get("/", (req, res) => {
    const stage = req.query.stage;
    if (stage && !STAGES.includes(stage))
      return res.status(400).json({ errors: { stage: "Stage is invalid" } });
    res.json(repository.list({ stage }).map(enrich));
  });

  router.post("/", (req, res) => {
    const { valid, errors, value } = validateDeal(req.body);
    if (!valid) return res.status(400).json({ errors });
    res.status(201).json(enrich(repository.create(value)));
  });

  router.get("/:id", (req, res) => {
    const deal = repository.get(Number(req.params.id));
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    res.json(enrich(deal));
  });

  router.patch("/:id/stage", (req, res) => {
    const { valid, errors, value } = validateStageChange(req.body);
    if (!valid) return res.status(400).json({ errors });
    const deal = repository.setStage(Number(req.params.id), value.stage);
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    res.json(enrich(deal));
  });

  router.delete("/:id", (req, res) => {
    if (!repository.remove(Number(req.params.id)))
      return res.status(404).json({ error: "Deal not found" });
    res.status(204).end();
  });

  return router;
}
