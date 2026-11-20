# ADR 0003: Deploy JavaScript produced by a type-stripping build

## Status

Accepted

## Date

2026-11-20

## Context

Salesforce's public documentation does not describe one stable TypeScript deployment model. Sources checked on 20 November 2026:

| Source                                                                                                                              | What it says                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [LWC TypeScript guide](https://developer.salesforce.com/docs/platform/lwc/guide/ts.html)                                            | Developer preview since Winter '25. Not generally available. The LWC compiler does not compile TypeScript, the platform does not store `.ts` files, and you run `tsc` to produce `.js`. `experimentalDecorators` must be false. Extension-provided decorator types then need `// @ts-expect-error` or `// @ts-ignore`.    |
| [Spring '26 release guide](https://developer.salesforce.com/blogs/2026/01/developers-guide-to-the-spring-26-release) (January 2026) | Compile with `npx tsc --project ./force-app/main/default/lwc`, then deploy the JavaScript.                                                                                                                                                                                                                                |
| Salesforce CLI 2.159.7, `sf template generate project --help`                                                                       | `--lwc-language typescript` compiles locally for validation and deploys `.ts` files for server-side type stripping. The generated config extends `.sfdx/tsconfig.sfdx.json`, includes `.sfdx/typings`, sets `erasableSyntaxOnly`, and does not ignore `*.ts` in `.forceignore`. The component template gitignores `*.js`. |

Those instructions disagree. This lab cannot rely on server-side stripping while the LWC guide still says the platform does not store TypeScript. It also cannot ask CI to read `.sfdx/typings`.

Decorator emit was checked with TypeScript 5.9.3 and `@lwc/compiler` 9.6.0 before choosing a build:

- `experimentalDecorators: true` emits a `__decorate(...)` helper. `@lwc/compiler` reports `LWC1104: "api" can only be used as a class decorator`.
- `experimentalDecorators: false` emits `__esDecorate` / standard-decorator helpers. The same compiler reports `LWC1104`.
- Babel 7.29 (`@babel/plugin-syntax-decorators` 7.29.7 with `version: "2023-11"`, and `@babel/plugin-transform-typescript` 7.29.9) removes types and leaves `@api` in the source. `@lwc/compiler` 9.6.0 accepts that file and registers `heading` in `publicProps`.
- `@lwc/compiler` 8.28.2, which `@salesforce/sfdx-lwc-jest` 7.9.0 depends on, accepts the same file and registers `heading` the same way.

`erasableSyntaxOnly` in TypeScript 5.9.3 allows the `@api` decorator and rejects `enum` and constructor parameter properties. Node.js 22.23.4 can also strip types and leave `@api`, but `node:module` `stripTypeScriptTypes` still prints an experimental warning and leaves gaps where the types were. Babel's printer plus Prettier is the repeatable output.

The hand-written `api` type matches a standard field decorator, so the component does not need `@ts-expect-error` on `@api`. That suppression in the Salesforce guide is specific to the VS Code extension's generated types. This repo does not enable `salesforcedx-vscode-lwc.preview.typeScriptSupport`, because that setting generates another `tsconfig.json` that points at `.sfdx`.

## Decision

- Author `readingList.ts`. Commit `readingList.js`. Ignore `*.ts` and TypeScript config in `.forceignore`.
- Type-check with `tsc --noEmit`. Do not use `tsc` to emit the component.
- Build with `scripts/build-lwc.mjs`: strip types, format with Prettier, fail the build if `@api` disappeared or a decorator helper appeared, then compile the result with `@lwc/compiler` 8.28.2.
- Pin `@lwc/compiler` to 8.28.2 so Jest's engine and the build check use one compiler. The 9.6.0 result above is a point-in-time check of the then-current compiler, not a second dependency.
- Keep `experimentalDecorators` false and `erasableSyntaxOnly` true, matching the current preview and CLI template settings that are about checking rather than about `tsc` emit.

## Consequences

- Deployment does not require the Salesforce CLI to strip types, and it does not upload `readingList.ts`.
- CI proves the committed JavaScript still matches a fresh build.
- Upgrading TypeScript or Babel can change formatting. The lockfile and the clean-tree check make that visible.
- If Salesforce later makes server-side type stripping generally available and the LWC guide agrees, this decision should be revisited. Until those sources agree, the deployed artifact stays JavaScript that still contains `@api`.
