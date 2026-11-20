/**
 * Isolated JavaScript example for JSDoc and checkJs.
 *
 * `npm run typecheck:jsdoc` checks this folder and writes nothing.
 * These files live outside force-app, so they are not part of a Salesforce
 * deployment. The root tsconfig leaves allowJs and checkJs off, so this
 * configuration does not start checking every Lightning web component.
 */

/**
 * @typedef {'Not started' | 'Reading' | 'Finished'} ReadingStatus
 */

/**
 * @param {ReadingStatus} status
 * @returns {boolean}
 */
export function isFinished(status) {
  return status === "Finished";
}

/**
 * Share of a book that has been read, from 0 through 100.
 * Returns null when the book has no positive page count.
 *
 * @param {number} pagesRead
 * @param {number | null | undefined} pageCount
 * @returns {number | null}
 */
export function readingPercent(pagesRead, pageCount) {
  if (pageCount == null || pageCount <= 0) {
    return null;
  }
  const percent = Math.round((pagesRead / pageCount) * 100);
  return Math.min(100, Math.max(0, percent));
}

/**
 * @param {number} pagesRead
 * @param {number | null | undefined} pageCount
 * @returns {string}
 */
export function describeProgress(pagesRead, pageCount) {
  const percent = readingPercent(pagesRead, pageCount);
  if (percent === null) {
    return `${pagesRead} pages read`;
  }
  return `${pagesRead} pages read (${percent}%)`;
}
