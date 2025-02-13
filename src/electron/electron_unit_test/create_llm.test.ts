import { test, expect, vi, beforeEach, describe } from "vitest";

vi.stubGlobal("process", {
  resourcesPath: "/mocked/resources/path",
});

vi.mock("child_process", () => {
  const mockProcess = {
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

import { spawn } from "child_process";
import { isDev } from "../util.js";
import { createLLMProcess } from "../electron_components/llmProcess.js";

describe("createLLMProcess", () => {
  let mockProcess: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // ✅ Reinitialize `mockProcess` in `beforeEach` to avoid stale references
    mockProcess = {
      kill: vi.fn(),
    };

    vi.mocked(spawn).mockReturnValue(mockProcess);
  });

  test("should spawn a Python process with correct paths", () => {
    vi.mocked(isDev).mockReturnValue(true);
    const LLM = createLLMProcess();

    expect(spawn).toHaveBeenCalledWith(
      expect.stringContaining("python.exe"), // Ensure it matches Windows/Linux
      expect.arrayContaining([
        expect.stringContaining("LLM.py"), // Allow variations in path
      ])
    );
    expect(LLM.process).toBe(mockProcess);
  });

  test("should kill the process", () => {
    const LLM = createLLMProcess();
    LLM.kill();

    expect(mockProcess.kill).toHaveBeenCalled();
  });
});
