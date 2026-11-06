/**
 * Sources the simulation implements. Every sim module's header cites one of these
 * by key and names the formula it implements.
 *
 * Formulas follow the project's spec of these papers; equation/table numbers refer
 * to the papers as cited there.
 */
export const REFERENCES = {
  davisSchilling1973: {
    short: 'Davis & Schilling (1973)',
    full:
      'Lynn Etheridge Davis and Warner R. Schilling, "All You Ever Wanted to Know About ' +
      'MIRV and ICBM Calculations But Were Not Cleared to Ask," Journal of Conflict ' +
      'Resolution 17(2), 1973.',
  },
  lawrence2026: {
    short: 'Lawrence (2026)',
    full: 'Lawrence (2026), "The balance of nuclear humility."',
  },
} as const
