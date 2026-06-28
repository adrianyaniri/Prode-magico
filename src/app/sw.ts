import { defaultCache } from "@serwist/next/worker";
import { Serwist, NetworkOnly, type PrecacheEntry, type RuntimeCaching } from "serwist";
import type { SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: Array<PrecacheEntry>;
  }
}

declare const self: WorkerGlobalScope & SerwistGlobalConfig;

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ request, url }) => {
      if (url.searchParams.has("_rsc") || request.headers.get("RSC") === "1") return true;
      if (url.hostname.includes("supabase.co") || url.pathname.startsWith("/api/")) return true;
      return false;
    },
    handler: new NetworkOnly(),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();
