/**
 * SSR entry point — used by prerender.mts to generate static HTML snapshots.
 * Loaded via Vite's ssrLoadModule() at prerender time, never in the client bundle.
 */
import { renderToString } from "react-dom/server";
import { useSyncExternalStore } from "react";
import App from "./App";

/**
 * Wouter's built-in memoryLocation does NOT pass `getServerSnapshot` to
 * useSyncExternalStore, which React 18/19 requires during server rendering.
 * We build our own minimal SSR-safe hook that always provides it.
 */
function createSSRLocationHook(path: string) {
  const noop = () => () => {};          // subscribe: never fires on server
  const snap = () => path;              // getSnapshot
  const serverSnap = () => path;        // getServerSnapshot ← the missing piece

  const hook = (): [string, (to: string) => void] => [
    useSyncExternalStore(noop, snap, serverSnap),
    () => {},   // navigate is a no-op during SSR
  ];

  // Wouter reads searchHook from the location hook for query-string support.
  (hook as any).searchHook = (): string =>
    useSyncExternalStore(noop, () => "", () => "");

  return hook;
}

export function render(url: string): string {
  const ssrHook = createSSRLocationHook(url) as () => [string, (to: string) => void];
  return renderToString(<App ssrHook={ssrHook} />);
}
