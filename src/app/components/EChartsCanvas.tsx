"use client";

import * as echarts from "echarts";
import "echarts/theme/dark";
import "echarts/theme/v5";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "./ui/utils";

type EChartsOption = echarts.EChartsCoreOption;

function normalizeCssColor(input: string, el: HTMLElement): string {
  // ECharts' color parser can be stricter than the browser (e.g. modern space-separated hsl()).
  // Convert anything the browser understands into computed rgb/rgba.
  const doc = el.ownerDocument;
  const tmp = doc.createElement("span");
  tmp.style.position = "absolute";
  tmp.style.left = "-99999px";
  tmp.style.top = "-99999px";
  tmp.style.color = input;
  // Make sure the element is in the DOM for computed styles.
  el.appendChild(tmp);
  const out = getComputedStyle(tmp).color;
  tmp.remove();
  // If the browser couldn't parse it, it returns an empty string.
  return out || input;
}

function resolveCssVarsInString(input: string, el: HTMLElement): string {
  if (!input.includes("var(")) return input;

  const withVars = input.replace(
    /var\((--[A-Za-z0-9-_]+)(?:\s*,\s*([^)]+))?\)/g,
    (_match, varName: string, fallback: string | undefined) => {
      const computed = getComputedStyle(el).getPropertyValue(varName).trim();
      if (computed) return computed;
      return fallback ? String(fallback).trim() : "";
    },
  );
  // After resolving vars, normalize CSS color syntax (esp. `hsl(0 0% 100%)`).
  if (withVars.includes("hsl(") || withVars.includes("hsla(")) {
    return normalizeCssColor(withVars, el);
  }
  return withVars;
}

function resolveCssVars<T>(input: T, el: HTMLElement): T {
  // Only resolve plain objects/arrays/strings; keep functions as-is.
  if (typeof input === "string") {
    return resolveCssVarsInString(input, el) as T;
  }
  if (Array.isArray(input)) {
    return input.map((v) => resolveCssVars(v, el)) as T;
  }
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = resolveCssVars(v, el);
    }
    return out as T;
  }
  return input;
}

export type ChartDataSelectInfo = {
  name?: string;
  value?: unknown;
  seriesName?: string;
  clientX?: number;
  clientY?: number;
};

export function EChartsCanvas({
  option,
  className,
  onDataSelect,
}: {
  option: EChartsOption;
  className?: string;
  /** Called when user clicks a data point (bar, pie slice, line point, etc.). */
  onDataSelect?: (info: ChartDataSelectInfo) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const compute = () => setIsDark(root.classList.contains("dark"));
    compute();

    const mo = new MutationObserver(() => compute());
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  const theme = useMemo(() => (isDark ? "dark" : "v5"), [isDark]);

  const optionForTheme = useMemo((): EChartsOption => {
    // The built-in dark theme sets a dark background that clashes with our dark cards.
    // Force transparent chart background in dark mode.
    if (!isDark) return option;
    return { backgroundColor: "transparent", ...option };
  }, [isDark, option]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = echarts.init(el, theme, { renderer: "canvas" });
    chart.setOption(resolveCssVars(optionForTheme, el), { notMerge: true });

    const handleClick = (params: any) => {
      const evt = params?.event?.event;
      const clientX = typeof evt?.clientX === "number" ? evt.clientX : undefined;
      const clientY = typeof evt?.clientY === "number" ? evt.clientY : undefined;
      onDataSelect?.({
        name: params.name,
        value: params.value,
        seriesName: params.seriesName,
        clientX,
        clientY,
      });
    };
    chart.on("click", handleClick);

    const ro = new ResizeObserver(() => {
      chart.resize();
    });
    ro.observe(el);

    return () => {
      chart.off("click", handleClick);
      ro.disconnect();
      chart.dispose();
    };
  }, [theme, optionForTheme, onDataSelect]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = echarts.getInstanceByDom(el);
    if (chart) {
      chart.setOption(resolveCssVars(optionForTheme, el), { notMerge: true });
    }
  }, [optionForTheme]);

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full min-h-[1px] min-w-[1px]", className)}
      style={{ zIndex: 1 }}
    />
  );
}
