"use client";

import { useCallback, useEffect, useState } from "react";

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_id: number | null;
  company_name: string | null;
}

interface Option {
  id: number;
  name: string;
}

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company_id: "",
};

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadContacts = useCallback(async () => {
    const res = await fetch("/api/contacts");
    setContacts(await res.json());
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadContacts();
    fetch("/api/contacts/company-options")
      .then((res) => res.json())
      .then(setCompanyOptions);
  }, [loadContacts]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  }

  function startEdit(contact: Contact) {
    setEditingId(contact.id);
    setForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      company_id: contact.company_id != null ? String(contact.company_id) : "",
    });
    setFormError("");
  }

  function setField(name: keyof typeof emptyForm) {
    return (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => setForm((prev) => ({ ...prev, [name]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const res = await fetch(
      editingId ? `/api/contacts/${editingId}` : "/api/contacts",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    if (!res.ok) {
      const { errors } = await res.json();
      setFormError(Object.values(errors ?? {}).join(". "));
      return;
    }
    resetForm();
    await loadContacts();
  }

  async function handleDelete(contact: Contact) {
    await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
    if (editingId === contact.id) resetForm();
    await loadContacts();
  }

  return (
    <main>
      <h1>Contacts</h1>

      <section className="card" aria-labelledby="contact-form-heading">
        <h2 id="contact-form-heading">
          {editingId ? "Edit contact" : "Add contact"}
        </h2>
        <form className="entity-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="contact-first-name">First name</label>
            <input
              id="contact-first-name"
              autoComplete="off"
              value={form.first_name}
              onChange={setField("first_name")}
            />
          </div>
          <div className="field">
            <label htmlFor="contact-last-name">Last name</label>
            <input
              id="contact-last-name"
              autoComplete="off"
              value={form.last_name}
              onChange={setField("last_name")}
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              autoComplete="off"
              value={form.email}
              onChange={setField("email")}
            />
          </div>
          <div className="field">
            <label htmlFor="contact-phone">Phone</label>
            <input
              id="contact-phone"
              autoComplete="off"
              value={form.phone}
              onChange={setField("phone")}
            />
          </div>
          <div className="field">
            <label htmlFor="contact-company">Company</label>
            <select
              id="contact-company"
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
          <button type="submit">{editingId ? "Save contact" : "Add contact"}</button>
          {editingId && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
        <p className="form-error" role="alert">
          {formError}
        </p>
      </section>

      <section className="card" aria-labelledby="contact-list-heading">
        <h2 id="contact-list-heading">All contacts</h2>
        <table aria-label="Contacts">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => {
              const fullName = `${contact.first_name} ${contact.last_name}`;
              return (
                <tr key={contact.id}>
                  <td>{fullName}</td>
                  <td>{contact.email}</td>
                  <td>{contact.phone || "—"}</td>
                  <td>{contact.company_name ?? "—"}</td>
                  <td>
                    <button
                      className="secondary"
                      aria-label={`Edit ${fullName}`}
                      onClick={() => startEdit(contact)}
                    >
                      Edit
                    </button>
                    <button
                      className="danger"
                      aria-label={`Delete ${fullName}`}
                      onClick={() => handleDelete(contact)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loaded && contacts.length === 0 && (
          <p className="empty-state">No contacts yet.</p>
        )}
      </section>
    </main>
  );
}
