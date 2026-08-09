export const DEAL_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "won",
  "lost",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

export type Deal = {
  id: number;
  title: string;
  valueCents: number;
  stage: DealStage;
  companyId: number | null;
  companyName: string | null;
  contactId: number | null;
  contactName: string | null;
  expectedClose: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type DealInput = {
  title: string;
  valueCents?: number;
  stage?: DealStage;
  companyId?: number | null;
  contactId?: number | null;
  expectedClose?: string | null;
  notes?: string;
};

export type PipelineSummary = {
  stage: DealStage;
  count: number;
  totalCents: number;
};
