import express from "express";
import {
  CONTACT_STATUSES,
  DEAL_STAGES,
  createCrmStore,
} from "./database.js";

function cleanString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asContact(input, existing = {}) {
  return {
    firstName: cleanString(input.firstName, existing.firstName),
    lastName: cleanString(input.lastName, existing.lastName),
    email: cleanString(input.email, existing.email).toLowerCase(),
    phone: cleanString(input.phone, existing.phone),
    company: cleanString(input.company, existing.company),
    title: cleanString(input.title, existing.title),
    status: cleanString(input.status, existing.status || "Lead"),
    source: cleanString(input.source, existing.source || "Website"),
    city: cleanString(input.city, existing.city),
    notes: cleanString(input.notes, existing.notes),
  };
}

function validateContact(contact) {
  const errors = {};

  if (!contact.firstName) errors.firstName = "First name is required.";
  if (!contact.lastName) errors.lastName = "Last name is required.";
  if (!contact.company) errors.company = "Company is required.";
  if (!contact.email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!CONTACT_STATUSES.includes(contact.status)) {
    errors.status = "Choose a valid relationship.";
  }

  return errors;
}

function asDeal(input, existing = {}) {
  const rawValue = input.value ?? existing.value ?? 0;
  const rawProbability = input.probability ?? existing.probability ?? 25;
  const rawContactId = input.contactId ?? existing.contactId ?? null;

  return {
    name: cleanString(input.name, existing.name),
    contactId:
      rawContactId === null || rawContactId === ""
        ? null
        : Number.parseInt(rawContactId, 10),
    company: cleanString(input.company, existing.company),
    value: Math.round(Number(rawValue)),
    stage: cleanString(input.stage, existing.stage || "Qualified"),
    probability: Math.round(Number(rawProbability)),
    closeDate: cleanString(input.closeDate, existing.closeDate) || null,
  };
}

function validateDeal(deal) {
  const errors = {};

  if (!deal.name) errors.name = "Deal name is required.";
  if (!deal.company) errors.company = "Company is required.";
  if (!Number.isFinite(deal.value) || deal.value <= 0) {
    errors.value = "Enter an amount greater than zero.";
  }
  if (!DEAL_STAGES.includes(deal.stage)) {
    errors.stage = "Choose a valid pipeline stage.";
  }
  if (
    !Number.isInteger(deal.probability) ||
    deal.probability < 0 ||
    deal.probability > 100
  ) {
    errors.probability = "Probability must be between 0 and 100.";
  }
  if (deal.contactId !== null && !Number.isInteger(deal.contactId)) {
    errors.contactId = "Choose a valid contact.";
  }

  return errors;
}

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

