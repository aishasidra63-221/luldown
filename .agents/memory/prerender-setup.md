---
name: Static prerendering setup
description: How the Vite SSR prerender works for tikdown, including the wouter useSyncExternalStore fix.
---

## What was built
- `artifacts/tikdown/src/entry-server.tsx` — SSR render entry (not in client bundle)
- `artifacts/tikdown/prerender.mts` — post-build script that renders 174 routes and writes `dist/public/<route>/index.html`
- `pnpm --filter @workspace/tikdown run prerender` — runs `vite build && tsx prerender.mts`

## Critical fix: wouter + React 19 SSR
Wouter 3.10's `memoryLocation` hook calls `useSyncExternalStore(subscribe, getSnapshot)` without the required `getServerSnapshot` third argument. React 18/19 throws during `renderToString` when this is missing.

**Fix:** Don't use `wouter/memory-location`. Instead, define a custom `createSSRLocationHook(path)` in `entry-server.tsx` that passes all three arguments to `useSyncExternalStore` directly, with `getServerSnapshot = () => path`.

**Why:** `getServerSnapshot` is mandatory for React 18+ server rendering. The memory-location implementation is fine for client-side but missing this for SSR.

**How to apply:** Any time wouter is used with SSR, always use the custom hook in `entry-server.tsx` rather than wouter's built-in `memoryLocation`.

## App.tsx hook prop
`App` accepts an optional `ssrHook` prop (`() => [string, (to: string) => void]`) passed to `WouterRouter`'s `hook` prop. This is `undefined` in normal client usage (browser default behavior) and set to the custom SSR hook during prerendering.

## Route count
174 routes: 28 English pages + 13 blog posts + 19 lang homepages + 19×6 lang tool pages. All rendered successfully (0 failures).

## Static route head metadata
Route-level titles, descriptions, canonicals, hreflang tags, language direction, Open Graph values, and JSON-LD are injected by the prerender script using `src/lib/route-seo.ts`.

**Why:** React `useEffect` SEO hooks do not run during server rendering, so rendering only the app body would leave every generated HTML file with the homepage `<head>`.

**How to apply:** When adding a sitemap/prerendered route, include it in the route SEO resolver and verify its generated `dist/public/<route>/index.html` has its own canonical and metadata.

## Suspense and browser-only state
The SSR entry uses `renderToPipeableStream` and waits for `onAllReady`; route pages are lazy-loaded and `renderToString` leaves only a Suspense abort marker instead of page content. Components rendered during SSR must guard `window`, `localStorage`, and `sessionStorage` access.

**Why:** Static SEO requires the complete page body, including H1s, not just the route head. Browser-only storage access can abort an otherwise valid stream.

**How to apply:** Re-run the full prerender after changing route components and audit both H1 presence and Suspense abort markers.
