/**
 * Ambient modules for the LWC and Apex imports used by readingList.
 *
 * This is a checked TypeScript script, not a .d.ts file, so skipLibCheck
 * cannot hide a broken contract. Import types are inline because a relative
 * import declaration is not allowed inside declare module.
 */

declare module "lwc" {
  export class LightningElement {
    /**
     * Always defined for this shadow-DOM component. Light DOM components
     * would see null at runtime; do not use a non-null assertion there.
     */
    template: ShadowRoot;
    connectedCallback?(): void;
    disconnectedCallback?(): void;
    renderedCallback?(): void;
    dispatchEvent(event: Event): boolean;
  }

  /**
   * Standard field-decorator shape. experimentalDecorators is false.
   * The LWC compiler still requires the emitted JavaScript to contain @api.
   */
  export function api(
    value: undefined,
    context: ClassFieldDecoratorContext
  ): void;
}

declare module "@salesforce/apex/ReadingListController.getBooks" {
  const getBooks: () => Promise<import("./apex-contracts").BookSummary[]>;
  export default getBooks;
}

declare module "@salesforce/apex/ReadingListController.updateReadingStatus" {
  const updateReadingStatus: (params: {
    bookId: string;
    status: import("./apex-contracts").ReadingStatus;
  }) => Promise<import("./apex-contracts").BookSummary>;
  export default updateReadingStatus;
}
