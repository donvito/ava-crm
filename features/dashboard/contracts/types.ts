import type { PipelineSummary } from "../../deals/contracts/types.ts";
import type { Deal } from "../../deals/contracts/types.ts";
import type { Contact } from "../../contacts/contracts/types.ts";
import type { Company } from "../../companies/contracts/types.ts";

export type DashboardSummary = {
  companyCount: number;
  contactCount: number;
  openDealCount: number;
  pipelineValueCents: number;
  pipeline: PipelineSummary[];
  recentDeals: Deal[];
  recentContacts: Contact[];
  recentCompanies: Company[];
};
