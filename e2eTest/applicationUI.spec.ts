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
test.describe("Application UI", () => {
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

  // Test : Sidebar Toggle
  test("should toggle the sidebar", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    // 🔹 Check if the user is already logged in

    // Click to hide sidebar
    await mainPage.click(".sidebar-toggle-button");
    await expect(mainPage.locator(".sidebar-test")).not.toBeVisible();

    // Click again to show sidebar
    await mainPage.click(".sidebar-toggle-button");
    await expect(mainPage.locator(".sidebar-test")).toBeVisible();
  });

  // Test : Sending a Message
  test("should allow sending a message", async () => {
    if (!mainPage) throw new Error("Main page not initialized");

    const inputSelector = ".chat-input";
    const sendButton = ".send-button"; // Message send button
    const chatMessageSelector = ".message-box";

    await mainPage.fill(inputSelector, "Hello, AI!");
    await mainPage.click(sendButton);

    // Ensure the message appears in the chat
    await expect(mainPage.locator(chatMessageSelector)).toContainText(
      "Hello, AI!"
    );
  });

  // Test : Message Tagging (Web Search)
  test("should tag a message as a web search", async () => {
    if (!mainPage) throw new Error("Main page not initialized");

    const webSearchButton = ".web-search-btn"; // Web Search button
    const inputSelector = ".chat-input";
    const sendButton = ".send-button"; // Send button

    await mainPage.click(webSearchButton);
    await mainPage.fill(inputSelector, "Find the latest news");
    await mainPage.click(sendButton);

    await expect(
      mainPage.locator(".message-box .user-message").last()
    ).toContainText("Find the latest news", { timeout: 5000 });
  });

  // Test : Voice Recording Toggle
  test("should toggle voice recording", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    const micButton = ".microphone-button"; // Microphone button selector

    // Start recording
    await mainPage.click(micButton);
    await expect(mainPage.locator(micButton)).toHaveClass(/bg-red-500/); // Ensure it turns red (recording mode)

    // Stop recording
    await mainPage.click(micButton);
    await expect(mainPage.locator(micButton)).toHaveClass(/bg-green-600/); // Ensure it turns green (idle mode)
  });

  // Test : Check Free Coin and Wallet Balance
  test("should display free coin and wallet balance", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    const freeCoinSelector = ".free-coin";
    const walletCoinSelector = ".wallet-coin";

    await expect(mainPage.locator(freeCoinSelector)).toBeVisible();
    await expect(mainPage.locator(walletCoinSelector)).toBeVisible();
  });

  // Test : Logout Functionality
  test("should log out the user", async () => {
    if (!mainPage) throw new Error("Main page not initialized");
    const profileIcon = ".profile-icon";
    const logoutOption = ".logout-option";
    const confirmLogoutButton = 'button:text("Confirm")';

    // Open profile dropdown
    await mainPage.click(profileIcon);
    await mainPage.click(logoutOption);

    // Confirm logout
    await mainPage.click(confirmLogoutButton);

    await mainPage.waitForURL(/\/#\/$/, { timeout: 10000 });
    await expect(mainPage.locator(".login-btn")).toBeVisible();
  });
});
