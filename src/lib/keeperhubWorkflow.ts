/**
 * Workflow gateway `POST …/workflows/{slug}/execute` (x402, query-string inputs).
 * Dev uses same-origin `/gateway` → Vite proxy so payment retries stay same-origin (CORS).
 */

const executePath = (slug: string) =>
  `/workflows/${encodeURIComponent(slug)}/execute`;

/** Keys sorted alphabetically — match gateway `resource.url` canonical ordering for x402 verification. */
export const PAID_BETA_SIGNUP_QUERY_KEYS = [
  "algorandAddress",
  "amount",
  "baseAddress",
  "discord",
  "email",
  "telegram",
] as const;

export type PaidBetaSignupQueryKey = (typeof PAID_BETA_SIGNUP_QUERY_KEYS)[number];

export type PaidBetaSignupFields = Record<PaidBetaSignupQueryKey, string>;

export function paidBetaSignupSearchParams(fields: PaidBetaSignupFields): URLSearchParams {
  const p = new URLSearchParams();
  for (const k of PAID_BETA_SIGNUP_QUERY_KEYS) {
    const v = typeof fields[k] === "string" ? fields[k].trim() : "";
    if (!v) {
      throw new Error(`${k} must be provided in request`);
    }
    p.set(k, v);
  }
  return p;
}

/**
 * Base URL for the workflow gateway (no trailing slash).
 * `VITE_GATEWAY_BASE_URL` overrides; in dev defaults to same-origin `/gateway`.
 */
export function gatewayBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_GATEWAY_BASE_URL as string | undefined)?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }
  if (import.meta.env.DEV) {
    return `${globalThis.location.origin}/gateway`.replace(/\/+$/, "");
  }
  return "http://127.0.0.1:3001";
}

/**
 * Full `POST` URL including sorted query string for paid beta signup workflow.
 * `VITE_X402_TEST_URL` (optional): origin or full URL base to merge with the execute path.
 */
export function gatewayPaidBetaSignupExecuteUrl(
  slug: string,
  fields: PaidBetaSignupFields,
): string {
  const path = executePath(slug);
  const search = paidBetaSignupSearchParams(fields).toString();
  const pathWithQuery = search ? `${path}?${search}` : path;

  const fromEnv = import.meta.env.VITE_X402_TEST_URL as string | undefined;
  if (fromEnv?.trim()) {
    try {
      const u = new URL(fromEnv.trim());
      u.pathname = path;
      u.search = search;
      return u.toString();
    } catch {
      /* fall through */
    }
  }

  return `${gatewayBaseUrl()}${pathWithQuery}`;
}

/** Same path without query — for safe display (e.g. standalone intake technical line). */
export function gatewayPaidBetaSignupExecuteBaseDisplayUrl(slug: string): string {
  const path = executePath(slug);
  const fromEnv = import.meta.env.VITE_X402_TEST_URL as string | undefined;
  if (fromEnv?.trim()) {
    try {
      const u = new URL(fromEnv.trim());
      u.pathname = path;
      u.search = "";
      return u.toString();
    } catch {
      /* fall through */
    }
  }
  return `${gatewayBaseUrl()}${path}`;
}
