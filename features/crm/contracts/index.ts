export const CONTACT_STATUSES = [
  "Lead",
  "Prospect",
  "Customer",
  "Partner",
] as const;

export const DEAL_STAGES = [
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
] as const;

export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export type DealStage = (typeof DEAL_STAGES)[number];

export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  status: ContactStatus;
  source: string;
  city: string;
  notes: string;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  title?: string;
  status?: ContactStatus;
  source?: string;
  city?: string;
  notes?: string;
}

export interface Deal {
  id: number;
  name: string;
  contactId: number | null;
  contactName: string | null;
  company: string;
  value: number;
  stage: DealStage;
  probability: number;
  closeDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealInput {
  name: string;
  contactId?: number | null;
  company: string;
  value: number;
  stage?: DealStage;
  probability?: number;
  closeDate?: string | null;
}

export interface DashboardMetrics {
  contactCount: number;
  customerCount: number;
  pipelineValue: number;
  weightedValue: number;
  winRate: number;
  openTasks: number;
}

export interface PipelineSummary {
  stage: DealStage;
  count: number;
  value: number;
}

export interface CrmTask {
  id: number;
  title: string;
  dueAt: string;
  priority: string;
  completed: boolean;
  contactName: string | null;
  company: string | null;
}

export interface Activity {
  id: number;
  kind: string;
  description: string;
  contactName: string | null;
  createdAt: string;
}

export interface Dashboard {
  metrics: DashboardMetrics;
  pipeline: PipelineSummary[];
  tasks: CrmTask[];
  activities: Activity[];
  recentContacts: Contact[];
}
