export default {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/.jest/setTestEnvVars.js"],
  testMatch: ["**/__tests/**/*.test.js"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  transform: {}
};