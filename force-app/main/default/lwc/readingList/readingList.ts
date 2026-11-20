import { LightningElement, api } from "lwc";
import getBooks from "@salesforce/apex/ReadingListController.getBooks";
import updateReadingStatus from "@salesforce/apex/ReadingListController.updateReadingStatus";
import type { BookSummary, ReadingStatus } from "@reading-lab/contracts";

const READING_STATUSES: readonly ReadingStatus[] = [
  "Not started",
  "Reading",
  "Finished"
];

interface StatusChoice {
  value: ReadingStatus;
  label: string;
  pressed: string;
  buttonClass: string;
}

interface BookView extends BookSummary {
  progressLabel: string;
  statusGroupLabel: string;
  isUpdating: boolean;
  choices: StatusChoice[];
}

/**
 * Personal reading list backed by sample Apex data.
 * The component keeps status changes in memory. Reloading calls getBooks and
 * shows the original sample again.
 */
export default class ReadingList extends LightningElement {
  @api
  heading = "Reading list";

  private books: BookView[] = [];
  private errorMessage: string | null = null;
  // Public so the template can read it. TypeScript does not see HTML usages.
  isLoading = true;
  private isConnected = false;

  connectedCallback(): void {
    this.isConnected = true;
    this.loadBooks();
  }

  disconnectedCallback(): void {
    this.isConnected = false;
  }

  get hasBooks(): boolean {
    return this.books.length > 0;
  }

  get showEmpty(): boolean {
    return this.errorMessage === null;
  }

  async handleStatusClick(event: Event): Promise<void> {
    const button = event.currentTarget;
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const bookId = button.dataset.bookId ?? null;
    const requestedStatus = button.dataset.status ?? null;
    if (bookId === null || !isReadingStatus(requestedStatus)) {
      this.errorMessage = "Choose a reading status for a book on the list.";
      return;
    }

    const current = this.books.find((book) => book.bookId === bookId);
    if (!current || current.isUpdating || current.status === requestedStatus) {
      return;
    }

    this.errorMessage = null;
    this.setUpdating(bookId, true);
    try {
      // The imported method is typed, but the declaration is not a runtime
      // guarantee. Read the response as unknown and check its shape.
      const response: unknown = await updateReadingStatus({
        bookId,
        status: requestedStatus
      });
      if (!this.isConnected) {
        return;
      }
      const updated = readBookSummary(response);
      if (!this.books.some((book) => book.bookId === updated.bookId)) {
        this.errorMessage = "The updated book was not on the list.";
        this.setUpdating(bookId, false);
        return;
      }
      this.books = this.books.map((book) => {
        return book.bookId === updated.bookId ? toView(updated, false) : book;
      });
    } catch (error: unknown) {
      if (!this.isConnected) {
        return;
      }
      this.errorMessage = readErrorMessage(error);
      this.setUpdating(bookId, false);
    }
  }

  private async loadBooks(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    try {
      const response: unknown = await getBooks();
      if (!this.isConnected) {
        return;
      }
      this.books = readBookList(response).map((book) => toView(book, false));
    } catch (error: unknown) {
      if (!this.isConnected) {
        return;
      }
      this.errorMessage = readErrorMessage(error);
      this.books = [];
    } finally {
      if (this.isConnected) {
        this.isLoading = false;
      }
    }
  }

  private setUpdating(bookId: string, isUpdating: boolean): void {
    this.books = this.books.map((book) => {
      return book.bookId === bookId ? { ...book, isUpdating } : book;
    });
  }
}

function isReadingStatus(value: unknown): value is ReadingStatus {
  return READING_STATUSES.some((status) => status === value);
}

function toView(book: BookSummary, isUpdating: boolean): BookView {
  return {
    ...book,
    progressLabel: formatProgress(book.pagesRead, book.pageCount),
    statusGroupLabel: `Set status for ${book.title}`,
    isUpdating,
    choices: READING_STATUSES.map((status) => ({
      value: status,
      label: status,
      pressed: status === book.status ? "true" : "false",
      buttonClass:
        status === book.status
          ? "slds-button slds-button_brand"
          : "slds-button slds-button_neutral"
    }))
  };
}

function formatProgress(pagesRead: number, pageCount: number | null): string {
  if (pageCount === null || pageCount <= 0) {
    return `${pagesRead} pages read`;
  }
  const percent = Math.min(
    100,
    Math.max(0, Math.round((pagesRead / pageCount) * 100))
  );
  return `${pagesRead} of ${pageCount} pages (${percent}%)`;
}

function readBookList(value: unknown): BookSummary[] {
  if (!Array.isArray(value)) {
    throw new Error("The reading list response was not a list of books.");
  }
  return value.map((item, index) => {
    if (!isBookSummary(item)) {
      throw new Error(`Book ${index + 1} did not match the expected shape.`);
    }
    return item;
  });
}

function readBookSummary(value: unknown): BookSummary {
  if (!isBookSummary(value)) {
    throw new Error("The updated book did not match the expected shape.");
  }
  return value;
}

function isBookSummary(value: unknown): value is BookSummary {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const book = value as Record<string, unknown>;
  return (
    typeof book.bookId === "string" &&
    book.bookId.length > 0 &&
    typeof book.title === "string" &&
    typeof book.authorName === "string" &&
    isReadingStatus(book.status) &&
    typeof book.pagesRead === "number" &&
    (book.pageCount === null || typeof book.pageCount === "number")
  );
}

function readErrorMessage(error: unknown): string {
  const fromBody = messageFromBody(error);
  if (fromBody !== null) {
    return fromBody;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return "The reading list could not be updated.";
}

function messageFromBody(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("body" in error)) {
    return null;
  }
  const body = error.body;
  if (typeof body === "string" && body.trim().length > 0) {
    return body;
  }
  const direct = messageField(body);
  if (direct !== null) {
    return direct;
  }
  if (Array.isArray(body)) {
    return messageField(body[0]);
  }
  return null;
}

function messageField(value: unknown): string | null {
  if (typeof value !== "object" || value === null || !("message" in value)) {
    return null;
  }
  const message = value.message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }
  return null;
}
