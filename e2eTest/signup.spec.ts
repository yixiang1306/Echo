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

test.describe("Signup Page", () => {
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
  test("should allow a user to sign up successfully", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    // Navigate to Login page
    await mainPage.click(".signup-btn");
    await mainPage.waitForURL(/\/#\/signup/);

    // Fill out the form
    await mainPage.fill('input[placeholder="First Name"]', "John");
    await mainPage.fill('input[placeholder="Last Name"]', "Doe");
    await mainPage.fill('input[placeholder="Email"]', "testuser1@example.com");
    await mainPage.fill('input[placeholder="Password"]', "SecurePassword123");
    await mainPage.fill(
      'input[placeholder="Re-type Password"]',
      "SecurePassword123"
    );

    // Click sign-up button
    await mainPage.click(".test-signup-btn");
    await mainPage.waitForTimeout(5000);

    // Wait for response and check for success message
    await expect(mainPage.locator(".error-message")).toHaveText(
      "Sign-up successful! Check your email."
    );
  });

  test("should show an error if passwords do not match", async () => {
    if (!mainPage) throw new Error("Main mainPage not initialized");
    // Navigate to Login page
    await mainPage.click(".signup-btn");
    await mainPage.waitForURL(/\/#\/signup/);

    await mainPage.fill('input[placeholder="First Name"]', "John");
    await mainPage.fill('input[placeholder="Last Name"]', "Doe");
    await mainPage.fill('input[placeholder="Email"]', "testuser@example.com");
    await mainPage.fill('input[placeholder="Password"]', "SecurePassword123!");
    await mainPage.fill(
      'input[placeholder="Re-type Password"]',
      "DifferentPassword!"
    );

    await mainPage.click(".test-signup-btn");
    await mainPage.waitForTimeout(5000);

    // Validate error message (if you implement frontend validation for password mismatch)
    await expect(mainPage.locator(".error-message")).toHaveText(
      "Passwords do not match!"
    );
  });
});
