import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load test environment variables from .env.test
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * Playwright E2E Testing Configuration
 *
 * Following guidelines:
 * - Chromium/Desktop Chrome only
 * - Browser contexts for test isolation
 * - Parallel execution
 * - Visual comparison support
 * - Trace viewer for debugging
 */
export default defineConfig({
  // Test directory
  testDir: "./tests/e2e",

  // Test matching patterns
  testMatch: "**/*.spec.ts",

  // Fully parallel execution
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
    ["json", { outputFile: "test-results/results.json" }],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || "http://localhost:4321",

    // Collect trace when retrying failed tests
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video recording
    video: "retain-on-failure",

    // Timeout for each action
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for Chromium only (as per guidelines)
  projects: [
    // Setup project - runs once to authenticate and save state
    {
      name: "setup",
      testMatch: "**/auth.setup.api.ts",
    },

    // Auth tests project - NO authenticated state (tests login/register/logout)
    {
      name: "chromium-auth",
      testMatch: "**/auth/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        // No storage state for auth tests - they test authentication itself
        contextOptions: {
          ignoreHTTPSErrors: true,
        },
      },
    },

    // Main test project - uses authenticated state
    {
      name: "chromium",
      testMatch: ["**/*.spec.ts", "!**/auth/**/*.spec.ts"],
      use: {
        ...devices["Desktop Chrome"],
        // Use saved authentication state
        storageState: ".auth/user.json",
        // Browser context options for isolation
        contextOptions: {
          // Ignore HTTPS errors in development
          ignoreHTTPSErrors: true,
        },
      },
      // Run setup before all tests
      dependencies: ["setup"],
    },
  ],

  // Run dev server before tests with test environment variables
  // Disabled - run server manually with: npm run dev
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:4321',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  //   env: {
  //     SUPABASE_URL: process.env.SUPABASE_URL || '',
  //     SUPABASE_KEY: process.env.SUPABASE_KEY || '',
  //     SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  //     OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  //     AI_SERVICE_PROVIDER: process.env.AI_SERVICE_PROVIDER || '',
  //     OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || '',
  //     OPENROUTER_TEMPERATURE: process.env.OPENROUTER_TEMPERATURE || '',
  //     OPENROUTER_TOP_P: process.env.OPENROUTER_TOP_P || '',
  //     AI_SERVICE_TIMEOUT: process.env.AI_SERVICE_TIMEOUT || '',
  //   },
  // },

  // Output directory
  outputDir: "test-results/",

  // Timeout per test
  timeout: 30000,

  // Expect timeout
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
});
