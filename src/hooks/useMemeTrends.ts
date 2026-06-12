import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BUNDLED_MANIFEST,
  activeTrends,
  featuredMemeTrends,
  isNewerManifest,
  type MemeTrendsManifest,
} from "@/data/memeTrends";

const CACHE_KEY = "mnemo_meme_trends_manifest_v1";

function readCachedManifest(): MemeTrendsManifest | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MemeTrendsManifest;
  } catch {
    return null;
  }
}

function writeCachedManifest(manifest: MemeTrendsManifest) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(manifest));
  } catch {
    /* ignore quota */
  }
}

function pickInitialManifest(): MemeTrendsManifest {
  const cached = readCachedManifest();
  if (cached && isNewerManifest(cached, BUNDLED_MANIFEST)) {
    return cached;
  }
  return BUNDLED_MANIFEST;
}

export function useMemeTrends() {
  const [manifest, setManifest] = useState<MemeTrendsManifest>(pickInitialManifest);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const trends = useMemo(() => activeTrends(manifest), [manifest]);
  const featured = useMemo(() => featuredMemeTrends(manifest), [manifest]);

  const refresh = useCallback(async (force = false) => {
    if (isRefreshing && !force) return manifest;
    setIsRefreshing(true);
    try {
      const res = await fetch(`/meme-trends.json?ts=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return manifest;
      const remote = (await res.json()) as MemeTrendsManifest;
      if (isNewerManifest(remote, manifest) || force) {
        setManifest(remote);
        writeCachedManifest(remote);
        return remote;
      }
      return manifest;
    } catch {
      return manifest;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, manifest]);

  useEffect(() => {
    void refresh(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    manifest,
    trends,
    featured,
    refresh,
    isRefreshing,
    updatedLabel: new Date(manifest.updatedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
  };
}
