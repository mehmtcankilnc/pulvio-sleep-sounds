import { useEffect, useState } from "react";

// Delays reflecting `value` until it stops changing for `delayMs`. Used to
// debounce search-field filtering so every keystroke doesn't re-filter the
// list — the input itself stays fully responsive (it's a separately
// controlled, undebounced state in the caller); only the derived filtered
// list waits for a pause in typing.
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
