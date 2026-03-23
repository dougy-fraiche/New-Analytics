import { useState, useEffect, useRef } from "react";

const TYPING_SPEED = 45; // ms per character typing in
const DELETING_SPEED = 25; // ms per character deleting
const PAUSE_AFTER_TYPING = 1800; // ms to display the full word
const PAUSE_AFTER_DELETING = 300; // ms before starting next word

/**
 * Returns an animated suffix string that cycles through the provided options
 * with a typing/deleting effect. Combine with a static prefix to form the
 * full placeholder, e.g. `"Ask anything about your " + animatedSuffix`.
 */
export function useTypingPlaceholder(suffixes: string[]): string {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  const charRef = useRef(0);
  const phaseRef = useRef<"typing" | "pausing" | "deleting" | "waiting">("typing");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (suffixes.length === 0) return;

    const tick = () => {
      const current = suffixes[indexRef.current];
      const phase = phaseRef.current;

      if (phase === "typing") {
        charRef.current++;
        setDisplayed(current.slice(0, charRef.current));
        if (charRef.current >= current.length) {
          phaseRef.current = "pausing";
          timerRef.current = setTimeout(tick, PAUSE_AFTER_TYPING);
        } else {
          timerRef.current = setTimeout(tick, TYPING_SPEED);
        }
      } else if (phase === "pausing") {
        phaseRef.current = "deleting";
        timerRef.current = setTimeout(tick, 0);
      } else if (phase === "deleting") {
        charRef.current--;
        setDisplayed(current.slice(0, charRef.current));
        if (charRef.current <= 0) {
          phaseRef.current = "waiting";
          indexRef.current = (indexRef.current + 1) % suffixes.length;
          timerRef.current = setTimeout(tick, PAUSE_AFTER_DELETING);
        } else {
          timerRef.current = setTimeout(tick, DELETING_SPEED);
        }
      } else if (phase === "waiting") {
        phaseRef.current = "typing";
        timerRef.current = setTimeout(tick, 0);
      }
    };

    // Start immediately
    phaseRef.current = "typing";
    charRef.current = 0;
    indexRef.current = 0;
    setDisplayed("");
    timerRef.current = setTimeout(tick, 500); // small initial delay

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [suffixes]);

  return displayed;
}
