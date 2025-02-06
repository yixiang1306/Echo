import {
  test,
  expect,
  _electron,
  ElectronApplication,
  Page,
} from "@playwright/test";

let electronApp: ElectronApplication;
let mainPage: Page;

async function waitForPreloadScript() {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
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

test.beforeEach(async () => {
  try {
    electronApp = await _electron.launch({
      args: ["."], // Adjust the path if necessary
      env: {
        NODE_ENV: "development",
      },
    });

    // Get the first window (main window) that is created
    mainPage = await electronApp.firstWindow();
    await mainPage.waitForLoadState("load");
    await waitForPreloadScript();
  } catch (error) {
    console.error("Failed to launch Electron:", error);
    throw error;
  }
});

test.afterEach(async () => {
  await mainPage.close();
  await electronApp.close();
});

test("should have a minimum window size", async () => {
  // Get the window size
  const { width, height } = await mainPage.evaluate(() => {
    const { width, height } = window.screen;
    return { width, height };
  });

  expect(width).toBeGreaterThanOrEqual(800);
  expect(height).toBeGreaterThanOrEqual(600);
});

// test("should open the main window and load the correct route", async () => {
//   const currentUrl = mainPage.url();
//   expect(currentUrl).toMatch(/\/#\/(app|)/);
// });
