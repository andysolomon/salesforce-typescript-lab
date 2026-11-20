# ADR 0002: Hand-maintain the Apex contract

## Status

Accepted

## Date

2026-11-20

## Context

`readingList.ts` needs a type for `getBooks` and `updateReadingStatus`. Salesforce can generate typings under `.sfdx/typings` from an authorized org or from the VS Code extension. That folder is machine-local, is not created by `npm ci`, and is the wrong dependency for a public CI run. Official preview packages cover Lightning base components, not this lab's Apex classes.

The Apex class and the TypeScript interface can also drift. A declaration file is erased at build time. It cannot reject a JSON payload.

## Decision

- `types/apex-contracts.ts` is the hand-written `BookSummary` and `ReadingStatus` shape.
- `types/salesforce-modules.ts` declares `lwc` and the two `@salesforce/apex/...` modules. Multi-argument Apex methods are typed as the single object LWC passes. The Apex modules refer to the contract with `import("...")` types. A relative `import` declaration is not legal inside `declare module`, and `skipLibCheck` would hide that error in a `.d.ts` file.
- The component assigns Apex results to `unknown` and runs `isBookSummary` before storing them. That is the runtime boundary the declaration file does not provide.
- No script generates these files from Apex, and CI does not read `.sfdx/typings`.

## Consequences

- A fresh clone type-checks with `npm ci` and `npm run typecheck`.
- Renaming an Apex field, or adding a status, does not fail the TypeScript check until someone updates the declaration. The runtime check fails closed for missing fields and unknown statuses, which is narrower than a full schema diff.
- The declarations are part of the lesson. Replacing them with a generated client would hide the drift problem this lab is here to show.
- `wire` and `track` are not declared. Add them to `types/salesforce-modules.ts` when a component uses them, instead of widening the import to `any`.
