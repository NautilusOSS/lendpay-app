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
function siteVersionPlugin(): Plugin {
  const version = readSiteVersion();
  const manifestPath = path.resolve(
    __dirname,
    "public/site.webmanifest.tmpl",
  );

  const renderManifest = () =>
    fs.readFileSync(manifestPath, "utf8").replace(/__SITE_VERSION__/g, version);

  return {
    name: "lendpay-site-version",
    transformIndexHtml(html) {
      return html.replace(/__SITE_VERSION__/g, version);
    },
    configureServer(server) {
      // Serve the resolved manifest in dev so /site.webmanifest works without
      // needing a build step.
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();
        const url = req.url.split("?")[0];
        if (url !== "/site.webmanifest") return next();
        res.setHeader("Content-Type", "application/manifest+json");
        res.setHeader("Cache-Control", "no-cache, must-revalidate");
        res.end(renderManifest());
      });
    },
    generateBundle() {
      // Emit the resolved manifest into the build output.
      this.emitFile({
        type: "asset",
        fileName: "site.webmanifest",
        source: renderManifest(),
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