function parseId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function createCrmApp(options = {}) {
  const store =
    options.store ??
    createCrmStore({
      databasePath: options.databasePath,
      reset: options.reset,
      seed: options.seed,
    });
  const app = express();

  app.locals.crmStore = store;
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok", database: "sqlite" });
  });

  app.get("/api/meta", (_request, response) => {
    response.json({
      contactStatuses: CONTACT_STATUSES,
      dealStages: DEAL_STAGES,
    });
  });

  app.get("/api/dashboard", (_request, response) => {
    response.json(store.getDashboard());
  });

  app.get("/api/contacts", (request, response) => {
    const status = cleanString(request.query.status, "All");
    if (status !== "All" && !CONTACT_STATUSES.includes(status)) {
      return response.status(400).json({ message: "Invalid contact status." });
    }

    return response.json({
      contacts: store.listContacts({
        search: cleanString(request.query.search),
        status,
      }),
    });
  });

  app.get("/api/contacts/:id", (request, response) => {
    const id = parseId(request.params.id);
    const contact = id ? store.getContact(id) : null;
    if (!contact) {
      return response.status(404).json({ message: "Contact not found." });
    }
    return response.json({ contact });
  });

  app.post("/api/contacts", (request, response, next) => {
    try {
      const contact = asContact(request.body ?? {});
      const errors = validateContact(contact);
      if (hasErrors(errors)) {
        return response
          .status(422)
          .json({ message: "Check the highlighted fields.", errors });
      }

      return response.status(201).json({ contact: store.createContact(contact) });
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return response.status(409).json({
          message: "A contact with this email already exists.",
          errors: { email: "This email is already in your contacts." },
        });
      }
      return next(error);
    }
  });

  app.patch("/api/contacts/:id", (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      const existing = id ? store.getContact(id) : null;
      if (!existing) {
        return response.status(404).json({ message: "Contact not found." });
      }

      const contact = asContact(request.body ?? {}, existing);
      const errors = validateContact(contact);
      if (hasErrors(errors)) {
        return response
          .status(422)
          .json({ message: "Check the highlighted fields.", errors });
      }

      return response.json({ contact: store.updateContact(id, contact) });
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return response.status(409).json({
          message: "A contact with this email already exists.",
          errors: { email: "This email is already in your contacts." },
        });
      }
      return next(error);
    }
  });

  app.delete("/api/contacts/:id", (request, response) => {
    const id = parseId(request.params.id);
    if (!id || !store.deleteContact(id)) {
      return response.status(404).json({ message: "Contact not found." });
    }
    return response.status(204).end();
  });

  app.get("/api/deals", (request, response) => {
    const stage = cleanString(request.query.stage);
    if (stage && !DEAL_STAGES.includes(stage)) {
      return response.status(400).json({ message: "Invalid deal stage." });
    }
    return response.json({ deals: store.listDeals({ stage: stage || undefined }) });
  });

  app.get("/api/deals/:id", (request, response) => {
    const id = parseId(request.params.id);
    const deal = id ? store.getDeal(id) : null;
    if (!deal) {
      return response.status(404).json({ message: "Deal not found." });
    }
    return response.json({ deal });
  });

  app.post("/api/deals", (request, response, next) => {
    try {
      const deal = asDeal(request.body ?? {});
      const errors = validateDeal(deal);
      if (hasErrors(errors)) {
        return response
          .status(422)
          .json({ message: "Check the highlighted fields.", errors });
      }

      if (deal.contactId && !store.getContact(deal.contactId)) {
        return response.status(422).json({
          message: "Check the highlighted fields.",
          errors: { contactId: "The selected contact no longer exists." },
        });
      }

      return response.status(201).json({ deal: store.createDeal(deal) });
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/api/deals/:id", (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      const existing = id ? store.getDeal(id) : null;
      if (!existing) {
        return response.status(404).json({ message: "Deal not found." });
      }

      const deal = asDeal(request.body ?? {}, existing);
      const errors = validateDeal(deal);
      if (hasErrors(errors)) {
        return response
          .status(422)
          .json({ message: "Check the highlighted fields.", errors });
      }

      if (deal.contactId && !store.getContact(deal.contactId)) {
        return response.status(422).json({
          message: "Check the highlighted fields.",
          errors: { contactId: "The selected contact no longer exists." },
        });
      }

      return response.json({ deal: store.updateDeal(id, deal) });
    } catch (error) {
      return next(error);
    }
  });

  app.delete("/api/deals/:id", (request, response) => {
    const id = parseId(request.params.id);
    if (!id || !store.deleteDeal(id)) {
      return response.status(404).json({ message: "Deal not found." });
    }
    return response.status(204).end();
  });

  app.patch("/api/tasks/:id", (request, response) => {
    const id = parseId(request.params.id);
    if (!id || typeof request.body?.completed !== "boolean") {
      return response.status(422).json({
        message: "A completed boolean is required.",
      });
    }
    const task = store.completeTask(id, request.body.completed);
    if (!task) {
      return response.status(404).json({ message: "Task not found." });
    }
    return response.json({ task });
  });

  app.use("/api", (_request, response) => {
    response.status(404).json({ message: "API route not found." });
  });

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  });

  return app;
}
