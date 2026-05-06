# LendPay app — environment variables

Variables are read at **build time** for anything exposed to the browser (`VITE_*` via `import.meta.env`). Set them in `.env`, `.env.local`, or your CI/CD environment before `vite build` or `vite dev`.

## Client bundle (`import.meta.env`)

| Variable | Purpose |
| -------- | ------- |
| `VITE_GATEWAY_BASE_URL` | Base URL of the workflow gateway (no trailing slash). If unset in **development**, the app uses same-origin `/gateway` (Vite proxy). If unset in **production**, it falls back to `http://localhost:3001`. |
| `VITE_GATEWAY_API_TOKEN` | Optional default **Bearer** token sent with gateway `execute` requests (trimmed). Empty string if unset. |
| `VITE_GATEWAY_PAY_USD` | Gateway fee shown in the trace step UI, as a decimal USD string. Parsed as a float and clamped to **0.01–1.00**; invalid values default to **0.10**. |
| `VITE_WC_PROJECT_ID` | WalletConnect Cloud **project id** (publishable). Used by RainbowKit/wagmi on Base. If unset, the built-in placeholder in `src/lib/wagmi.ts` must be replaced for wallet connect to work. |
| `VITE_BASE_MAINNET_RPC_URL` | Optional Base **mainnet** JSON-RPC URL passed into the x402 EVM client (`ExactEvmScheme`). Improves reliability if the default public RPC is rate-limited. |
| `VITE_LOCAL_OPEN_AGENT_X402_PAY_TO` | Local dev: when the gateway returns a payment-required style **400** body without full x402 v2 metadata, the client may synthesize a v402 challenge; this is the fallback **0x** payee if the body omits `payTo`. |
| `VITE_LOCAL_OPEN_AGENT_X402_AMOUNT` | Same synthetic path: USDC amount in **base units** (string). Defaults to `1000000` if unset. |

Vite also sets `import.meta.env.DEV` / `PROD` / `MODE`; you do not configure those yourself.

## Vite config only (`process.env` when Node loads `vite.config.ts`)

These affect **dev server** or **HTML/manifest SEO** substitution, not `import.meta.env` in app code (unless you also prefix with `VITE_` and read them in source — the app does not for these).

| Variable | Purpose |
| -------- | ------- |
| `VITE_SITE_URL` | Canonical site URL (no trailing slash) for `__SITE_URL__` in `index.html`, `sitemap.xml`, and `robots.txt`. Default: `https://lendpay.app`. |
| `SITE_URL` | Alternate name for the same canonical URL if `VITE_SITE_URL` is unset. |
| `VITE_GATEWAY_PROXY_TARGET` | Dev-only: upstream for the `/gateway` proxy. Default: `http://127.0.0.1:3001`. |

## Quick local setup

1. Copy values into `.env` or `.env.local` at the repo root (Vite loads them automatically).
2. For local backend on port 3001, you usually **omit** `VITE_GATEWAY_BASE_URL` in dev so requests go to `/gateway` and hit the proxy.
3. Set `VITE_WC_PROJECT_ID` from [WalletConnect Cloud](https://cloud.walletconnect.com/) for real wallet sessions.
