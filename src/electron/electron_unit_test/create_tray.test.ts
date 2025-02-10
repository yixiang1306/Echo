import { expect, Mock, test, vi, beforeEach, describe } from "vitest";

// Mock Electron Modules
vi.mock("electron", () => ({
  Tray: vi.fn().mockImplementation(() => ({
    setToolTip: vi.fn(),
    setContextMenu: vi.fn(),
    on: vi.fn(),
  })),
  app: { quit: vi.fn() },
  Menu: {
    buildFromTemplate: vi.fn(),
  },
}));

// Import necessary modules
import { app, BrowserWindow, Menu, Tray } from "electron";
import { createTray } from "../electron_components/tray.js";

// Mock BrowserWindow
const mainWindow = {
  show: vi.fn(),
} satisfies Partial<BrowserWindow> as any as BrowserWindow;

let trayInstance: Tray;

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

describe("Tray Component", () => {
  test("should create a tray with correct template and functions", () => {
    trayInstance = createTray("/mocked/icon/path", mainWindow);
    const calls = (Menu.buildFromTemplate as any as Mock).mock.calls;
    const args = calls[0] as Parameters<typeof Menu.buildFromTemplate>;
    const template = args[0];

    expect(trayInstance).toBeDefined();
    expect(Menu.buildFromTemplate).toHaveBeenCalled();
    expect(template).toHaveLength(2);

    template[0]?.click?.(null as any, null as any, null as any);
    expect(mainWindow.show).toHaveBeenCalled();

    template[1]?.click?.(null as any, null as any, null as any);
    expect(app.quit).toHaveBeenCalled();
  });

  test("should set tooltip correctly", () => {
    trayInstance = createTray("/mocked/icon/path", mainWindow);
    expect(trayInstance.setToolTip).toHaveBeenCalledWith("Echo App");
  });

  test("should set context menu", () => {
    trayInstance = createTray("/mocked/icon/path", mainWindow);
    expect(trayInstance.setContextMenu).toHaveBeenCalled();
  });
});
