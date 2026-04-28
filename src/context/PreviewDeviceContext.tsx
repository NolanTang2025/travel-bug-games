import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PreviewMode = "full" | "mobile-frame";

type PreviewDeviceContextValue = {
  mode: PreviewMode;
  setMode: (m: PreviewMode) => void;
};

const PreviewDeviceContext = createContext<PreviewDeviceContextValue | null>(null);

export function PreviewDeviceProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<PreviewMode>("full");

  const setMode = useCallback((m: PreviewMode) => {
    setModeState(m);
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <PreviewDeviceContext.Provider value={value}>{children}</PreviewDeviceContext.Provider>
  );
}

export function usePreviewDevice() {
  const ctx = useContext(PreviewDeviceContext);
  if (!ctx) throw new Error("usePreviewDevice must be used within PreviewDeviceProvider");
  return ctx;
}
