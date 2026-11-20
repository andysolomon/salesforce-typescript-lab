# Learning path

Start with the JavaScript you already have. Move one component to TypeScript when the types are worth a build step. This repository keeps those as two separate configs so the first one does not change how the second one deploys.

## 1. JavaScript with JSDoc

`examples/jsdoc-check/tsconfig.json` is intentionally small:

- `allowJs` and `checkJs` are on, so TypeScript checks `.js` files.
- `noEmit` is on, so the check does not write `.js` output or change a deployment.
- `strict` is on, including null checks.
- The config includes only this folder. The root `tsconfig.json` sets `allowJs` and `checkJs` to false.

`readingProgress.js` gives `pagesRead` and `pageCount` JSDoc types. `readingPercent` returns `number | null`, and `describeProgress` has to handle the null before it treats the value as a percentage. `unchecked.js` starts with `// @ts-nocheck`, which is the local opt-out when `checkJs` is enabled for a folder. A single file can opt in with `// @ts-check` when the config leaves `checkJs` off.

Run:

```bash
npm run typecheck:jsdoc
```

To see the checker fail, remove the `percent === null` branch in `describeProgress` and return `percent.toFixed(0)`. `npm run typecheck:jsdoc` reports `TS18047: 'percent' is possibly 'null'`. Put the branch back afterward. To see the opt-out, remove `// @ts-nocheck` from `unchecked.js`. The checker reports `TS7006` because `pagesRead` has no type. Restore the directive afterward.

This example is plain JavaScript outside `force-app`. It has no LWC decorators. A JSDoc check of an LWC file that uses `@api` needs a target new enough for class fields, and decorator checking has its own compiler setting. That setting is easy to confuse with the TypeScript LWC setting, which is why it is not mixed into this example. The 2022 Salesforce article ["How to Use TypeScript with Salesforce – Part 2"](https://developer.salesforce.com/blogs/2022/04/how-to-use-typescript-with-salesforce-part-2) showed `checkJs` with `experimentalDecorators: true` for LWC JavaScript. The current developer-preview guide for `.ts` files says the opposite about `experimentalDecorators`. Keep those configs separate.

## 2. TypeScript for one LWC

`force-app/main/default/lwc/readingList/readingList.ts` is the converted controller. The root `tsconfig.json` checks that file and `types/`. It does not emit JavaScript. `npm run build` writes `readingList.js`.

Useful checks already encoded in the component:

- `ReadingStatus` is a union. Passing `'Abandoned'` to `updateReadingStatus` is a type error.
- `pageCount` is `number | null`. `formatProgress` has to handle null before dividing.
- Apex imports are typed in `types/salesforce-modules.ts`. `getBooks("extra")` is a type error because the method takes no arguments. `updateReadingStatus({ bookId, status: "Abandoned" })` is a type error because that status is not a `ReadingStatus`.
- The values that come back from Apex are read as `unknown` and checked with `isBookSummary` before they are stored. The declaration file does not do that check.

Try this in `readingList.ts` and run `npm run typecheck:lwc`:

```typescript
const percentLabel = book.pageCount.toFixed(0);
```

TypeScript should refuse to call `toFixed` because `pageCount` may be null. Delete the line after you have seen the error, then run `npm run build` if you had already built.

`@api heading` is typed as a standard field decorator because `experimentalDecorators` is false. The generated JavaScript still contains the decorator literally:

```javascript
export default class ReadingList extends LightningElement {
  @api
  heading = "Reading list";
```

That is the form `@lwc/compiler` 8.28.2 and 9.6.0 both accept. `tsc` does not emit that form. See [adr/0003-ts-to-deployment.md](adr/0003-ts-to-deployment.md).

The Jest test imports `c/readingList` and therefore runs `readingList.js`, not the `.ts` file. `npm test` is a behavioral check of the deployed source. `npm run typecheck` is the type check.

## What not to turn on globally

Do not set `checkJs` in the root config to "get more coverage." That would start checking the generated component, the Jest test, and any other JavaScript under the include paths, using the LWC compiler settings. Add another folder with its own `tsconfig.json` when you want a second example.
