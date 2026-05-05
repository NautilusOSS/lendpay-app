import { afterEach, describe, expect, it, vi } from "vitest";

describe("gatewayBaseUrl / gatewayUrl / executeUrl", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("uses trimmed VITE_GATEWAY_BASE_URL when set", async () => {
    vi.stubEnv("VITE_GATEWAY_BASE_URL", "https://api.example.com/");
    const { gatewayBaseUrl, gatewayUrl, executeUrl } = await import("./gateway-api");
    expect(gatewayBaseUrl()).toBe("https://api.example.com");
    expect(gatewayUrl("/workflows/x")).toBe("https://api.example.com/workflows/x");
    expect(executeUrl("wf-1")).toBe("https://api.example.com/workflows/wf-1/execute");
  });
});
