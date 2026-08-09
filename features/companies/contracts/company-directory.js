/**
 * CompanyDirectory contract.
 *
 * Other features (contacts, deals) may depend on this contract only —
 * never on the companies feature's repository or tables directly.
 *
 * Interface:
 *   listOptions(): Array<{ id: number, name: string }>
 *   getName(id: number): string | undefined
 */
export function createCompanyDirectory(repository) {
  return {
    listOptions() {
      return repository.list().map(({ id, name }) => ({ id, name }));
    },
    getName(id) {
      return repository.get(id)?.name;
    },
  };
}
