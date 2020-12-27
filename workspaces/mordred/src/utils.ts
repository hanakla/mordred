import { useEffect, useRef } from "react";

declare const Deno: any;

export const IS_SERVER =
  typeof window === "undefined" ||
  !!(typeof Deno !== "undefined" && Deno && Deno.version && Deno.version.deno);

export const usePrevious = <T>(value: T) => {
  const prev = useRef({ previous: value });

  useEffect(() => {
    prev.current = { previous: value };
  }, [value]);

  return prev.current;
};

export const createKey = () => Math.random().toString(36).substr(2, 8);
