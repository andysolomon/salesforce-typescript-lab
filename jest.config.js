const { jestConfig } = require("@salesforce/sfdx-lwc-jest/config");

module.exports = {
  ...jestConfig,
  // The test runner prefers .ts by default. This lab commits the JavaScript
  // Salesforce deploys, so unit tests load that file when both exist.
  moduleFileExtensions: ["js", "html", "ts"],
  modulePathIgnorePatterns: ["<rootDir>/.localdevserver"]
};
