import type { CompanyDirectory } from "../../companies/contracts/company-directory";

/**
 * Deterministic CompanyDirectory fake for the contacts feature sandbox
 * (used when the companies feature is not enabled).
 */
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
