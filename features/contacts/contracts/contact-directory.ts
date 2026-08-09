/**
 * ContactDirectory contract.
 *
 * Other features (e.g. deals) may depend on this contract only —
 * never on the contacts feature's repository or tables directly.
 * In NestJS it is provided under the CONTACT_DIRECTORY token.
 */
export interface DirectoryOption {
  id: number;
  name: string;
}

export interface ContactDirectory {
  listOptions(): DirectoryOption[];
  getName(id: number): string | undefined;
}

export const CONTACT_DIRECTORY = "CONTACT_DIRECTORY";
