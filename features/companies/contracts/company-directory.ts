/**
 * CompanyDirectory contract.
 *
 * Other features (contacts, deals) may depend on this contract only —
 * never on the companies feature's repository or tables directly.
 * In NestJS it is provided under the COMPANY_DIRECTORY token.
 */
export interface DirectoryOption {
  id: number;
  name: string;
}

export interface CompanyDirectory {
  listOptions(): DirectoryOption[];
  getName(id: number): string | undefined;
}

export const COMPANY_DIRECTORY = "COMPANY_DIRECTORY";
