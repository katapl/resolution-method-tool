import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,

  e2e: {
    baseUrl: 'http://localhost:5173/resolution-method-tool',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
