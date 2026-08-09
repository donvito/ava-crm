export type Contact = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  companyId: number | null;
  companyName: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ContactInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  companyId?: number | null;
  notes?: string;
};
