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

test.describe("Start Page", () => {
  test.beforeEach(async () => {
    electronApp = await _electron.launch({
      args: ["."],
      env: { NODE_ENV: "development" },
    });

    mainPage = await electronApp.firstWindow();
    await mainPage.waitForLoadState("domcontentloaded");
    await waitForPreloadScript();
  });

  test.afterEach(async () => {
    mainPage?.close();
    await electronApp?.close();
  });
  test("should display Start screen and navigate to Login", async () => {
    if (!mainPage) throw new Error("Main page not initialized");

    // Check if the Start page loads properly
    await expect(mainPage.locator(".header")).toContainText("AskVox");
    await expect(mainPage.locator(".subtitle")).toHaveText(
      "Ask about anything"
    );
    await expect(mainPage.locator(".login-btn")).toBeVisible();
    await expect(mainPage.locator(".signup-btn")).toBeVisible();

    // Click the Login button and navigate to login page
    await mainPage.click(".login-btn");
    await mainPage.waitForURL(/\/#\/login/);
  });
});
