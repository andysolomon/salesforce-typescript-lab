/**
 * @description Reading status and progress for one fictional book.
 *              pageCount is null when the book has no known length.
 *              Field names match types/apex-contracts.ts.
 */
public with sharing class BookSummary {
  @AuraEnabled
  public String bookId { get; set; }

  @AuraEnabled
  public String title { get; set; }

  @AuraEnabled
  public String authorName { get; set; }

  @AuraEnabled
  public String status { get; set; }

  @AuraEnabled
  public Integer pagesRead { get; set; }

  @AuraEnabled
  public Integer pageCount { get; set; }
}
