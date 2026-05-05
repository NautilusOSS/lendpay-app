# LendPay App

Browser client for **LendPay**: a guided flow to **repay DeFi loans with USDC on Base**, with settlement and protocol work driven by **KeeperHub** workflows (see the [ETHGlobal Open Agents 2026 umbrella README](https://github.com/temptemp3/ETHGlobal2026OpenAgent/blob/main/README.md) and [lendpay-index](https://github.com/NautilusOSS/lendpay-index) for the full repo map).

This repository is the **Vite + React** web app only (not the backend or gateway services).

## Stack

- **Vite 5**, **React 18**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**
- **wagmi** + **viem** + **RainbowKit** on **Base** mainnet
- **x402** (`@x402/fetch`, `@x402/core`, `@x402/evm`) for paid HTTP calls where the API returns payment challenges
- **Vitest** + Testing Library for unit tests

## Prerequisites

- **Node.js** 20+ (or **Bun** — lockfiles for both exist)
- A **WalletConnect Cloud** [project ID](https://cloud.walletconnect.com/) for production builds (see `VITE_WC_PROJECT_ID` below)

## Quick start

```bash
npm install
npm run dev
```

The dev server listens on **http://localhost:8080** (see `vite.config.ts`).

- **Lint:** `npm run lint`
- **Unit tests:** `npm run test`
- **Production build:** `npm run build` then `npm run preview`

## Environment variables

Copy `.env.example` to `.env` and adjust. Vite only exposes variables prefixed with **`VITE_`**.

| Variable | When needed | Purpose |
|----------|----------------|--------|
| `VITE_SITE_URL` | Production builds | Canonical origin for `<link rel="canonical">`, Open Graph / Twitter URLs, `sitemap.xml`, and `robots.txt` (default `https://lendpay.app` in `vite.config.ts`). |
| `VITE_WC_PROJECT_ID` | **Production** | WalletConnect Cloud project id. Without it, the fallback in `src/lib/wagmi.ts` must be replaced for wallets to connect reliably. |
| `VITE_BASE_MAINNET_RPC_URL` | Optional | Custom Base RPC for x402 / viem signing path (`src/lib/x402.ts`). |
| `VITE_GATEWAY_BASE_URL` | Dev / prod | Base URL for **lendpay-backend** gateway HTTP API. **In dev**, leave unset to use same-origin **`/gateway`**, which Vite proxies (avoids CORS). **In prod**, set to your real gateway origin if it is not same-site. |
| `VITE_GATEWAY_PROXY_TARGET` | Local dev only | Upstream for the Vite dev proxy (`/gateway` → this host, default `http://127.0.0.1:3001`). |
| `VITE_GATEWAY_PAY_USD` | Optional | Used in the execute step UI (`Step6Trace`) to clamp display of gateway fee. |
| `VITE_GATEWAY_API_TOKEN` | When gateway requires auth | Bearer token for `POST /workflows/:id/execute` (`gateway-api.ts`). |
| `VITE_LOCAL_OPEN_AGENT_X402_PAY_TO` | Local x402 experiments | Synthetic `402` helper: `payTo` address when gateway returns a payment-required style body without full x402 v2 metadata (`src/lib/x402.ts`). |
| `VITE_LOCAL_OPEN_AGENT_X402_AMOUNT` | Same | Default atomic USDC amount for that synthetic path. |

## Local development: gateway and CORS

Paid `fetch` (x402) and workflow execution talk to the **gateway** (same contract as **lendpay-backend** — `POST /workflows/:workflowId/execute`).

- In **`npm run dev`**, `gatewayBaseUrl()` defaults to **`${origin}/gateway`**, and Vite proxies `/gateway` to `VITE_GATEWAY_PROXY_TARGET` (default `http://127.0.0.1:3001`). Run **lendpay-backend** (or your gateway) locally on that port, or override the target.
- If you point `VITE_GATEWAY_BASE_URL` at a **different origin** without a browser proxy, you may hit **CORS** errors; `formatX402ClientError` in `src/lib/x402.ts` mentions this explicitly.

## User flow (high level)

The home page (`src/pages/Index.tsx`) runs a **six-step** wizard:

1. **Address** — repayment target on Algorand  
2. **Position** — DorkFi borrow snapshot (via `src/lib/dorkfiApi.ts` → `https://dorkfi-api.nautilus.sh`)  
3. **Amount** — repayment sizing  
4. **Connect** — Base wallet (RainbowKit)  
5. **Confirm** — review  
6. **Execute** — x402-paid gateway call and trace / receipt UX  

Copy and marketing strings in the UI describe **Pay on Base · Execute on Algorand** and **KeeperHub**.

## Cache busting and deploys

- **`SITE_VERSION`** in `src/lib/versionCheck.ts` is compared on load to `localStorage` so users get a **reload prompt** after deploys that change hashed assets.
- **`vite.config.ts`** reads the same token for favicon / PWA / OG `?v=` query strings via the `lendpay-site-version` plugin — **bump both together** when invalidating static branding.

## Repository layout

| Path | Role |
|------|------|
| `src/pages/Index.tsx` | Step machine and layout |
| `src/components/lendpay/` | LendPay-specific UI (header, steps, wallet chrome) |
| `src/lib/x402.ts` | x402 client + fetch middleware |
| `src/lib/gateway-api.ts` | Gateway URL helpers and execute POST |
| `src/lib/dorkfiApi.ts` | DorkFi user / market reads |
| `src/lib/wagmi.ts` | Wagmi + RainbowKit config (Base only) |

## Related repositories

- [lendpay-backend](https://github.com/NautilusOSS/lendpay-backend) — API and workflow execution  
- [lendpay-gateway-algorand-dorkfi](https://github.com/NautilusOSS/lendpay-gateway-algorand-dorkfi) — Algorand / DorkFi repayment gateway  
- [lendpay-index](https://github.com/NautilusOSS/lendpay-index) — canonical list of LendPay repos  
- [lendpay-timeline](https://github.com/NautilusOSS/lendpay-timeline) — dated project history  

## License

License file not yet added to this repository; confirm with maintainers before redistributing.
