export type Company = {
  id: number;
  name: string;
  industry: string;
  website: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  contactCount?: number;
  dealCount?: number;
};

export type CompanyInput = {
  name: string;
  industry?: string;
  website?: string;
  notes?: string;
};
