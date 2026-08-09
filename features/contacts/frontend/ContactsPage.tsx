import { useEffect, useState, type FormEvent } from "react";
import type { Contact, ContactInput } from "../contracts/types";
import type { Company } from "../../companies/contracts/types";
import { api } from "../../../app/platform/http/api";

const emptyForm: ContactInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  title: "",
  companyId: null,
  notes: "",
};

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState<ContactInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [contactsPayload, companiesPayload] = await Promise.all([
      api.get<{ contacts: Contact[] }>("/api/contacts"),
      api.get<{ companies: Company[] }>("/api/companies"),
    ]);
    setContacts(contactsPayload.contacts);
    setCompanies(companiesPayload.companies);
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...form,
        companyId: form.companyId ? Number(form.companyId) : null,
      };
      if (editingId) {
        await api.put(`/api/contacts/${editingId}`, payload);
      } else {
        await api.post("/api/contacts", payload);
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

  function startEdit(contact: Contact) {
    setEditingId(contact.id);
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      title: contact.title,
      companyId: contact.companyId,
      notes: contact.notes,
    });
  }

  async function onDelete(id: number) {
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/api/contacts/${id}`);
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
          <h1>Contacts</h1>
          <p>People at the heart of every account and opportunity.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="grid-2">
        <section className="panel" aria-labelledby="contact-form-heading">
          <div className="panel-header">
            <h2 id="contact-form-heading">
              {editingId ? "Edit contact" : "Add contact"}
            </h2>
          </div>
          <form onSubmit={onSubmit}>
            <div className="form-grid">
              <label>
                First name
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Last name
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label>
                Phone
                <input
                  name="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
              <label>
                Title
                <input
                  name="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
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
                {editingId ? "Save changes" : "Create contact"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel" aria-labelledby="contact-list-heading">
          <div className="panel-header">
            <h2 id="contact-list-heading">All contacts</h2>
          </div>
          {contacts.length === 0 ? (
            <p className="empty">No contacts yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Company</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td>
                      <strong>
                        {contact.firstName} {contact.lastName}
                      </strong>
                      <div className="muted">{contact.title || "—"}</div>
                    </td>
                    <td>{contact.companyName ?? "—"}</td>
                    <td>
                      <div>{contact.email || "—"}</div>
                      <div className="muted">{contact.phone || ""}</div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => startEdit(contact)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn danger"
                          onClick={() => onDelete(contact.id)}
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
