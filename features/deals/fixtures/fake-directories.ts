import type { CompanyDirectory } from "../../companies/contracts/company-directory";
import type { ContactDirectory } from "../../contacts/contracts/contact-directory";

/**
 * Deterministic directory fakes for the deals feature sandbox
 * (used when the contacts/companies features are not enabled).
 */
export function createFakeContactDirectory(): ContactDirectory {
  const contacts = [
    { id: 1, name: "Fake Contact Ada" },
    { id: 2, name: "Fake Contact Grace" },
  ];
  return {
    listOptions: () => contacts,
    getName: (id) => contacts.find((c) => c.id === id)?.name,
  };
}

export function createFakeCompanyDirectory(): CompanyDirectory {
  const companies = [
    { id: 1, name: "Fake Company One" },
    { id: 2, name: "Fake Company Two" },
  ];
  return {
    listOptions: () => companies,
    getName: (id) => companies.find((c) => c.id === id)?.name,
  };
}
