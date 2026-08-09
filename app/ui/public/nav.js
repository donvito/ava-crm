const LABELS = { companies: "Companies", contacts: "Contacts", deals: "Deals" };

/** Render the app header nav with only the features enabled on the server. */
export async function renderNav(active) {
  const res = await fetch("/api/meta/features");
  const { features } = await res.json();
  const header = document.createElement("header");
  header.className = "app-header";
  const links = features
    .map((name) => {
      const current = name === active ? ' aria-current="page"' : "";
      return `<a href="/${name}/"${current}>${LABELS[name] ?? name}</a>`;
    })
    .join("");
  header.innerHTML = `<span class="brand">AVA CRM</span><nav aria-label="Main">${links}</nav>`;
  document.body.prepend(header);
}
