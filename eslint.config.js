module.exports = [
  {
    ignores: ["node_modules/**", "data/**", "test-results/**"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
    },
    rules: {
      "no-redeclare": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
    },
  },
  {
    files: [
      "e2e/**/*.js",
      "scripts/**/*.js",
      "playwright.config.js",
      "web/**/*.test.js",
      "web/**/*.integration.test.js",
      "web/integration-test-setup.js",
      "web/test-support/**/*.js",
      "eslint.config.js",
    ],
    languageOptions: {
      globals: {
        console: "readonly",
        window: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URL: "readonly",
        Response: "readonly",
        module: "readonly",
        require: "readonly",
        process: "readonly",
        __dirname: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
    },
  },
  {
    files: ["web/**/*.js"],
    ignores: [
      "web/**/*.test.js",
      "web/**/*.integration.test.js",
      "web/integration-test-setup.js",
      "web/test-support/**/*.js",
    ],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        fetch: "readonly",
        history: "readonly",
        location: "readonly",
        URLSearchParams: "readonly",
        CustomEvent: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        module: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
    },
  },
];
