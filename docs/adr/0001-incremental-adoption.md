# ADR 0001: Adopt types incrementally

## Status

Accepted

## Date

2026-11-20

## Context

The repository is a learning lab, not an existing production package. The useful lesson is still the incremental one: JavaScript can be checked in place, and a single component can move to TypeScript without a project-wide migration. Salesforce's 2022 guidance and the current developer-preview guide describe those as different setups. Putting both into one `tsconfig.json` makes it unclear which setting caused a diagnostic.

## Decision

- The default check is `npm run typecheck`. The root `tsconfig.json` sets `allowJs` and `checkJs` to false, includes only `readingList.ts` and `types/`, and emits nothing.
- JSDoc checking lives in `examples/jsdoc-check`, outside `force-app`, with `checkJs` and `noEmit`.
- One component, `readingList`, is authored in TypeScript. Its tests and the generated JavaScript stay in JavaScript.
- Jest prefers `.js` over `.ts` so the test runs the file Salesforce would deploy.

## Consequences

- Adding a `.js` Lightning web component does not put it under the type checker.
- A JSDoc experiment cannot change deployment output.
- The TypeScript component needs an explicit build before deployment. Forgetting to commit `readingList.js` fails CI, because the build must leave git with a clean tree.
- The next component can stay in JavaScript or follow the same build. It should not flip the root config to `checkJs`.
