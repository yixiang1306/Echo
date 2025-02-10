// import {
//   test,
//   expect,
//   _electron,
//   ElectronApplication,
//   Page,
// } from "@playwright/test";

// let electronApp: ElectronApplication | undefined;
// let mainPage: Page | undefined;

// async function waitForPreloadScript() {
//   return new Promise((resolve) => {
//     const interval = setInterval(async () => {
//       if (!mainPage) {
//         return; // Ensure mainPage is defined
//       }
//       const electronBridge = await mainPage.evaluate(() => {
//         return (window as Window & { electron?: any }).electron;
//       });
//       if (electronBridge) {
//         clearInterval(interval);
//         resolve(true);
//       }
//     }, 100);
//   });
// }

// test.beforeEach(async () => {
//   try {
//     electronApp = await _electron.launch({
//       args: ["."], // Adjust the path if necessary
//       env: {
//         NODE_ENV: "development",
//       },
//     });

//     mainPage = await electronApp.firstWindow();
//     await mainPage.waitForLoadState("domcontentloaded");
//     await waitForPreloadScript();
//   } catch (error) {
//     console.error("Failed to launch Electron:", error);
//     throw error;
//   }
// });

// test.afterEach(async ({}, testInfo) => {
//   testInfo.setTimeout(60000); // Set to 60 seconds
//   if (electronApp) {
//     try {
//       await electronApp.close();
//     } catch (err) {
//       console.error("Error closing Electron app:", err);
//       electronApp.process().kill();
//     }
//   }
// });

// // test("should have a minimum window size", async () => {
// //   if (!mainPage) {
// //     throw new Error("Main page not initialized");
// //   }

// //   // Get the application window's size via Electron API exposed through preload
// //   const windowSize = await mainPage.evaluate(() => {
// //     return (window as Window & { electron?: any }).electron.getWindowSize();
// //   });

// //   expect(windowSize.width).toBeGreaterThanOrEqual(800);
// //   expect(windowSize.height).toBeGreaterThanOrEqual(600);
// // });

// // Example corrected test for URL route
// test("should open the main window and load the correct route", async () => {
//   if (!mainPage) {
//     throw new Error("Main page not initialized");
//   }

//   const currentUrl = mainPage.url();
//   expect(currentUrl).toMatch(/\/#\/(app|)/);
// });
