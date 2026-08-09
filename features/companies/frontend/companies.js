import { renderNav } from "/ui/nav.js";

const form = document.getElementById("company-form");
const formError = document.getElementById("company-form-error");
const rows = document.getElementById("company-rows");
const empty = document.getElementById("company-empty");

async function loadCompanies() {
  const companies = await (await fetch("/api/companies")).json();
  rows.replaceChildren();
  empty.hidden = companies.length > 0;
  for (const company of companies) {
    const tr = document.createElement("tr");

    const name = document.createElement("td");
    name.textContent = company.name;

    const industry = document.createElement("td");
    industry.textContent = company.industry || "—";

    const website = document.createElement("td");
    if (company.website) {
      const link = document.createElement("a");
      link.href = company.website.startsWith("http")
        ? company.website
        : `https://${company.website}`;
      link.textContent = company.website;
      link.target = "_blank";
      website.append(link);
    } else {
      website.textContent = "—";
    }

    const actions = document.createElement("td");
    const del = document.createElement("button");
    del.className = "danger";
    del.textContent = "Delete";
    del.setAttribute("aria-label", `Delete ${company.name}`);
    del.addEventListener("click", async () => {
      await fetch(`/api/companies/${company.id}`, { method: "DELETE" });
      await loadCompanies();
    });
    actions.append(del);

    tr.append(name, industry, website, actions);
    rows.append(tr);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.textContent = "";
  const body = Object.fromEntries(new FormData(form));
  const res = await fetch("/api/companies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const { errors } = await res.json();
    formError.textContent = Object.values(errors ?? {}).join(". ");
    return;
  }
  form.reset();
  document.getElementById("company-name").focus();
  await loadCompanies();
});

await renderNav("companies");
await loadCompanies();
