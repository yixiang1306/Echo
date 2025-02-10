import { test, expect, vi, beforeEach, describe } from "vitest";

// Mock Electron Modules
vi.mock("electron", () => ({
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadURL: vi.fn(),
    webContents: { session: {} },
    isAlwaysOnTop: vi.fn(),
  })),
  ipcMain: {
    handle: vi.fn(),
  },
  screen: {
    getPrimaryDisplay: vi.fn().mockReturnValue({
      workAreaSize: { width: 1920, height: 1080 },
    }),
  },
}));

vi.stubGlobal("process", {
  resourcesPath: "/mocked/resources/path",
});

// Mock Utility Functions
vi.mock("../util.js", () => ({
  isDev: vi.fn(),
}));

vi.mock("../pathResolver.js", () => ({
  getPreloadPath: vi.fn().mockReturnValue("/mocked/preload/path"),
}));

import { BrowserWindow, ipcMain, screen } from "electron";
import { getPreloadPath } from "../pathResolver.js";
import { isDev } from "../util.js";
import {
  createAudioWindow,
  createMainWindow,
  createSideBarWindow,
} from "../electron_components/windows.js";

describe("Window Creation Functions", () => {
  let mainWindowMock: BrowserWindow;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createMainWindow", () => {
    test("should create the main window with correct properties", () => {
      vi.mocked(isDev).mockReturnValue(true);
      mainWindowMock = createMainWindow(
        "/mocked/icon/path"
      ) as any as BrowserWindow;
      expect(BrowserWindow).toHaveBeenCalledWith({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        show: true,
        icon: "/mocked/icon/path",
        webPreferences: {
          preload: getPreloadPath(),
          contextIsolation: true,
          nodeIntegration: false,
        },
      });
    });

    test("should register IPC handler for 'get-env'", () => {
      vi.mocked(isDev).mockReturnValue(true);
      mainWindowMock = createMainWindow(
        "/mocked/icon/path"
      ) as any as BrowserWindow;

      expect(ipcMain.handle).toHaveBeenCalledWith(
        "get-env",
        expect.any(Function)
      );
    });

    test("should load the correct URL in development mode", () => {
      vi.mocked(isDev).mockReturnValue(true); // Set dev mode
      mainWindowMock = createMainWindow(
        "/mocked/icon/path"
      ) as any as BrowserWindow;

      expect(mainWindowMock.loadURL).toHaveBeenCalledWith(
        "http://localhost:3000/#/app"
      );
    });

    // test("should load the correct URL in production mode", () => {
    //   vi.mocked(isDev).mockReturnValue(false);
    //   mainWindowMock = createMainWindow(
    //     "/mocked/icon/path"
    //   ) as any as BrowserWindow;
    //   expect(mainWindowMock.loadURL).toHaveBeenCalledWith(
    //     "file:///mocked/path/index.html#/app"
    //   );
    // });
  });

  describe("createSideBarWindow", () => {
    test("should create the sidebar window with correct properties", () => {
      const sideBarWindow = createSideBarWindow(
        mainWindowMock,
        "/mocked/icon/path"
      ) as any as BrowserWindow;

      expect(BrowserWindow).toHaveBeenCalledWith({
        parent: mainWindowMock,
        icon: "/mocked/icon/path",
        width: 450,
        height: 1080,
        transparent: true,
        frame: false,
        show: false,
        x: 1920 - 450,
        y: 0,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        webPreferences: {
          preload: getPreloadPath(),
          contextIsolation: true,
          nodeIntegration: false,
          session: mainWindowMock.webContents.session,
        },
      });

      expect(sideBarWindow.loadURL).toHaveBeenCalledWith(
        "http://localhost:3000/#/overlay"
      );
    });

    test("should not create sidebar window if mainWindow is null", () => {
      expect(
        createSideBarWindow(null as any, "/mocked/icon/path")
      ).toBeUndefined();
    });
  });

  describe("createAudioWindow", () => {
    test("should create the audio window with correct properties", () => {
      const audioWindow = createAudioWindow(
        mainWindowMock
      ) as any as BrowserWindow;

      expect(BrowserWindow).toHaveBeenCalledWith({
        parent: mainWindowMock,
        show: false,
        webPreferences: {
          preload: getPreloadPath(),
          contextIsolation: true,
          nodeIntegration: false,
          session: mainWindowMock.webContents.session,
        },
      });

      expect(audioWindow.loadURL).toHaveBeenCalledWith(
        "http://localhost:3000/#/audio"
      );
    });

    test("should not create audio window if mainWindow is null", () => {
      expect(createAudioWindow(null as any)).toBeUndefined();
    });
  });
});
