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

test.describe("Feedback UI", () => {
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

      console.log("Login successful.");
    } else {
      console.log("Session exists. Skipping login.");
    }
  });

  test.afterEach(async () => {
    await electronApp?.close();
  });

  test("Submit feedback form successfully", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    const profileIcon = ".profile-icon";
    await mainPage.click(profileIcon);
    await mainPage.click(".test-go-to-settings-btn");
    await mainPage.waitForURL(/\/#\/settings/);

    await mainPage.click(".test-feedback-btn");
    await expect(mainPage).toHaveURL(/\/feedback/);
    // Ensure page loaded correctly

    await expect(mainPage.locator(".test-feedback-text")).toHaveText(
      "We Value Your Feedback"
    );

    // Click on a star rating (e.g., 4 stars)
    const starButtons = mainPage.locator(".test-start-btn");
    await starButtons.nth(3).click(); // Select the fourth star

    // Verify selected rating
    await expect(starButtons.nth(3).locator(".test-star")).toHaveAttribute(
      "fill",
      "#FFD700"
    );

    // Select a category
    const categoryDropdown = mainPage.locator("select");
    await categoryDropdown.selectOption("UI");

    // Verify category selection
    await expect(categoryDropdown).toHaveValue("UI");

    // Fill in comment
    const commentBox = mainPage.locator(".test-textarea");
    await commentBox.fill("This is a test feedback submission.");

    // Verify comment input
    await expect(commentBox).toHaveValue("This is a test feedback submission.");

    // Click submit
    const submitButton = mainPage.locator(".test-submit-btn");
    await submitButton.click();

    // Expect an alert message (mock this if needed)
    mainPage.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Successfully Submitted");
      await dialog.dismiss();
    });

    // Validate form reset
    await expect(commentBox).toHaveValue("");
    await expect(categoryDropdown).toHaveValue("");
    await expect(starButtons.nth(3).locator("svg")).not.toHaveAttribute(
      "fill",
      "#FFD700"
    );
  });
});
