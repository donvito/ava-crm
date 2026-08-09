/**
 * ContactDirectory contract.
 *
 * Other features (e.g. deals) may depend on this contract only —
 * never on the contacts feature's repository or tables directly.
 *
 * Interface:
 *   listOptions(): Array<{ id: number, name: string }>
 *   getName(id: number): string | undefined
 */
export function createContactDirectory(repository) {
  const fullName = (c) => `${c.first_name} ${c.last_name}`;
  return {
    listOptions() {
      return repository.list().map((c) => ({ id: c.id, name: fullName(c) }));
    },
    getName(id) {
      const contact = repository.get(id);
      return contact ? fullName(contact) : undefined;
    },
  };
}
