"use client";

import { useCallback, useEffect, useState } from "react";

interface Deal {
  id: number;
  title: string;
  value_cents: number;
  stage: string;
  contact_name: string | null;
  company_name: string | null;
}

interface Option {
  id: number;
  name: string;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const emptyForm = { title: "", value: "", contact_id: "", company_id: "" };

function labelForStage(stage: string) {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

export function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [contactOptions, setContactOptions] = useState<Option[]>([]);
  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  const [stageFilter, setStageFilter] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const loadDeals = useCallback(async (filter: string) => {
    const url = filter ? `/api/deals?stage=${filter}` : "/api/deals";
    const res = await fetch(url);
    setDeals(await res.json());
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadDeals(stageFilter);
  }, [loadDeals, stageFilter]);

  useEffect(() => {
    fetch("/api/deals/stages")
      .then((res) => res.json())
      .then(setStages);
    fetch("/api/deals/contact-options")
      .then((res) => res.json())
      .then(setContactOptions);
    fetch("/api/deals/company-options")
      .then((res) => res.json())
      .then(setCompanyOptions);
  }, []);

  function setField(name: keyof typeof emptyForm) {
    return (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => setForm((prev) => ({ ...prev, [name]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const { errors } = await res.json();
      setFormError(Object.values(errors ?? {}).join(". "));
      return;
    }
    setForm(emptyForm);
    await loadDeals(stageFilter);
  }

  async function handleStageChange(deal: Deal, stage: string) {
    await fetch(`/api/deals/${deal.id}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    await loadDeals(stageFilter);
  }

  async function handleDelete(deal: Deal) {
    await fetch(`/api/deals/${deal.id}`, { method: "DELETE" });
    await loadDeals(stageFilter);
  }

  return (
    <main>
      <h1>Deals</h1>

      <section className="card" aria-labelledby="add-deal-heading">
        <h2 id="add-deal-heading">Add deal</h2>
        <form className="entity-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="deal-title">Title</label>
            <input
              id="deal-title"
              autoComplete="off"
              value={form.title}
              onChange={setField("title")}
            />
          </div>
          <div className="field">
            <label htmlFor="deal-value">Value (USD)</label>
            <input
              id="deal-value"
              inputMode="decimal"
              autoComplete="off"
              value={form.value}
              onChange={setField("value")}
            />
          </div>
          <div className="field">
            <label htmlFor="deal-contact">Contact</label>
            <select
              id="deal-contact"
              value={form.contact_id}
              onChange={setField("contact_id")}
            >
              <option value="">No contact</option>
              {contactOptions.map(({ id, name }) => (
                <option key={id} value={String(id)}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="deal-company">Company</label>
            <select
              id="deal-company"
              value={form.company_id}
              onChange={setField("company_id")}
            >
              <option value="">No company</option>
              {companyOptions.map(({ id, name }) => (
                <option key={id} value={String(id)}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit">Add deal</button>
        </form>
        <p className="form-error" role="alert">
          {formError}
        </p>
      </section>

      <section className="card" aria-labelledby="pipeline-heading">
        <h2 id="pipeline-heading">Pipeline</h2>
        <div className="toolbar">
          <label htmlFor="stage-filter">Filter by stage</label>
          <select
            id="stage-filter"
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
          >
            <option value="">All stages</option>
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {labelForStage(stage)}
              </option>
            ))}
          </select>
        </div>
        <table aria-label="Deals">
          <thead>
            <tr>
              <th>Title</th>
              <th>Value</th>
              <th>Contact</th>
              <th>Company</th>
              <th>Stage</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => (
              <tr key={deal.id}>
                <td>{deal.title}</td>
                <td>{usd.format(deal.value_cents / 100)}</td>
                <td>{deal.contact_name ?? "—"}</td>
                <td>{deal.company_name ?? "—"}</td>
                <td>
                  {deal.stage === "won" || deal.stage === "lost" ? (
                    <span className={`badge ${deal.stage}`}>
                      {labelForStage(deal.stage)}
                    </span>
                  ) : (
                    <select
                      aria-label={`Stage for ${deal.title}`}
                      value={deal.stage}
                      onChange={(event) => handleStageChange(deal, event.target.value)}
                    >
                      {stages.map((stage) => (
                        <option key={stage} value={stage}>
                          {labelForStage(stage)}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td>
                  <button
                    className="danger"
                    aria-label={`Delete ${deal.title}`}
                    onClick={() => handleDelete(deal)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loaded && deals.length === 0 && <p className="empty-state">No deals yet.</p>}
      </section>
    </main>
  );
}
