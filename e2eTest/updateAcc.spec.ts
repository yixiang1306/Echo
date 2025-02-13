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

const TEST_EMAIL = "mariohub382000@gmail.com";
const TEST_PASSWORD = "newPassword888";
const NEW_PASSWORD = "applebanana";
const FIRST_NAME = "Kyaw";
const LAST_NAME = "Kyaw";

test.describe("UpdateAcc", () => {
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
      await mainPage.fill('input[type="email"]', TEST_EMAIL);
      await mainPage.fill('input[type="password"]', TEST_PASSWORD);
      await mainPage.click(".login-button");

      // Ensure login is successful
      await mainPage.waitForURL(/\/#\/app/);
      console.log("Login successful.");
    } else {
      console.log("Session exists. Skipping login.");
    }
    const profileIcon = ".profile-icon";
    await mainPage.click(profileIcon);
    await mainPage.click(".test-go-to-settings-btn");
    await mainPage.waitForURL(/\/#\/settings/);

    await mainPage.click(".test-update-acc-btn");
    await mainPage.waitForURL(/\/#\/updateAcc/);
  });

  test.afterEach(async () => {
    await electronApp?.close();
  });

  test("Update Name", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    await mainPage.fill("input#firstName", FIRST_NAME);
    await mainPage.fill("input#lastName", LAST_NAME);
    await mainPage.click("button:text('Update Name')");

    // Check for success message
    await mainPage.click(".test-comfirm-btn");

    await expect(mainPage.locator(".test-response-message")).toContainText(
      "Name updated successfully!",
      { timeout: 5000 }
    );
  });

  test("Update Password", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    await mainPage.fill("input#newPassword", NEW_PASSWORD);
    await mainPage.fill("input#confirmPassword", NEW_PASSWORD);
    await mainPage.click("button:text('Update Password')");

    // Check for success message
    await mainPage.click(".test-comfirm-btn");
    await expect(mainPage.locator(".test-response-message")).toContainText(
      "Password updated successfully!",
      { timeout: 5000 }
    );
  });
});
