/**
 * Strip types from the readingList TypeScript controller and write the
 * JavaScript file Salesforce deploys. TypeScript's own emit rewrites
 * decorators into helpers the LWC compiler rejects, so this script uses
 * Babel only as a type stripper and then asks @lwc/compiler to compile
 * the result. The compiler version is pinned to the copy shipped with
 * @salesforce/sfdx-lwc-jest so this check and the Jest runtime match.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { transformSync as babelTransform } from "@babel/core";
import { transformSync as compileLwc } from "@lwc/compiler";
import prettier from "prettier";

const require = createRequire(import.meta.url);
const projectRoot = process.cwd();
const sourcePath = path.join(
  projectRoot,
  "force-app/main/default/lwc/readingList/readingList.ts"
);
const outputPath = path.join(
  projectRoot,
  "force-app/main/default/lwc/readingList/readingList.js"
);

const source = fs.readFileSync(sourcePath, "utf8");
const stripped = babelTransform(source, {
  filename: sourcePath,
  babelrc: false,
  configFile: false,
  sourceMaps: false,
  comments: false,
  plugins: [
    ["@babel/plugin-syntax-decorators", { version: "2023-11" }],
    [
      "@babel/plugin-transform-typescript",
      { allowDeclareFields: true, onlyRemoveTypeImports: true }
    ]
  ]
});

if (!stripped || typeof stripped.code !== "string") {
  throw new Error("Type stripping produced no JavaScript.");
}

const banner = `/**
 * Generated from readingList.ts by npm run build.
 * Salesforce deploys this file. Do not edit it by hand.
 */
`;
const prettierConfig = await prettier.resolveConfig(outputPath);
const formatted = await prettier.format(banner + stripped.code, {
  ...prettierConfig,
  filepath: outputPath
});

assertDecoratorCompatible(formatted);
const compiled = compileForLwc(formatted);
fs.writeFileSync(outputPath, formatted);

const compilerVersion = require("@lwc/compiler/package.json").version;
console.log(
  `Wrote ${path.relative(projectRoot, outputPath)} and @lwc/compiler@${compilerVersion} accepted it.`
);
console.log(
  compiled.includes("registerDecorators")
    ? "Compiler output registers @api through registerDecorators."
    : "Compiler output did not mention registerDecorators."
);

function assertDecoratorCompatible(code) {
  if (!code.includes("@api")) {
    throw new Error("Generated JavaScript lost the @api decorator.");
  }
  if (code.includes("__decorate") || code.includes("__esDecorate")) {
    throw new Error(
      "Generated JavaScript rewrote decorators into helpers the LWC compiler rejects."
    );
  }
}

function compileForLwc(code) {
  try {
    const result = compileLwc(code, outputPath, {
      namespace: "c",
      name: "readingList"
    });
    if (
      !result ||
      typeof result.code !== "string" ||
      !result.code.includes("registerDecorators")
    ) {
      throw new Error(
        "LWC compiler output did not register component decorators."
      );
    }
    return result.code;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `LWC compiler rejected the generated JavaScript: ${message}`
    );
  }
}
