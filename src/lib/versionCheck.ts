import { toast } from "sonner";

/**
 * Lightweight cache-bust check.
 *
 * Bump SITE_VERSION on every deploy that ships breaking asset changes
 * (icons, manifests, hashed bundles served from a CDN that may be stale).
 * On load we compare it to the value persisted in localStorage; if they
 * differ, we surface a toast prompting a hard reload, then clear caches
 * and persist the new token so the prompt only fires once per version.
 */
export const SITE_VERSION = "2026-05-02";
const STORAGE_KEY = "lendpay:site-version";

const hardReload = async () => {
  // Best-effort cache eviction so the next load fetches fresh assets.
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore — reload still helps */
  }
  // Cache-busted reload: append a token so intermediaries re-validate.
  const url = new URL(window.location.href);
  url.searchParams.set("_v", SITE_VERSION);
  window.location.replace(url.toString());
};

export function checkSiteVersion() {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    return; // private mode / storage disabled — skip silently
  }

  // First visit on this device — just record the version, no prompt.
  if (!stored) {
    try {
      localStorage.setItem(STORAGE_KEY, SITE_VERSION);
    } catch {
      /* ignore */
    }
    return;
  }

  if (stored === SITE_VERSION) return;

  // Version changed since last visit → prompt a hard reload.
  toast("New version available", {
    description:
      "LendPay was updated since your last visit. Hard-reload to make sure you're on the latest build.",
    duration: 12000,
    action: {
      label: "Hard reload",
      onClick: () => {
        try {
          localStorage.setItem(STORAGE_KEY, SITE_VERSION);
        } catch {
          /* ignore */
        }
        void hardReload();
      },
    },
    onDismiss: () => {
      // If the user dismisses, persist anyway so we don't nag every load.
      try {
        localStorage.setItem(STORAGE_KEY, SITE_VERSION);
      } catch {
        /* ignore */
      }
    },
  });
}
