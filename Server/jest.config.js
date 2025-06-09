export default {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/.jest/setTestEnvVars.js"],
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  transform: {}
};