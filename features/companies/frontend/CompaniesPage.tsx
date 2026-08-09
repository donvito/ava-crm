"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Company {
  id: number;
  name: string;
  industry: string;
  website: string;
}

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formError, setFormError] = useState("");
  const nameInput = useRef<HTMLInputElement>(null);

  const loadCompanies = useCallback(async () => {
    const res = await fetch("/api/companies");
    setCompanies(await res.json());
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const { errors } = await res.json();
      setFormError(Object.values(errors ?? {}).join(". "));
      return;
    }
    form.reset();
    nameInput.current?.focus();
    await loadCompanies();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/companies/${id}`, { method: "DELETE" });
    await loadCompanies();
  }

  return (
    <main>
      <h1>Companies</h1>

      <section className="card" aria-labelledby="add-company-heading">
        <h2 id="add-company-heading">Add company</h2>
        <form className="entity-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="company-name">Name</label>
            <input id="company-name" name="name" autoComplete="off" ref={nameInput} />
          </div>
          <div className="field">
            <label htmlFor="company-industry">Industry</label>
            <input id="company-industry" name="industry" autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="company-website">Website</label>
            <input id="company-website" name="website" autoComplete="off" />
          </div>
          <button type="submit">Add company</button>
        </form>
        <p className="form-error" role="alert">
          {formError}
        </p>
      </section>

      <section className="card" aria-labelledby="company-list-heading">
        <h2 id="company-list-heading">All companies</h2>
        <table aria-label="Companies">
          <thead>
            <tr>
              <th>Name</th>
              <th>Industry</th>
              <th>Website</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td>{company.industry || "—"}</td>
                <td>
                  {company.website ? (
                    <a
                      href={
                        company.website.startsWith("http")
                          ? company.website
                          : `https://${company.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      {company.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <button
                    className="danger"
                    aria-label={`Delete ${company.name}`}
                    onClick={() => handleDelete(company.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loaded && companies.length === 0 && (
          <p className="empty-state">No companies yet.</p>
        )}
      </section>
    </main>
  );
}
