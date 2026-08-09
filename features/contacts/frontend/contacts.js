import { renderNav } from "/ui/nav.js";

const form = document.getElementById("contact-form");
const formHeading = document.getElementById("contact-form-heading");
const formError = document.getElementById("contact-form-error");
const submitButton = document.getElementById("contact-submit");
const cancelButton = document.getElementById("contact-cancel");
const companySelect = document.getElementById("contact-company");
const rows = document.getElementById("contact-rows");
const empty = document.getElementById("contact-empty");

let editingId = null;

async function loadCompanyOptions() {
  const options = await (await fetch("/api/contacts/company-options")).json();
  for (const { id, name } of options) {
    const option = document.createElement("option");
    option.value = String(id);
    option.textContent = name;
    companySelect.append(option);
  }
}

function setMode(contact) {
  editingId = contact?.id ?? null;
  formHeading.textContent = contact ? "Edit contact" : "Add contact";
  submitButton.textContent = contact ? "Save contact" : "Add contact";
  cancelButton.hidden = !contact;
  formError.textContent = "";
  if (contact) {
    form.first_name.value = contact.first_name;
    form.last_name.value = contact.last_name;
    form.email.value = contact.email;
    form.phone.value = contact.phone;
    form.company_id.value = contact.company_id ?? "";
  } else {
    form.reset();
  }
}

async function loadContacts() {
  const contacts = await (await fetch("/api/contacts")).json();
  rows.replaceChildren();
  empty.hidden = contacts.length > 0;
  for (const contact of contacts) {
    const fullName = `${contact.first_name} ${contact.last_name}`;
    const tr = document.createElement("tr");

    const cells = [
      fullName,
      contact.email,
      contact.phone || "—",
      contact.company_name ?? "—",
    ].map((text) => {
      const td = document.createElement("td");
      td.textContent = text;
      return td;
    });

    const actions = document.createElement("td");
    const edit = document.createElement("button");
    edit.className = "secondary";
    edit.textContent = "Edit";
    edit.setAttribute("aria-label", `Edit ${fullName}`);
    edit.addEventListener("click", () => setMode(contact));

    const del = document.createElement("button");
    del.className = "danger";
    del.textContent = "Delete";
    del.setAttribute("aria-label", `Delete ${fullName}`);
    del.addEventListener("click", async () => {
      await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
      if (editingId === contact.id) setMode(null);
      await loadContacts();
    });

    actions.append(edit, del);
    tr.append(...cells, actions);
    rows.append(tr);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.textContent = "";
  const body = Object.fromEntries(new FormData(form));
  const res = await fetch(
    editingId ? `/api/contacts/${editingId}` : "/api/contacts",
    {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const { errors } = await res.json();
    formError.textContent = Object.values(errors ?? {}).join(". ");
    return;
  }
  setMode(null);
  await loadContacts();
});

cancelButton.addEventListener("click", () => setMode(null));

await renderNav("contacts");
await Promise.all([loadCompanyOptions(), loadContacts()]);
