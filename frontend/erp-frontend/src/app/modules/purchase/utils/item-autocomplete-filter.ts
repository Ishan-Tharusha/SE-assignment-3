import { ItemDto } from '../../../models/item.model';

/** How many items to show when the user focuses the field (no typing yet). */
export const ITEM_AUTOCOMPLETE_DEFAULT_COUNT = 5;

/** Max matches to show while typing. */
export const ITEM_AUTOCOMPLETE_MAX_FILTERED = 20;

/**
 * Sorted suggestions: exact name → starts-with → contains; alphabetical within each group.
 */
export function filterItemsForAutocomplete(items: ItemDto[], queryRaw: string): ItemDto[] {
  const sorted = [...items].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
  const q = queryRaw.trim().toLowerCase();
  if (!q) {
    return sorted.slice(0, ITEM_AUTOCOMPLETE_DEFAULT_COUNT);
  }

  const exact: ItemDto[] = [];
  const starts: ItemDto[] = [];
  const contains: ItemDto[] = [];

  for (const item of sorted) {
    const n = item.name.toLowerCase();
    if (n === q) {
      exact.push(item);
    } else if (n.startsWith(q)) {
      starts.push(item);
    } else if (n.includes(q)) {
      contains.push(item);
    }
  }

  return [...exact, ...starts, ...contains].slice(0, ITEM_AUTOCOMPLETE_MAX_FILTERED);
}
