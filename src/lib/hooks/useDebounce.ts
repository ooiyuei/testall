"use client";

import { useEffect, useState } from "react";

/**
 * 値を delay ミリ秒遅延させて返すフック。
 * 検索 input の API 呼び出し制御などに使う。
 *
 * 使い方:
 *   const debounced = useDebounce(query, 300);
 *   useEffect(() => { fetchResults(debounced); }, [debounced]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
