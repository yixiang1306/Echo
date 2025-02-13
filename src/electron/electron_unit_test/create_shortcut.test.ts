import { test, expect, vi, beforeEach, describe } from "vitest";
import { globalShortcut, BrowserWindow, WebContents } from "electron";
import { registerShortcuts } from "../electron_components/shortcuts.js";

vi.mock("electron", () => {
  return {
    globalShortcut: {
      register: vi.fn(),
    },
  };
});

describe("registerShortcuts", () => {
  let overlayWindow: Partial<BrowserWindow>;
  let audioWindow: Partial<BrowserWindow>;
  let shortcutCallbacks: Record<string, Function>;

  beforeEach(() => {
    vi.clearAllMocks();
    shortcutCallbacks = {}; // Store registered shortcut callbacks

    vi.mocked(globalShortcut.register).mockImplementation((key, callback) => {
      shortcutCallbacks[key] = callback; // Store callback for testing
      return true; // Ensure it returns a boolean (matches Electron API)
    });

    // Mock `BrowserWindow` behaviors
    overlayWindow = {
      isVisible: vi.fn().mockReturnValue(false),
      show: vi.fn(),
      hide: vi.fn(),
    };

    // Properly mock `webContents`
    audioWindow = {
      webContents: { send: vi.fn() } as Partial<WebContents> as WebContents,
    };

    registerShortcuts(
      overlayWindow as BrowserWindow,
      audioWindow as BrowserWindow
    );
  });

  test("should register Alt+V shortcut to toggle overlayWindow visibility", () => {
    // Ensure `globalShortcut.register` was called
    expect(globalShortcut.register).toHaveBeenCalledWith(
      "Alt+V",
      expect.any(Function)
    );

    // Simulate overlay being hidden initially
    (overlayWindow.isVisible as any).mockReturnValue(false);
    shortcutCallbacks["Alt+V"](); // Invoke stored callback
    expect(overlayWindow.show).toHaveBeenCalled(); // Expect show() to be called

    // Simulate overlay being visible
    (overlayWindow.isVisible as any).mockReturnValue(true);
    shortcutCallbacks["Alt+V"]();
    expect(overlayWindow.hide).toHaveBeenCalled(); // Expect hide() to be called
  });

  test("should register Alt+C shortcut to send stop-audio event", () => {
    // Ensure `globalShortcut.register` was called
    expect(globalShortcut.register).toHaveBeenCalledWith(
      "Alt+C",
      expect.any(Function)
    );

    // Simulate triggering the shortcut
    shortcutCallbacks["Alt+C"]();
    expect(audioWindow?.webContents?.send).toHaveBeenCalledWith("stop-audio");
  });
});
