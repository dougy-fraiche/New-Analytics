import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import {
  PAGE_ENTER_ANIMATE,
  PAGE_ENTER_INITIAL,
  PAGE_EXIT,
  PAGE_TRANSITION,
  REDUCED_MOTION_TRANSITION,
} from "./page-transition-presets";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  skipAnimation?: boolean;
}

export function PageTransition({ children, className, skipAnimation = false }: PageTransitionProps) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = !skipAnimation && !reduceMotion;

  return (
    <motion.div
      initial={shouldAnimate ? PAGE_ENTER_INITIAL : false}
      animate={PAGE_ENTER_ANIMATE}
      exit={shouldAnimate ? PAGE_EXIT : { opacity: 1 }}
      transition={shouldAnimate ? PAGE_TRANSITION : REDUCED_MOTION_TRANSITION}
      style={{ willChange: "opacity, transform" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
