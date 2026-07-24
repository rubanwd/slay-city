"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // A new service worker taking control means a newer build just deployed
    // (ours calls skipWaiting + clients.claim on every update). Without this,
    // an already-open PWA can be left rendering a stale bundle against the
    // new worker's cache indefinitely — a one-time reload is what unsticks it.
    let hasReloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hasReloaded) return;
      hasReloaded = true;
      window.location.reload();
    });

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("SW registration failed:", err));
    });
  }, []);

  return null;
}
