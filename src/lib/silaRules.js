/**
 * Sila Development Rules
 * These rules must be followed for all code contributions to ensure consistency and maintainability.
 */

export const SILA_RULES = `
1. All visible text must use t() from useLanguage().
2. All location dropdowns use GREENLAND_LOCATIONS.
3. All location filters read user?.location directly — never from cached useState.
4. Single-word labels always use capitalizeFirst().
5. Never hardcode city names or UI strings.
`;