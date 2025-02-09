// import { test, vi, beforeEach, afterEach, expect } from "vitest";

// import path from "path";
// import { createTray } from "./electron_components/tray.js";
// import { isDev } from "./util.js";
// import { BrowserWindow, Menu } from "electron";

// // Mock Electron API
// vi.mock("electron", () => {
//   return {
//     Tray: vi.fn().mockReturnValue({
//       setContextMenu: vi.fn(),
//     }),
//     app: {
//       getAppPath: vi.fn().mockReturnValue("/mocked/app/path"),
//     },
//     process: {
//       resourcesPath: vi.fn().mockReturnValue("/mocked/resources/path"), // ✅ Mock this to avoid undefined error
//     },
//     Menu: {
//       buildFromTemplate: vi.fn(),
//     },
//   };
// });

// // Setup a mock window
// const mainWindow = {
//   show: vi.fn(),
// } satisfies Partial<BrowserWindow> as any as BrowserWindow;

// const iconPath = isDev()
//   ? path.join(app.getAppPath(), "assets", "icons", "echo-win.ico") // Use app.getAppPath() for dev
//   : path.join(process.resourcesPath, "assets", "icons", "echo-win.ico"); // Use process.resourcesPath for prod

// let trayInstance: Tray;

// beforeEach(() => {
//   trayInstance = createTray(iconPath, mainWindow);
// });

// afterEach(() => {
//   vi.clearAllMocks();
// });

// test("should create a tray icon with correct properties", () => {
//   expect(Menu.buildFromTemplate).toHaveBeenCalled();
// });
