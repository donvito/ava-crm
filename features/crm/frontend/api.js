async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({
    message: "The server returned an unexpected response.",
  }));

  if (!response.ok) {
    const error = new Error(payload.message || "Request failed.");
    error.status = response.status;
    error.errors = payload.errors ?? {};
    throw error;
  }

  return payload;
}

export const crmApi = {
  dashboard: () => request("/api/dashboard"),
  contacts: ({ search = "", status = "All" } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status !== "All") params.set("status", status);
    const query = params.size ? `?${params.toString()}` : "";
    return request(`/api/contacts${query}`);
  },
  createContact: (contact) =>
    request("/api/contacts", {
      method: "POST",
      body: JSON.stringify(contact),
    }),
  updateContact: (id, contact) =>
    request(`/api/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(contact),
    }),
  deleteContact: (id) =>
    request(`/api/contacts/${id}`, {
      method: "DELETE",
    }),
  deals: () => request("/api/deals"),
  createDeal: (deal) =>
    request("/api/deals", {
      method: "POST",
      body: JSON.stringify(deal),
    }),
  updateDeal: (id, deal) =>
    request(`/api/deals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(deal),
    }),
  deleteDeal: (id) =>
    request(`/api/deals/${id}`, {
      method: "DELETE",
    }),
  completeTask: (id, completed) =>
    request(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    }),
};
