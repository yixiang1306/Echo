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

test.describe("Login Page", () => {
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
    await electronApp?.close();
  });

  // Test: Prevent multiple clicks during login
  test("should disable login button while processing", async () => {
    if (!mainPage) throw new Error("Main page not initialized");

    // Navigate to Login page
    await mainPage.click(".login-btn");
    await mainPage.waitForURL(/\/#\/login/);

    // Enter valid credentials
    await mainPage.fill('input[type="email"]', "wronguser@example.com");
    await mainPage.fill('input[type="password"]', "wrongpassword");

    await mainPage.click(".login-button");

    // Ensure button text changes to "Logging in..."
    await expect(mainPage.locator(".login-button")).toBeDisabled();
  });

  test("should show an error when login fails", async () => {
    if (!mainPage) throw new Error("Main page not initialized");

    // Navigate to Login page
    const loginBtn = mainPage.locator(".login-btn");
    await expect(loginBtn).toBeVisible({ timeout: 10000 }); // Ensure button is visible
    await loginBtn.click();
    await mainPage.waitForURL(/\/#\/login/);

    // Enter incorrect credentials
    await mainPage.fill('input[type="email"]', "wronguser@example.com");
    await mainPage.fill('input[type="password"]', "wrongpassword");

    const submitBtn = mainPage.locator(".login-button");
    await expect(submitBtn).toBeVisible({ timeout: 5000 }); // Ensure it's loaded
    await submitBtn.click();

    // Verify that an error message appears
    await expect(mainPage.locator(".error-message")).toBeVisible();
    await expect(mainPage.locator(".error-message")).toHaveText(
      /Error signing in/
    );
  });

  // Test: Login with valid credentials
  test("should allow login with valid credentials", async () => {
    if (!mainPage) throw new Error("Main page not initialized");

    // Navigate to Login page
    const loginBtn = mainPage.locator(".login-btn");
    await expect(loginBtn).toBeVisible({ timeout: 10000 }); // Ensure button is visible
    await loginBtn.click();
    await mainPage.waitForURL(/\/#\/login/);

    // Enter valid credentials
    await mainPage.fill('input[type="email"]', "khantkokozawwork@gmail.com");
    await mainPage.fill('input[type="password"]', "khantkokozaw38");

    const submitBtn = mainPage.locator(".login-button");
    await expect(submitBtn).toBeVisible({ timeout: 5000 }); // Ensure it's loaded
    await submitBtn.click();

    // Ensure no error message appears
    await expect(mainPage.locator(".error-message")).not.toBeVisible();

    // Ensure redirection to /app
    await mainPage.waitForURL(/\/#\/app/, { timeout: 20000 });
    await expect(mainPage.locator(".profile-icon")).toBeVisible();
  });
});
