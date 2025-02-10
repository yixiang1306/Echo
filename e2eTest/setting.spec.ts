import {
  test,
  expect,
  _electron,
  ElectronApplication,
  Page,
} from "@playwright/test";

let electronApp: ElectronApplication | undefined;
let mainPage: Page | undefined;

async function waitForPreloadScript() {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      if (!mainPage) return;
      const electronBridge = await mainPage.evaluate(() => {
        return (window as Window & { electron?: any }).electron;
      });
      if (electronBridge) {
        clearInterval(interval);
        resolve(true);
      }
    }, 100);
  });
}

test.describe("Settings Page", () => {
  test.beforeEach(async () => {
    electronApp = await _electron.launch({
      args: ["."],
      env: { NODE_ENV: "development" },
    });

    mainPage = await electronApp.firstWindow();
    await mainPage.waitForLoadState("domcontentloaded");
    await waitForPreloadScript();

    const isLoggedIn = await mainPage
      .locator(".profile-icon") // Change this to a selector that appears only after login
      .isVisible()
      .catch(() => false);

    if (!isLoggedIn) {
      console.log("No active session. Logging in...");

      // Navigate to login page
      await mainPage.click(".login-btn");
      await mainPage.waitForURL(/\/#\/login/);

      // Perform login
      await mainPage.fill('input[type="email"]', "khantkokozawwork@gmail.com");
      await mainPage.fill('input[type="password"]', "khantkokozaw38");
      await mainPage.click(".login-button");

      // Ensure login is successful
      await mainPage.waitForURL(/\/#\/app/);

      const profileIcon = ".profile-icon";
      await mainPage.click(profileIcon);
      await mainPage.click(".test-go-to-settings-btn");
      await mainPage.waitForURL(/\/#\/settings/);

      console.log("Login successful and settings page loaded.");
    } else {
      console.log("Session exists. Skipping login.");
    }
  });
  test.afterEach(async () => {
    mainPage?.close();
    await electronApp?.close();
  });

  test("should display settings page correctly", async () => {
    if (!mainPage) throw new Error("Main page not initialized");

    await expect(mainPage.locator(".test-setting-text")).toBeVisible();
    await expect(mainPage.locator(".test-update-acc-btn")).toBeVisible();
    await expect(mainPage.locator(".test-feedback-btn")).toBeVisible();
    await expect(mainPage.locator(".test-clear-History-btn")).toBeVisible();
    await expect(mainPage.locator(".test-darkmode_btn")).toBeVisible();
  });

  test("should navigate to Profile Settings", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    await mainPage.click(".test-update-acc-btn");
    await expect(mainPage).toHaveURL(/\/updateAcc/); // Check if redirected
  });

  test("should navigate to Feedback mainPage", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    await mainPage.click(".test-feedback-btn");
    await expect(mainPage).toHaveURL(/\/feedback/); // Check if redirected
  });

  test("should clear chat history", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    await mainPage.click(".test-clear-History-btn");

    // Validate that chat history is cleared (assumes a UI change happens)
    const chatMessages = mainPage.locator(".message-box > div");
    await expect(chatMessages).toHaveCount(0);
  });

  test("should toggle dark mode", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    const themeButton = mainPage.locator(".test-darkmode_btn");

    // Check initial theme state
    const isDarkMode = await mainPage.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );

    // Click to toggle dark mode
    await themeButton.click();

    if (isDarkMode) {
      await expect(mainPage.locator("html")).not.toHaveClass(/dark/);
    } else {
      await expect(mainPage.locator("html")).toHaveClass(/dark/);
    }

    // Ensure it persists after page reload
    await mainPage.reload();
    if (isDarkMode) {
      await expect(mainPage.locator("html")).not.toHaveClass(/dark/);
    } else {
      await expect(mainPage.locator("html")).toHaveClass(/dark/);
    }
  });

  test("should close settings when clicking the close button", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    await mainPage.click(".test-close-btn"); // Click close button
    await expect(mainPage).not.toHaveURL(/\/settings/);
  });
});
