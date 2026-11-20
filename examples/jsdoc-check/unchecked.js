// @ts-nocheck
/**
 * Opt-out sample. checkJs is enabled for this folder, and this directive
 * skips the file. Removing the directive makes `npm run typecheck:jsdoc`
 * report the untyped parameter and the call that treats a page count as text.
 */

export function ignored(pagesRead) {
  return pagesRead.trim();
}
