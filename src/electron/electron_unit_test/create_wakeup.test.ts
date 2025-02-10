import { test, expect, vi, beforeEach, describe } from "vitest";

vi.stubGlobal("process", {
  resourcesPath: "/mocked/resources/path",
});

vi.mock("child_process", () => {
  const mockProcess = {
    stdin: { write: vi.fn() },
    kill: vi.fn(),
  };

  return {
    spawn: vi.fn().mockReturnValue(mockProcess),
  };
});

vi.mock("../util.js", () => ({
  isDev: vi.fn(),
}));

vi.mock("electron", () => ({
  app: { getAppPath: vi.fn().mockReturnValue("/mocked/app/path") },
}));

vi.stubGlobal("process", {
  resourcesPath: "/mocked/resources/path",
});

import { createWakeUpProcess } from "../electron_components/wakeUpProcess.js";
import { spawn } from "child_process";
import { isDev } from "../util.js";

describe("createWakeUpProcess", () => {
  let mockProcess: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // ✅ Reinitialize `mockProcess` in `beforeEach` to avoid stale references
    mockProcess = {
      stdin: { write: vi.fn() },
      kill: vi.fn(),
    };

    vi.mocked(spawn).mockReturnValue(mockProcess);
  });

  test("should spawn a Python process with correct paths", () => {
    vi.mocked(isDev).mockReturnValue(true);
    const wakeup = createWakeUpProcess();

    expect(spawn).toHaveBeenCalledWith(
      expect.stringContaining("python.exe"), // Ensure it matches Windows/Linux
      expect.arrayContaining([
        expect.stringContaining("HeyVox.py"), // Allow variations in path
      ]),
      { stdio: ["pipe", "pipe", "pipe"] }
    );
    expect(wakeup.process).toBe(mockProcess);
  });

  test("should send 'pause' command", () => {
    const wakeup = createWakeUpProcess();
    wakeup.pause();

    expect(mockProcess.stdin.write).toHaveBeenCalledWith("pause\n");
  });

  test("should send 'resume' command", () => {
    const wakeup = createWakeUpProcess();
    wakeup.resume();

    expect(mockProcess.stdin.write).toHaveBeenCalledWith("resume\n");
  });

  test("should kill the process", () => {
    const wakeup = createWakeUpProcess();
    wakeup.kill();

    expect(mockProcess.kill).toHaveBeenCalled();
  });
});
