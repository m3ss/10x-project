import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { GeneratePage } from "../pages/GeneratePage";
import { MyFlashcardsPage } from "../pages/MyFlashcardsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { NavbarComponent } from "../pages/components/NavbarComponent";

/**
 * Test Fixtures
 *
 * Provides page objects and utilities as fixtures for tests
 */

interface TestFixtures {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  generatePage: GeneratePage;
  myFlashcardsPage: MyFlashcardsPage;
  settingsPage: SettingsPage;
  navbar: NavbarComponent;
}

/**
 * Extended test with page object fixtures
 */
export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },

  generatePage: async ({ page }, use) => {
    await use(new GeneratePage(page));
  },

  myFlashcardsPage: async ({ page }, use) => {
    await use(new MyFlashcardsPage(page));
  },

  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },

  navbar: async ({ page }, use) => {
    await use(new NavbarComponent(page));
  },
});

export { expect } from "@playwright/test";
