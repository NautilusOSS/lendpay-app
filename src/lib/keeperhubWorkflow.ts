/**
 * Paid intake HTTP targets (x402 POST …/call).
 * Dev uses same-origin `/keeperhub` → Vite proxy to avoid CORS on payment retries.
 */

const callPath = (slug: string) =>
  `/api/mcp/workflows/${encodeURIComponent(slug)}/call`;

export const KH_PROD_ORIGIN = "https://app.keeperhub.com" as const;

/**
 * x402 `POST` URL for a given intake slug.
 * `VITE_X402_TEST_URL` (optional): origin or full URL base to merge with the call path.
 */
export function khWorkflowCallUrl(slug: string): string {
  const path = callPath(slug);
  const fromEnv = import.meta.env.VITE_X402_TEST_URL as string | undefined;
  if (fromEnv?.trim()) {
    try {
      const u = new URL(fromEnv.trim());
      u.pathname = path;
      return u.toString();
    } catch {
      if (/\/workflows\//.test(fromEnv)) {
        return fromEnv.replace(/\/workflows\/[^/]+\/call/, `/workflows/${encodeURIComponent(slug)}/call`);
      }
    }
  }
  if (import.meta.env.DEV) {
    return `${globalThis.location.origin}/keeperhub${path}`;
  }
  return `${KH_PROD_ORIGIN}${path}`;
}

export function khPublicWorkflowCallUrl(slug: string): string {
  return `${KH_PROD_ORIGIN}${callPath(slug)}`;
}
