import * as React from "react";

const noopSubscribe = () => () => {};

/**
 * true hanya setelah komponen ter-hidrasi di client.
 * Pengganti pola `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), [])`
 * untuk mencegah hydration mismatch tanpa setState dalam effect.
 */
export function useHydrated(): boolean {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
