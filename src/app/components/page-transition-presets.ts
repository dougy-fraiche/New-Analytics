import type { Transition } from "motion/react";

export const EXPLORE_STYLE_EASE: number[] = [0.4, 0, 0.2, 1];

export const PAGE_ENTER_INITIAL = {
  opacity: 0,
  y: 10,
  scale: 0.985,
};

export const PAGE_ENTER_ANIMATE = {
  opacity: 1,
  y: 0,
  scale: 1,
};

export const PAGE_EXIT = {
  opacity: 0,
  y: -18,
  scale: 0.985,
};

export const PAGE_TRANSITION: Transition = {
  duration: 0.35,
  ease: EXPLORE_STYLE_EASE,
};

export const REDUCED_MOTION_TRANSITION: Transition = {
  duration: 0.15,
  ease: "linear",
};
