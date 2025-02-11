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

test.describe("Upgrade Page", () => {
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

    await mainPage.click(".test-go-to-upgrade-btn");
    await mainPage.waitForURL(/\/#\/upgrade/);
  });

  test.afterEach(async () => {
    await electronApp?.close();
  });

  test("should display the upgrade page correctly", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    await expect(mainPage.locator(".test-plan-choose-header")).toHaveText(
      "Choose Your Plan"
    );
    await expect(mainPage.locator(".test-free-plan")).toBeVisible();
    await expect(mainPage.locator(".test-premium-plan")).toBeVisible();
    await expect(mainPage.locator(".test-payperuse-plan")).toBeVisible();
  });

  test("should show correct pricing for each plan", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    await expect(mainPage.locator(".test-free-plan-price")).toBeVisible();
    await expect(mainPage.locator(".test-free-plan-price")).toContainText("$0");
    await expect(mainPage.locator(".test-premium-plan-price")).toBeVisible();
    await expect(mainPage.locator(".test-premium-plan-price")).toContainText(
      "$25/month"
    );
    await expect(mainPage.locator(".test-payperuse-plan-price")).toBeVisible();
    await expect(mainPage.locator(".test-payperuse-plan-price")).toContainText(
      "$1/1 credit"
    );
  });

  test("should disable the Free Plan button", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    const freePlanButton = mainPage.locator(".test-free-plan-btn");
    await expect(freePlanButton).toBeDisabled();
  });

  test("should handle upgrade button based on subscription status", async () => {
    if (!mainPage) throw new Error("Main page not initialized");

    const premiumButton = mainPage.locator(".test-premium-plan-btn");

    // Wait for the button to become enabled or disabled (server update)
    await mainPage.waitForFunction(
      async () => {
        const button = document.querySelector(".test-premium-plan-btn");
        return (
          button &&
          (button.hasAttribute("disabled") || !button.hasAttribute("disabled"))
        );
      },
      null,
      { timeout: 15000 } // Adjust timeout if needed
    );

    // Check the final button state
    const isDisabled = await premiumButton.isDisabled();

    if (isDisabled) {
      console.log("User is already subscribed, button is disabled.");
      await expect(premiumButton).toHaveClass(/cursor-not-allowed/); // Verify disabled styling
    } else {
      console.log("User is not subscribed, upgrading...");
      await premiumButton.click();
      await mainPage.waitForURL(/\/#\/payment/);
      await expect(mainPage).toHaveURL("http://localhost:3000/#/payment");
    }
  });

  test("should navigate to Pay Per Use payment when clicking 'Buy Tokens'", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    const buyTokensButton = mainPage.locator(".test-payperuse-plan-btn");
    await buyTokensButton.click();
    await mainPage.waitForURL(/\/#\/pay_per_use_payment/);
    await expect(mainPage).toHaveURL(
      "http://localhost:3000/#/pay_per_use_payment"
    );
  });
});
