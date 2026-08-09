import { useEffect, useState, type FormEvent } from "react";
import type { Company, CompanyInput } from "../contracts/types";
import { api } from "../../../app/platform/http/api";

const emptyForm: CompanyInput = {
  name: "",
  industry: "",
  website: "",
  notes: "",
};

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState<CompanyInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const payload = await api.get<{ companies: Company[] }>("/api/companies");
    setCompanies(payload.companies);
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        await api.put(`/api/companies/${editingId}`, form);
      } else {
        await api.post("/api/companies", form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(company: Company) {
    setEditingId(company.id);
    setForm({
      name: company.name,
      industry: company.industry,
      website: company.website,
      notes: company.notes,
    });
  }

  async function onDelete(id: number) {
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/api/companies/${id}`);
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Companies</h1>
          <p>Track the organizations you sell to and support.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="grid-2">
        <section className="panel" aria-labelledby="company-form-heading">
          <div className="panel-header">
            <h2 id="company-form-heading">
              {editingId ? "Edit company" : "Add company"}
            </h2>
          </div>
          <form onSubmit={onSubmit}>
            <div className="form-grid">
              <label className="full">
                Company name
                <input
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Industry
                <input
                  name="industry"
                  value={form.industry}
                  onChange={(e) =>
                    setForm({ ...form, industry: e.target.value })
                  }
                />
              </label>
              <label>
                Website
                <input
                  name="website"
                  value={form.website}
                  onChange={(e) =>
                    setForm({ ...form, website: e.target.value })
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
                  }}
                >
                  Cancel
                </button>
              ) : null}
              <button className="btn" type="submit" disabled={busy}>
                {editingId ? "Save changes" : "Create company"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel" aria-labelledby="company-list-heading">
          <div className="panel-header">
            <h2 id="company-list-heading">All companies</h2>
          </div>
          {companies.length === 0 ? (
            <p className="empty">No companies yet. Add your first account.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Industry</th>
                  <th scope="col">Links</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <strong>{company.name}</strong>
                      <div className="muted">
                        {company.contactCount ?? 0} contacts ·{" "}
                        {company.dealCount ?? 0} deals
                      </div>
                    </td>
                    <td>{company.industry || "—"}</td>
                    <td>
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noreferrer">
                          Website
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => startEdit(company)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn danger"
                          onClick={() => onDelete(company.id)}
                          disabled={busy}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </section>
  );
}
