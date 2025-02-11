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

test.describe("PayPerUsePayment Component", () => {
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
    const buyTokensButton = mainPage.locator(".test-payperuse-plan-btn");
    await buyTokensButton.click();
    await mainPage.waitForURL(/\/#\/pay_per_use_payment/);
  });

  test.afterEach(async () => {
    await electronApp?.close();
  });

  test("should load the payment page correctly", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    await expect(mainPage.locator("text=Echo Credit Top up")).toBeVisible();
  });

  test("should allow the user to input credits", async () => {
    if (!mainPage) throw new Error("Main mainPage not initialized");
    const creditInput = mainPage.locator("input[type='number']");
    await creditInput.fill("5"); // Set to 5 credits
    await expect(creditInput).toHaveValue("5");
  });

  test("should calculate total amount correctly", async () => {
    if (!mainPage) throw new Error("Main mainPage not initialized");
    await mainPage.locator("input[type='number']").fill("10"); // Enter 10 credits
    await expect(mainPage.locator("text=Total due")).toContainText("$ 10.9"); // 10 + 9% GST
  });

  test("should enter card details correctly", async () => {
    if (!mainPage) throw new Error("Main mainPage not initialized");
    await mainPage.locator("#cardNumber").fill("4111 1111 1111 1111");
    await mainPage.locator("#cardHolderName").fill("John Doe");
    await mainPage.locator("#cardExpiredDate").fill("12/25");
    await mainPage.locator("#cardCVC").fill("123");
    await expect(mainPage.locator("#cardNumber")).toHaveValue(
      "4111 1111 1111 1111"
    );
  });

  test("should submit payment successfully", async () => {
    if (!mainPage) throw new Error("Main mainPage not initialized");
    // Fill payment details
    await mainPage.locator("#cardNumber").fill("4111 1111 1111 1111");
    await mainPage.locator("#cardHolderName").fill("John Doe");
    await mainPage.locator("#cardExpiredDate").fill("12/25");
    await mainPage.locator("#cardCVC").fill("123");

    // Click subscribe button
    await mainPage.locator("button[type='submit']").click();

    // Expect an alert message (mock the alert if needed)
    mainPage.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Payment successful!");
      await dialog.dismiss();
    });
  });
});
