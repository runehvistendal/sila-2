/**
 * capitalizeFirst — uppercases ONLY the very first character of a string.
 * All other characters remain exactly as they are.
 * Example: capitalizeFirst("active") → "Active"
 *          capitalizeFirst("gemt") → "Gemt"
 *          capitalizeFirst("hi, my name is Rune") → "Hi, my name is Rune"
 */
export function capitalizeFirst(str) {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * STATUS_COLORS — shared Tailwind classes for status badges.
 */
export const STATUS_COLORS = {
  pending:   'bg-amber-100 text-amber-700',
  on_hold:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  accepted:  'bg-green-100 text-green-700',
  declined:  'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  completed: 'bg-blue-100 text-blue-700',
  quoted:    'bg-blue-100 text-blue-700',
  scheduled: 'bg-green-100 text-green-700',
  full:      'bg-amber-100 text-amber-700',
  active:    'bg-green-100 text-green-700',
  open:      'bg-amber-100 text-amber-700',
};

/**
 * statusLabel — returns a translated, capitalizeFirst'd status label.
 * Falls back to the raw status string if no translation key exists.
 */
export function statusLabel(status, t) {
  const key = `status_${status}`;
  const translated = t(key);
  // If t() returns the raw key (no translation found), fall back to capitalizeFirst of status
  if (translated === key) return capitalizeFirst(status);
  return capitalizeFirst(translated);
}