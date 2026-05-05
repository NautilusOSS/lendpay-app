import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchMirrorPaymentSignatureToXPayment,
  fetchNormalizePaymentRequired400Response,
  formatX402ClientError,
  tryDecodePaymentFromResponse,
} from "./x402";

describe("fetchNormalizePaymentRequired400Response", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("passes through non-400 responses unchanged", async () => {
    const inner = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = fetchNormalizePaymentRequired400Response(inner);
    const res = await wrapped("https://example.com/r");
    expect(res.status).toBe(200);
    expect(inner).toHaveBeenCalledOnce();
  });

  it("passes through 400 that is not a payment-required style body", async () => {
    const inner = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ error: "bad request" }), { status: 400 }));
    const wrapped = fetchNormalizePaymentRequired400Response(inner);
    const res = await wrapped("https://example.com/r");
    expect(res.status).toBe(400);
  });

  it("keeps 400 when body is PAYMENT_REQUIRED-shaped but cannot become x402 (no v1/v2 payload, no payTo for synthetic)", async () => {
    const inner = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ code: "PAYMENT_REQUIRED" }), { status: 400 }));
    const wrapped = fetchNormalizePaymentRequired400Response(inner);
    const res = await wrapped("https://example.com/r");
    expect(res.status).toBe(400);
  });

  it("promotes 400 to 402 for x402Version 1 when body is payment-required shaped", async () => {
    const inner = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ x402Version: 1, code: "PAYMENT_REQUIRED" }), { status: 400 }),
      );
    const wrapped = fetchNormalizePaymentRequired400Response(inner);
    const res = await wrapped("https://example.com/r");
    expect(res.status).toBe(402);
  });

  it("synthesizes v2 PAYMENT-REQUIRED when gateway returns payTo without full x402 metadata", async () => {
    const payTo = "0x1111111111111111111111111111111111111111";
    const inner = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "PAYMENT_REQUIRED",
          payTo,
          amount: "2000000",
        }),
        { status: 400 },
      ),
    );
    const wrapped = fetchNormalizePaymentRequired400Response(inner);
    const res = await wrapped("https://example.com/resource");
    expect(res.status).toBe(402);
    expect(res.headers.get("PAYMENT-REQUIRED")).toBeTruthy();
  });
});

describe("fetchMirrorPaymentSignatureToXPayment", () => {
  it("copies PAYMENT-SIGNATURE to X-PAYMENT on Request input", async () => {
    const inner = vi.fn().mockImplementation((req: Request) => Promise.resolve(new Response(req.headers.get("X-PAYMENT") ?? "")));
    const wrapped = fetchMirrorPaymentSignatureToXPayment(inner as typeof fetch);
    const req = new Request("https://x.test/a", {
      headers: { "PAYMENT-SIGNATURE": "sig-abc" },
    });
    const res = await wrapped(req);
    expect(await res.text()).toBe("sig-abc");
  });

  it("does not overwrite existing X-PAYMENT", async () => {
    const inner = vi.fn().mockImplementation((req: Request) => Promise.resolve(new Response(req.headers.get("X-PAYMENT") ?? "")));
    const wrapped = fetchMirrorPaymentSignatureToXPayment(inner as typeof fetch);
    const req = new Request("https://x.test/b", {
      headers: { "PAYMENT-SIGNATURE": "sig", "X-PAYMENT": "already" },
    });
    const res = await wrapped(req);
    expect(await res.text()).toBe("already");
    expect(inner).toHaveBeenCalledOnce();
  });
});

describe("tryDecodePaymentFromResponse", () => {
  it("returns null when PAYMENT-RESPONSE header is absent", () => {
    expect(tryDecodePaymentFromResponse(new Response("", { status: 200 }))).toBeNull();
  });
});

describe("formatX402ClientError", () => {
  it("appends CORS guidance for typical browser network failures", () => {
    const msg = formatX402ClientError(new TypeError("Failed to fetch"));
    expect(msg).toContain("CORS");
    expect(msg).toContain("/gateway");
  });

  it("returns the underlying message for unrelated errors", () => {
    expect(formatX402ClientError(new Error("something else"))).toBe("something else");
  });
});
