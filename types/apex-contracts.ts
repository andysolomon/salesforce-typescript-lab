/**
 * Hand-maintained shape of the Apex reading-list response.
 *
 * This module documents what the Lightning web component expects. It does not
 * read Apex source, does not run in the browser, and does not reject a
 * response whose runtime shape has drifted from these types.
 */

export type ReadingStatus = "Not started" | "Reading" | "Finished";

export interface BookSummary {
  bookId: string;
  title: string;
  authorName: string;
  status: ReadingStatus;
  pagesRead: number;
  pageCount: number | null;
}
