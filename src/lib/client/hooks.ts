"use client";

import { useSyncExternalStore } from "react";
import { local } from "./nimiq";

const noSubscribe = () => () => {};

/** Browser-only values read without an effect; the server snapshot is the fallback. */
function useClientValue<T>(read: () => T, serverValue: T) {
  return useSyncExternalStore(noSubscribe, read, () => serverValue);
}

export const useOrigin = () => useClientValue(() => window.location.origin, "");
export const useToday = () => useClientValue(() => new Date().toISOString().slice(0, 10), "");
export const useStored = (key: string) => useClientValue(() => local.get(key), null);
