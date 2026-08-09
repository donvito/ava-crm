import { Router } from "express";
import { validateContact } from "./validation.js";

export function createContactRouter(repository, companyDirectory) {
  const router = Router();

  const withCompanyName = (contact) => ({
    ...contact,
    company_name:
      contact.company_id != null
        ? companyDirectory.getName(contact.company_id) ?? null
        : null,
  });

  // Options for the company <select>, resolved through the CompanyDirectory contract.
  router.get("/company-options", (_req, res) =>
    res.json(companyDirectory.listOptions())
  );

  router.get("/", (_req, res) =>
    res.json(repository.list().map(withCompanyName))
  );

  router.post("/", (req, res) => {
    const { valid, errors, value } = validateContact(req.body);
    if (!valid) return res.status(400).json({ errors });
    res.status(201).json(withCompanyName(repository.create(value)));
  });

  router.get("/:id", (req, res) => {
    const contact = repository.get(Number(req.params.id));
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json(withCompanyName(contact));
  });

  router.put("/:id", (req, res) => {
    const { valid, errors, value } = validateContact(req.body);
    if (!valid) return res.status(400).json({ errors });
    const contact = repository.update(Number(req.params.id), value);
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json(withCompanyName(contact));
  });

  router.delete("/:id", (req, res) => {
    if (!repository.remove(Number(req.params.id)))
      return res.status(404).json({ error: "Contact not found" });
    res.status(204).end();
  });

  return router;
}
