/**
 * @description Tests the sample reading list. These tests run in a Salesforce
 *              org. GitHub Actions does not authenticate an org, so CI does
 *              not execute this class.
 */
@isTest
private class ReadingListControllerTest {
  @isTest
  static void getBooksReturnsFictionalSample() {
    Test.startTest();
    List<BookSummary> books = ReadingListController.getBooks();
    Test.stopTest();

    Assert.areEqual(4, books.size(), 'Expected the four sample books.');
    Assert.areEqual('book-lantern', books[0].bookId);
    Assert.areEqual('The Lantern on Pell Street', books[0].title);
    Assert.areEqual('Mara Quinn', books[0].authorName);
    Assert.areEqual('Reading', books[0].status);
    Assert.areEqual(80, books[0].pagesRead);
    Assert.areEqual(240, books[0].pageCount);
    Assert.areEqual('Finished', books[2].status);
    Assert.isNull(
      books[3].pageCount,
      'The rain field guide has no known length.'
    );
  }

  @isTest
  static void updateReadingStatusReturnsCopyWithoutChangingSample() {
    Test.startTest();
    BookSummary updated = ReadingListController.updateReadingStatus(
      'book-orbit',
      'Reading'
    );
    List<BookSummary> books = ReadingListController.getBooks();
    Test.stopTest();

    Assert.areEqual('book-orbit', updated.bookId);
    Assert.areEqual('Reading', updated.status);
    Assert.areEqual('Notes from a Quiet Orbit', updated.title);
    Assert.areEqual(0, updated.pagesRead);
    Assert.areEqual(
      'Not started',
      books[1].status,
      'getBooks returns the original sample, not the unsaved update.'
    );
  }

  @isTest
  static void updateReadingStatusRejectsBlankBookId() {
    assertHandledError(null, 'Reading', 'A book id is required.');
    assertHandledError('  ', 'Reading', 'A book id is required.');
  }

  @isTest
  static void updateReadingStatusRejectsUnknownStatus() {
    assertHandledError(
      'book-lantern',
      null,
      'Choose Not started, Reading, or Finished.'
    );
    assertHandledError(
      'book-lantern',
      'Abandoned',
      'Choose Not started, Reading, or Finished.'
    );
  }

  @isTest
  static void updateReadingStatusRejectsUnknownBook() {
    assertHandledError(
      'book-missing',
      'Finished',
      'That book is not on the reading list.'
    );
  }

  private static void assertHandledError(
    String bookId,
    String status,
    String expectedMessage
  ) {
    try {
      ReadingListController.updateReadingStatus(bookId, status);
      Assert.fail(
        'Expected an AuraHandledException for book "' + bookId + '".'
      );
    } catch (AuraHandledException error) {
      Assert.areEqual(expectedMessage, error.getMessage());
    }
  }
}
