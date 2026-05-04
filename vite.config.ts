import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

/**
 * Single source of truth for the cache-bust token used in icon/manifest
 * `?v=` query strings. Must stay in sync with `SITE_VERSION` exported from
 * `src/lib/versionCheck.ts` — bumping it there and here in the same commit
 * is what triggers favicons, manifests, OG images and the in-app reload
 * toast to all invalidate together.
 */
function readSiteVersion(): string {
  try {
    const src = fs.readFileSync(
      path.resolve(__dirname, "src/lib/versionCheck.ts"),
      "utf8",
    );
    const m = src.match(/SITE_VERSION\s*=\s*["']([^"']+)["']/);
    if (m) return m[1];
  } catch {
    /* fall through */
  }
  return "dev";
}

/**
 * Inject SITE_VERSION into:
 *   - every `__SITE_VERSION__` placeholder in index.html (favicon, OG, etc.)
 *   - the public/site.webmanifest.tmpl template, served as /site.webmanifest
 *
 * This keeps the manifest's icon URLs and the HTML <link> hrefs in lockstep
 * with the JS-side version check, so a single bump invalidates everything.
 */
/**
 * Resolve the canonical absolute site URL used for <link rel="canonical">,
 * og:url, and twitter:url. Set VITE_SITE_URL in your environment (e.g.
 * `https://lendpay.app`) before publishing. Falls back to a sensible default
 * so the tags are always well-formed; no trailing slash, normalized scheme.
 */
function readSiteUrl(): string {
  const raw =
    process.env.VITE_SITE_URL ||
    process.env.SITE_URL ||
    "https://lendpay.app";
  return raw.trim().replace(/\/+$/, "");
}

function siteVersionPlugin(): Plugin {
  const version = readSiteVersion();
  const siteUrl = readSiteUrl();
  const manifestPath = path.resolve(
    __dirname,
    "public/site.webmanifest.tmpl",
  );
  const sitemapPath = path.resolve(__dirname, "public/sitemap.xml.tmpl");
  const robotsPath = path.resolve(__dirname, "public/robots.txt");

  const renderManifest = () =>
    fs.readFileSync(manifestPath, "utf8").replace(/__SITE_VERSION__/g, version);

  const renderSitemap = () =>
    fs
      .readFileSync(sitemapPath, "utf8")
      .replace(/__SITE_URL__/g, siteUrl)
      .replace(/__SITE_VERSION__/g, version);

  // robots.txt is a static asset Vite normally copies verbatim from /public.
  // We rewrite __SITE_URL__ on the way out so the Sitemap: line is absolute.
  const renderRobots = () =>
    fs.readFileSync(robotsPath, "utf8").replace(/__SITE_URL__/g, siteUrl);

  return {
    name: "lendpay-site-version",
    transformIndexHtml(html) {
      return html
        .replace(/__SITE_VERSION__/g, version)
        .replace(/__SITE_URL__/g, siteUrl);
    },
    configureServer(server) {
      // Serve the resolved manifest, sitemap, and robots in dev so they work
      // without needing a build step.
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();
        const url = req.url.split("?")[0];
        if (url === "/site.webmanifest") {
          res.setHeader("Content-Type", "application/manifest+json");
          res.setHeader("Cache-Control", "no-cache, must-revalidate");
          return res.end(renderManifest());
        }
        if (url === "/sitemap.xml") {
          res.setHeader("Content-Type", "application/xml; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache, must-revalidate");
          return res.end(renderSitemap());
        }
        if (url === "/robots.txt") {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache, must-revalidate");
          return res.end(renderRobots());
        }
        return next();
      });
    },
    generateBundle() {
      // Emit the resolved manifest, sitemap, and robots into the build output.
      // robots.txt is also copied as-is from /public by Vite — emitting it
      // here overrides that copy with the __SITE_URL__-substituted version.
      this.emitFile({
        type: "asset",
        fileName: "site.webmanifest",
        source: renderManifest(),
      });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: renderSitemap(),
      });
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: renderRobots(),
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    /** Same-origin proxy for x402 retries on `POST /workflows/.../execute` (lendpay-backend). */
    proxy: {
      "/gateway": {
        target: process.env.VITE_GATEWAY_PROXY_TARGET?.trim() || "http://127.0.0.1:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gateway/, "") || "/",
      },
    },
  },
  plugins: [
    react(),
    siteVersionPlugin(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
