# salesforce-typescript-lab

Learning lab for JavaScript types, TypeScript, and LWC in a Salesforce DX project.

A small Salesforce DX project for a fictional personal reading list. It shows two ways to add types without treating the result as a production app: check existing JavaScript with JSDoc, and compile one Lightning web component from TypeScript to the JavaScript Salesforce deploys.

## Prerequisites

Local checks need Node.js 22 and npm. This repository was verified with Node.js 22.23.4 and npm 10.9.9. GitHub Actions uses Node.js 22.

Salesforce CLI is only needed if you deploy or run Apex tests. The project was scaffolded with `@salesforce/cli` 2.159.7 (`sf template generate project`, `sf template generate apex class`, and `sf template generate lightning component`). The npm scripts do not call the CLI and do not need an org, a login, or any credential.

## Setup

```bash
npm ci
```

## Scripts

| Script                    | What it does                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `npm run typecheck`       | Checks the TypeScript LWC and the isolated JSDoc example. Writes nothing.                  |
| `npm run typecheck:lwc`   | Checks only `readingList.ts` and `types/`.                                                 |
| `npm run typecheck:jsdoc` | Checks `examples/jsdoc-check` with `checkJs`. Writes nothing.                              |
| `npm run build`           | Type-checks the LWC, writes `readingList.js`, and compiles that file with `@lwc/compiler`. |
| `npm test`                | Runs the Jest test for the generated component.                                            |
| `npm run lint`            | Lints the component's TypeScript, generated JavaScript, and Jest test.                     |
| `npm run prettier`        | Formats Apex, LWC, TypeScript, JavaScript, JSON, Markdown, and XML.                        |
| `npm run prettier:verify` | Fails when formatting differs from Prettier.                                               |

After changing `readingList.ts`, run `npm run build` and commit the updated `readingList.js`. A second build should leave that file unchanged.

## Project layout

```text
.github/workflows/ci.yml
config/project-scratch-def.json
docs/architecture.md
docs/learning-path.md
docs/adr/
examples/jsdoc-check/
force-app/main/default/classes/
force-app/main/default/lwc/readingList/
scripts/build-lwc.mjs
types/
eslint.config.js
jest.config.js
package.json
sfdx-project.json
tsconfig.json
```

`sf template generate project --template standard` also creates empty metadata directories such as `aura`, `objects`, and `triggers`. Git does not store empty directories, so they are not part of the committed tree. The scratch org file is a starting point only. It contains no credentials.

## What the sample does

`readingList` shows four fictional books returned by `ReadingListController.getBooks`. Choosing a status calls `updateReadingStatus`. The component keeps the returned row in memory. The Apex sample is not stored, and the next load shows the original list again. See [docs/architecture.md](docs/architecture.md).

## Two type-checking paths

1. **JavaScript and JSDoc.** `examples/jsdoc-check` has its own `tsconfig.json` with `checkJs` and `noEmit`. The root config leaves `allowJs` and `checkJs` off, so the default check does not start examining every `.js` file.
2. **TypeScript for one LWC.** `readingList.ts` is the source. `npm run build` writes the `.js` file next to it. Salesforce deploys the JavaScript. `.forceignore` excludes the `.ts` source and TypeScript config.

The walkthrough, including a small edit that should fail the checker, is in [docs/learning-path.md](docs/learning-path.md).

## Native TypeScript support and this repository

Salesforce documents more than one TypeScript path, and they do not currently say the same thing. Checked on 20 November 2026:

- [TypeScript (Developer Preview)](https://developer.salesforce.com/docs/platform/lwc/guide/ts.html) says the feature is a developer preview that began in Winter '25, is not generally available, and can change or be withdrawn. It says the LWC compiler does not compile TypeScript, the platform does not store `.ts` files, and you produce JavaScript with `tsc` before deploying. It also says `experimentalDecorators` must be `false`, and that the VS Code extension's types then report an error on every decorator unless you suppress it.
- [The Salesforce Developer’s Guide to the Spring ’26 Release](https://developer.salesforce.com/blogs/2026/01/developers-guide-to-the-spring-26-release) (January 2026) still says to compile with `npx tsc` and deploy the JavaScript. Base-component types in `@salesforce/lightning-types` were called complete in that post. This lab does not use base components, so it does not depend on that package.
- Salesforce CLI 2.159.7 describes `sf template generate project --lwc-language typescript` differently: TypeScript is compiled locally for validation, then the `.ts` files are deployed for server-side type stripping. The generated `tsconfig.json` extends `.sfdx/tsconfig.sfdx.json`, includes `.sfdx/typings`, and sets `erasableSyntaxOnly`. The generated component template gitignores `*.js`.

This lab follows the documented "deploy JavaScript" behavior and does not depend on server-side type stripping or on files created by the VS Code extension. `tsc` 5.9.3's own decorator emit was rejected by `@lwc/compiler` 9.6.0 (`LWC1104: "api" can only be used as a class decorator`). The build therefore strips types with Babel and leaves `@api` in the JavaScript. Details are in [docs/adr/0003-ts-to-deployment.md](docs/adr/0003-ts-to-deployment.md).

## Deployment and Apex tests

Deploy from a machine that already has a Salesforce org authorized. CI does not do this.

```bash
npm run build
sf project deploy start --source-dir force-app
```

`.forceignore` keeps `readingList.ts`, declaration files, and TypeScript config out of the deployment. Place the exposed `readingList` component on an App, Home, or Record page. Its `heading` property is public.

Apex tests run only inside an org:

```bash
sf apex run test --tests ReadingListControllerTest --result-format human --synchronous
```

## Continuous integration

`.github/workflows/ci.yml` installs dependencies with `npm ci` and runs type-check, build, a clean-tree check, lint, Jest, and Prettier. It does not install Salesforce CLI, log in, or deploy.

## Limitations

- The reading list is sample data. Status changes disappear on reload.
- `types/apex-contracts.ts` documents the expected response. It does not check Apex at runtime and it will not notice if the Apex fields change. The component checks the JSON it receives. See [docs/adr/0002-apex-contract-maintenance.md](docs/adr/0002-apex-contract-maintenance.md).
- TypeScript does not see the HTML template, so a property used only there must stay visible to the type checker by being read from TypeScript or left public.
- Jest does not execute Apex. Apex coverage is unmeasured until the test class runs in an org.
- There is no scratch-org automation, no packaging, and no customer or company metadata.
