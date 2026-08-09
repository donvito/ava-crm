import { renderNav } from "/ui/nav.js";

const form = document.getElementById("deal-form");
const formError = document.getElementById("deal-form-error");
const contactSelect = document.getElementById("deal-contact");
const companySelect = document.getElementById("deal-company");
const stageFilter = document.getElementById("stage-filter");
const rows = document.getElementById("deal-rows");
const empty = document.getElementById("deal-empty");

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

let stages = [];

function labelForStage(stage) {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

function fillOptions(select, options) {
  for (const { id, name } of options) {
    const option = document.createElement("option");
    option.value = String(id);
    option.textContent = name;
    select.append(option);
  }
}

async function loadFormOptions() {
  const [stageList, contacts, companies] = await Promise.all([
    (await fetch("/api/deals/stages")).json(),
    (await fetch("/api/deals/contact-options")).json(),
    (await fetch("/api/deals/company-options")).json(),
  ]);
  stages = stageList;
  fillOptions(contactSelect, contacts);
  fillOptions(companySelect, companies);
  for (const stage of stages) {
    const option = document.createElement("option");
    option.value = stage;
    option.textContent = labelForStage(stage);
    stageFilter.append(option);
  }
}

async function loadDeals() {
  const stage = stageFilter.value;
  const url = stage ? `/api/deals?stage=${stage}` : "/api/deals";
  const deals = await (await fetch(url)).json();
  rows.replaceChildren();
  empty.hidden = deals.length > 0;
  for (const deal of deals) {
    const tr = document.createElement("tr");

    const cells = [
      deal.title,
      usd.format(deal.value_cents / 100),
      deal.contact_name ?? "—",
      deal.company_name ?? "—",
    ].map((text) => {
      const td = document.createElement("td");
      td.textContent = text;
      return td;
    });

    const stageCell = document.createElement("td");
    if (deal.stage === "won" || deal.stage === "lost") {
      const badge = document.createElement("span");
      badge.className = `badge ${deal.stage}`;
      badge.textContent = labelForStage(deal.stage);
      stageCell.append(badge);
    } else {
      const select = document.createElement("select");
      select.setAttribute("aria-label", `Stage for ${deal.title}`);
      for (const stage of stages) {
        const option = document.createElement("option");
        option.value = stage;
        option.textContent = labelForStage(stage);
        option.selected = stage === deal.stage;
        select.append(option);
      }
      select.addEventListener("change", async () => {
        await fetch(`/api/deals/${deal.id}/stage`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: select.value }),
        });
        await loadDeals();
      });
      stageCell.append(select);
    }

    const actions = document.createElement("td");
    const del = document.createElement("button");
    del.className = "danger";
    del.textContent = "Delete";
    del.setAttribute("aria-label", `Delete ${deal.title}`);
    del.addEventListener("click", async () => {
      await fetch(`/api/deals/${deal.id}`, { method: "DELETE" });
      await loadDeals();
    });
    actions.append(del);

    tr.append(...cells, stageCell, actions);
    rows.append(tr);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.textContent = "";
  const body = Object.fromEntries(new FormData(form));
  const res = await fetch("/api/deals", {
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
  await loadDeals();
});

stageFilter.addEventListener("change", loadDeals);

await renderNav("deals");
await loadFormOptions();
await loadDeals();
