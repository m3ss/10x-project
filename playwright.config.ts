import { defineConfig, devices } from '@playwright/test';

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
  testDir: './tests/e2e',
  
  // Test matching patterns
  testMatch: '**/*.spec.ts',
  
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
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || 'http://localhost:4321',
    
    // Collect trace when retrying failed tests
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video recording
    video: 'retain-on-failure',
    
    // Timeout for each action
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 30000,
  },
  
  // Configure projects for Chromium only (as per guidelines)
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Browser context options for isolation
        contextOptions: {
          // Ignore HTTPS errors in development
          ignoreHTTPSErrors: true,
        },
      },
    },
  ],
  
  // Run dev server before tests (optional)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  // Output directory
  outputDir: 'test-results/',
  
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
