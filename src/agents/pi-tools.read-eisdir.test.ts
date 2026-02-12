import { describe, expect, it } from "vitest";
import type { AnyAgentTool } from "./pi-tools.types.js";
import { createOpenClawReadTool } from "./pi-tools.read.js";

describe("createOpenClawReadTool EISDIR handling", () => {
  it("returns a helpful message when read encounters EISDIR", async () => {
    const eisdir = Object.assign(new Error("EISDIR: illegal operation on a directory, read"), {
      code: "EISDIR",
    });
    const fakeBase: AnyAgentTool = {
      name: "read",
      label: "read",
      description: "read",
      parameters: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "file path" },
        },
        required: ["path"],
      },
      execute: async () => {
        throw eisdir;
      },
    };

    const tool = createOpenClawReadTool(fakeBase);
    const result = await tool.execute("call-1", { path: "shared/tasks" }, undefined, undefined);
    const text = (result.content[0] as { type: "text"; text: string }).text;

    expect(text).toContain("is a directory");
    expect(text).toContain("ls");
    expect(text).toContain("shared/tasks");
  });

  it("re-throws non-EISDIR errors", async () => {
    const fakeBase: AnyAgentTool = {
      name: "read",
      label: "read",
      description: "read",
      parameters: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "file path" },
        },
        required: ["path"],
      },
      execute: async () => {
        throw new Error("ENOENT: no such file or directory");
      },
    };

    const tool = createOpenClawReadTool(fakeBase);
    await expect(
      tool.execute("call-2", { path: "nonexistent.txt" }, undefined, undefined),
    ).rejects.toThrow("ENOENT");
  });
});
