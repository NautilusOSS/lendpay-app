/**
 * Paid workflow gateway HTTP API — same contract as openagent-demo-1 `src/lib/gateway-api.ts`
 * and lendpay-backend `POST /workflows/:workflowId/execute`.
 */

/**
 * DorkFi ids on the gateway HTTP body under `triggerData`.
 * The gateway merges these with settlement fields into the full KeeperHub `triggerData`.
 */
export type DorkfiRepayTriggerData = {
  /** Market (inner) app id (`contractId` in DorkFi config). */
  marketAppId: number;
  /** Borrow receipt ASA id (nToken), not the underlying USDC id. */
  assetId: number;
  /** Pool application id. */
  poolId: number;
  /** Underlying asset ASA (e.g. USDC on Algorand). */
  underlyingAssetId?: number;
};

export type ExecuteRequestBody = {
  chain: string;
  protocol: string;
  action: string;
  targetAddress: string;
  benefactorAddress: string;
  asset: string;
  amount: string;
  /** Required: pool / market / token ids; gateway fills `txid`, timestamps, addresses, paid `amount`, etc. */
  triggerData: DorkfiRepayTriggerData;
};

export type ExecuteGatewayOptions = {
  workflowId: string;
  body: ExecuteRequestBody;
  bearerToken: string;
  xPayment?: string;
};

function stripTrailingSlash(u: string): string {
  return u.replace(/\/+$/, "");
}

export function gatewayBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_GATEWAY_BASE_URL as string | undefined;
  if (fromEnv?.trim()) return stripTrailingSlash(fromEnv.trim());
  if (import.meta.env.DEV) {
    return `${globalThis.location.origin}/gateway`;
  }
  return "http://localhost:3001";
}

export function gatewayUrl(path: string): string {
  const base = gatewayBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function executeUrl(workflowId: string): string {
  const id = encodeURIComponent(workflowId);
  return gatewayUrl(`/workflows/${id}/execute`);
}

/** POST execute using a paid `fetch` (e.g. `createX402Fetch` from `@/lib/x402`). */
export async function executeGatewayWorkflowWithFetch(
  fetchImpl: typeof fetch,
  opts: Pick<ExecuteGatewayOptions, "workflowId" | "body" | "bearerToken"> & { signal?: AbortSignal },
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = opts.bearerToken.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetchImpl(executeUrl(opts.workflowId), {
    method: "POST",
    headers,
    body: JSON.stringify(opts.body),
    signal: opts.signal,
  });
}

export const DORKFI_REPAY_WORKFLOW_ID = "dorkfi-repay" as const;
