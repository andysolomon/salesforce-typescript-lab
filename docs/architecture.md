# Architecture

The lab is one Salesforce DX package, `force-app`, plus local tooling that never deploys.

```text
readingList (LWC)
  getBooks() ---------------------> ReadingListController.getBooks
  updateReadingStatus({...}) ----> ReadingListController.updateReadingStatus
                                      |
                                      v
                                   BookSummary
```

## Metadata

| Piece                           | Role                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `BookSummary.cls`               | Aura-enabled fields for one fictional book. `pageCount` may be null.                  |
| `ReadingListController.cls`     | Returns four sample books and checks a status update.                                 |
| `ReadingListControllerTest.cls` | Apex tests for the sample and the rejected updates. Not run in CI.                    |
| `lwc/readingList`               | List UI. `readingList.ts` is the source. `readingList.js` is what Salesforce deploys. |

`ReadingListController` is `with sharing`. It does not query or update Salesforce records. `getBooks` is cacheable and always returns the same sample. `updateReadingStatus` copies the matching sample, sets the requested status, and returns the copy. A later `getBooks` call still returns the original status. The component replaces only its in-memory row.

Allowed statuses are `Not started`, `Reading`, and `Finished`. Those strings are repeated in Apex and in `types/apex-contracts.ts`. Keeping them aligned is a manual step.

## Browser flow

1. `connectedCallback` calls `getBooks`.
2. The component treats the result as `unknown` and accepts it only when every item has the book fields and a known status.
3. Each row shows the title, author, status, and a progress label. A null or non-positive `pageCount` produces "N pages read" instead of a percentage.
4. A status button calls `updateReadingStatus({ bookId, status })`. A matching book replaces that row. A rejected call, or a payload that fails the same shape check, shows the message and leaves the previous status in place.

The component is exposed to App, Home, and Record pages and supports both form factors. `heading` is an `@api` property with the default "Reading list".

## Local types

`types/salesforce-modules.ts` declares the `lwc` module and the two Apex imports. `types/apex-contracts.ts` is the shared book shape and is imported with `import type`, so Babel removes it from the JavaScript. Both files are `.ts` rather than `.d.ts` so `skipLibCheck` cannot hide a broken contract.

Nothing in `types/` or `examples/` is in the Salesforce package. The root `tsconfig.json` includes the component's `.ts` file and `types/`. It does not include tests, generated JavaScript, or the JSDoc example.

## Build

`scripts/build-lwc.mjs` strips types with `@babel/plugin-transform-typescript` and parses decorators with `@babel/plugin-syntax-decorators` without transforming them. Prettier formats the result into `readingList.js`. The script then runs `@lwc/compiler` 8.28.2, the same version pinned by `@salesforce/sfdx-lwc-jest` 7.9.0. The compiler must accept the file and emit a `registerDecorators` call. The compiled bundle is not written to the repository. Salesforce compiles the component again during deployment.

Jest is configured with `moduleFileExtensions` of `js`, then `html`, then `ts`. The default runner prefers `.ts`. This project prefers `.js` so the unit test executes the file a deployment would use.
