import { Router } from "express";
import { validateCompany } from "./validation.js";

export function createCompanyRouter(repository) {
  const router = Router();

  router.get("/", (_req, res) => res.json(repository.list()));

  router.post("/", (req, res) => {
    const { valid, errors, value } = validateCompany(req.body);
    if (!valid) return res.status(400).json({ errors });
    res.status(201).json(repository.create(value));
  });

  router.get("/:id", (req, res) => {
    const company = repository.get(Number(req.params.id));
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company);
  });

  router.put("/:id", (req, res) => {
    const { valid, errors, value } = validateCompany(req.body);
    if (!valid) return res.status(400).json({ errors });
    const company = repository.update(Number(req.params.id), value);
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company);
  });

  router.delete("/:id", (req, res) => {
    if (!repository.remove(Number(req.params.id)))
      return res.status(404).json({ error: "Company not found" });
    res.status(204).end();
  });

  return router;
}
