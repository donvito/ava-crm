import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Deal, DealInput, DealStage } from "../contracts/types";
import { DEAL_STAGES } from "../contracts/types";
import type { Company } from "../../companies/contracts/types";
import type { Contact } from "../../contacts/contracts/types";
import { api, formatMoney, stageLabel } from "../../../app/platform/http/api";

const emptyForm: DealInput = {
  title: "",
  valueCents: 0,
  stage: "lead",
  companyId: null,
  contactId: null,
  expectedClose: "",
  notes: "",
};

export function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState<DealInput>(emptyForm);
  const [valueDollars, setValueDollars] = useState("0");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [dealsPayload, companiesPayload, contactsPayload] = await Promise.all([
      api.get<{ deals: Deal[] }>("/api/deals"),
      api.get<{ companies: Company[] }>("/api/companies"),
      api.get<{ contacts: Contact[] }>("/api/contacts"),
    ]);
    setDeals(dealsPayload.deals);
    setCompanies(companiesPayload.companies);
    setContacts(contactsPayload.contacts);
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, []);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(
      DEAL_STAGES.map((stage) => [stage, [] as Deal[]]),
    ) as Record<DealStage, Deal[]>;
    for (const deal of deals) {
      map[deal.stage].push(deal);
    }
    return map;
  }, [deals]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const dollars = Number(valueDollars);
      const payload: DealInput = {
        ...form,
        valueCents: Number.isFinite(dollars) ? Math.round(dollars * 100) : 0,
        companyId: form.companyId ? Number(form.companyId) : null,
        contactId: form.contactId ? Number(form.contactId) : null,
        expectedClose: form.expectedClose || null,
      };
      if (editingId) {
        await api.put(`/api/deals/${editingId}`, payload);
      } else {
        await api.post("/api/deals", payload);
      }
      setForm(emptyForm);
      setValueDollars("0");
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(deal: Deal) {
    setEditingId(deal.id);
    setForm({
      title: deal.title,
      valueCents: deal.valueCents,
      stage: deal.stage,
      companyId: deal.companyId,
      contactId: deal.contactId,
      expectedClose: deal.expectedClose ?? "",
      notes: deal.notes,
    });
    setValueDollars(String(deal.valueCents / 100));
  }

  async function onDelete(id: number) {
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/api/deals/${id}`);
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
        setValueDollars("0");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function moveStage(deal: Deal, stage: DealStage) {
    setBusy(true);
    setError(null);
    try {
      await api.put(`/api/deals/${deal.id}`, {
        title: deal.title,
        valueCents: deal.valueCents,
        stage,
        companyId: deal.companyId,
        contactId: deal.contactId,
        expectedClose: deal.expectedClose,
        notes: deal.notes,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Deals</h1>
          <p>Move opportunities from first conversation to closed-won.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel" style={{ marginBottom: 16 }} aria-labelledby="deal-form-heading">
        <div className="panel-header">
          <h2 id="deal-form-heading">{editingId ? "Edit deal" : "Add deal"}</h2>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-grid">
            <label className="full">
              Deal title
              <input
                name="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </label>
            <label>
              Value (USD)
              <input
                name="value"
                type="number"
                min="0"
                step="1"
                value={valueDollars}
                onChange={(e) => setValueDollars(e.target.value)}
              />
            </label>
            <label>
              Stage
              <select
                name="stage"
                value={form.stage}
                onChange={(e) =>
                  setForm({ ...form, stage: e.target.value as DealStage })
                }
              >
                {DEAL_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stageLabel(stage)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Company
              <select
                name="companyId"
                value={form.companyId ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    companyId: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">No company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Contact
              <select
                name="contactId"
                value={form.contactId ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contactId: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">No contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Expected close
              <input
                name="expectedClose"
                type="date"
                value={form.expectedClose ?? ""}
                onChange={(e) =>
                  setForm({ ...form, expectedClose: e.target.value })
                }
              />
            </label>
            <label className="full">
              Notes
              <textarea
                name="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
          </div>
          <div className="form-actions">
            {editingId ? (
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                  setValueDollars("0");
                }}
              >
                Cancel
              </button>
            ) : null}
            <button className="btn" type="submit" disabled={busy}>
              {editingId ? "Save changes" : "Create deal"}
            </button>
          </div>
        </form>
      </section>

      <div className="pipeline" aria-label="Deal pipeline">
        {DEAL_STAGES.map((stage) => {
          const stageDeals = grouped[stage];
          const total = stageDeals.reduce((sum, deal) => sum + deal.valueCents, 0);
          return (
            <section key={stage} className="pipeline-column" aria-labelledby={`stage-${stage}`}>
              <h3 id={`stage-${stage}`}>{stageLabel(stage)}</h3>
              <div className="pipeline-meta">
                {stageDeals.length} deals · {formatMoney(total)}
              </div>
              {stageDeals.length === 0 ? (
                <p className="muted">No deals</p>
              ) : (
                stageDeals.map((deal) => (
                  <article
                    key={deal.id}
                    className="deal-card"
                    onClick={() => startEdit(deal)}
                  >
                    <strong>{deal.title}</strong>
                    <div className="meta">
                      <span>{formatMoney(deal.valueCents)}</span>
                      <span>{deal.companyName ?? "No company"}</span>
                      <span>{deal.contactName ?? "No contact"}</span>
                    </div>
                    <div className="row-actions" style={{ marginTop: 10 }}>
                      <label>
                        <span className="visually-hidden">Move stage</span>
                        <select
                          aria-label={`Move ${deal.title} to stage`}
                          value={deal.stage}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            moveStage(deal, e.target.value as DealStage)
                          }
                          disabled={busy}
                        >
                          {DEAL_STAGES.map((option) => (
                            <option key={option} value={option}>
                              {stageLabel(option)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="btn danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(deal.id);
                        }}
                        disabled={busy}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
