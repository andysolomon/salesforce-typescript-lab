/**
 * @description Sample reading list for the TypeScript learning lab.
 *              Books are fictional and are not stored.
 *              getBooks always returns the original sample. updateReadingStatus
 *              checks the request and returns a copy; it does not save anything.
 */
public with sharing class ReadingListController {
  private static final Set<String> ALLOWED_STATUSES = new Set<String>{
    'Not started',
    'Reading',
    'Finished'
  };

  /**
   * @description Returns the fictional reading list.
   * @return Sample books in a stable order.
   */
  @AuraEnabled(cacheable=true)
  public static List<BookSummary> getBooks() {
    return sampleBooks();
  }

  /**
   * @description Checks a status change and returns a copy of the sample book.
   * @param bookId Sample id, for example book-lantern.
   * @param status Not started, Reading, or Finished.
   * @return Copy of the matching sample book with the requested status.
   */
  @AuraEnabled
  public static BookSummary updateReadingStatus(String bookId, String status) {
    if (String.isBlank(bookId)) {
      throw handledError('A book id is required.');
    }
    if (String.isBlank(status) || !ALLOWED_STATUSES.contains(status)) {
      throw handledError('Choose Not started, Reading, or Finished.');
    }

    for (BookSummary book : sampleBooks()) {
      if (book.bookId == bookId) {
        BookSummary updated = copyBook(book);
        updated.status = status;
        return updated;
      }
    }

    throw handledError('That book is not on the reading list.');
  }

  private static List<BookSummary> sampleBooks() {
    return new List<BookSummary>{
      book(
        'book-lantern',
        'The Lantern on Pell Street',
        'Mara Quinn',
        'Reading',
        80,
        240
      ),
      book(
        'book-orbit',
        'Notes from a Quiet Orbit',
        'Ivo March',
        'Not started',
        0,
        180
      ),
      book('book-salt', 'Salt and Cedar', 'Helen Cho', 'Finished', 312, 312),
      book(
        'book-rain',
        'Field Guide to Indoor Rain',
        'Samir Adeyemi',
        'Reading',
        40,
        null
      )
    };
  }

  private static BookSummary book(
    String bookId,
    String title,
    String authorName,
    String status,
    Integer pagesRead,
    Integer pageCount
  ) {
    BookSummary summary = new BookSummary();
    summary.bookId = bookId;
    summary.title = title;
    summary.authorName = authorName;
    summary.status = status;
    summary.pagesRead = pagesRead;
    summary.pageCount = pageCount;
    return summary;
  }

  private static BookSummary copyBook(BookSummary original) {
    return book(
      original.bookId,
      original.title,
      original.authorName,
      original.status,
      original.pagesRead,
      original.pageCount
    );
  }

  private static AuraHandledException handledError(String message) {
    AuraHandledException error = new AuraHandledException(message);
    error.setMessage(message);
    return error;
  }
}
