export type KpiSparklinePattern =
  | "steadyUp"
  | "steadyDown"
  | "smallDipRecovery"
  | "bigDipRecovery"
  | "smallSpikePullback"
  | "flat";

export type TrendDirection = "up" | "down" | "neutral";

export interface TrendSparklineInput {
  value: string | number;
  trend: string;
  pattern: KpiSparklinePattern;
  seedKey: string;
  points?: number;
}

interface ParsedNumber {
  value: number;
  precision: number;
}

const DEFAULT_POINTS = 14;
const GAUSSIAN_EPSILON = 1e-9;

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseMetricNumber(value: string | number): ParsedNumber | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return { value, precision: Number.isInteger(value) ? 0 : 2 };
  }

  const match = value.match(/-?\d[\d,]*(?:\.\d+)?/);
  if (!match?.[0]) return null;

  const numericText = match[0].replace(/,/g, "");
  const parsed = Number.parseFloat(numericText);
  if (!Number.isFinite(parsed)) return null;

  const fractional = numericText.split(".")[1];
  return { value: parsed, precision: fractional?.length ?? 0 };
}

function parseSignedTrendNumber(trend: string): number | null {
  const normalized = trend.replace(/−/g, "-").trim();
  const match = normalized.match(/[+-]?\d+(?:\.\d+)?/);
  if (!match?.[0]) return null;
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getTrendDirectionFromBadge(trend: string): TrendDirection {
  const normalized = trend.replace(/−/g, "-").trim().toLowerCase();
  if (!normalized || normalized.includes("no change") || normalized.includes("flat")) {
    return "neutral";
  }
  if (normalized.startsWith("+") || normalized.includes("up")) return "up";
  if (normalized.startsWith("-") || normalized.includes("down")) return "down";

  const numeric = parseSignedTrendNumber(normalized);
  if (numeric === null || numeric === 0) return "neutral";
  return numeric > 0 ? "up" : "down";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToPrecision(value: number, precision: number): number {
  if (precision <= 0) return Math.round(value);
  return Number(value.toFixed(precision));
}

function gaussian(t: number, center: number, width: number): number {
  const safeWidth = Math.max(width, GAUSSIAN_EPSILON);
  const dist = (t - center) / safeWidth;
  return Math.exp(-(dist * dist) / 2);
}

function directionalCurve(t: number, direction: TrendDirection): number {
  if (direction === "up") {
    return 0.16 * Math.sin(t * Math.PI) + 0.08 * t;
  }
  if (direction === "down") {
    return -0.16 * Math.sin(t * Math.PI) - 0.08 * t;
  }
  return 0;
}

function eventShape(
  pattern: KpiSparklinePattern,
  t: number,
  direction: TrendDirection,
  eventAmplitude: number,
): number {
  if (pattern === "smallDipRecovery") {
    return -eventAmplitude * gaussian(t, 0.56, 0.13);
  }
  if (pattern === "bigDipRecovery") {
    return -eventAmplitude * 1.75 * gaussian(t, 0.54, 0.12);
  }
  if (pattern === "smallSpikePullback") {
    const spike = eventAmplitude * gaussian(t, 0.38, 0.1);
    const pullback = eventAmplitude * 0.38 * gaussian(t, 0.72, 0.12);
    return spike - pullback;
  }
  if (pattern === "steadyUp" || pattern === "steadyDown") {
    return directionalCurve(t, direction) * eventAmplitude;
  }
  return 0;
}

function resolveChangeRatio(target: number, trend: string, direction: TrendDirection): number {
  if (direction === "neutral") return 0.008;

  const numericDelta = parseSignedTrendNumber(trend);
  if (numericDelta === null) return 0.06;

  const normalizedTrend = trend.replace(/−/g, "-");
  if (normalizedTrend.includes("%")) {
    return clamp(Math.abs(numericDelta) / 100, 0.003, 0.35);
  }

  const denominator = Math.max(Math.abs(target), 1);
  return clamp(Math.abs(numericDelta) / denominator, 0.003, 0.35);
}

function clampMetricRange(value: number, isPercent: boolean): number {
  if (isPercent) return clamp(value, 0, 100);
  return Math.max(0, value);
}

export function buildTrendSparklineSeries({
  value,
  trend,
  pattern,
  seedKey,
  points = DEFAULT_POINTS,
}: TrendSparklineInput): number[] {
  const parsedValue = parseMetricNumber(value);
  const targetRaw = parsedValue?.value ?? 0;
  const precision = parsedValue?.precision ?? 0;
  const isPercent = typeof value === "string" && value.includes("%");
  const direction = getTrendDirectionFromBadge(trend);
  const safePoints = Math.max(4, points);

  const target = clampMetricRange(targetRaw, isPercent);
  const rng = createSeededRandom(hashSeed(`${seedKey}|${String(value)}|${trend}|${pattern}`));
  const phase = rng() * Math.PI * 2;

  const changeRatio = resolveChangeRatio(target, trend, direction);
  const minAbsoluteMove = isPercent
    ? Math.max(Math.abs(target) * 0.002, 0.15)
    : Math.abs(target) < 1
      ? 0.01
      : Math.abs(target) < 10
        ? 0.08
        : Math.abs(target) < 100
          ? 0.35
          : 1;
  const baseMoveAbsolute = Math.max(Math.abs(target) * changeRatio, minAbsoluteMove);

  let start = target;
  if (direction === "up") start = target - baseMoveAbsolute;
  if (direction === "down") start = target + baseMoveAbsolute;
  if (direction === "neutral") start = target + (rng() - 0.5) * baseMoveAbsolute * 0.4;

  start = clampMetricRange(start, isPercent);
  if (direction === "up" && start >= target) {
    start = clampMetricRange(target - Math.max(baseMoveAbsolute * 0.35, isPercent ? 0.25 : 1), isPercent);
  }
  if (direction === "down" && start <= target) {
    start = clampMetricRange(target + Math.max(baseMoveAbsolute * 0.35, isPercent ? 0.25 : 1), isPercent);
  }

  const span = Math.abs(target - start);
  const waveAmplitudeBase = pattern === "flat"
    ? Math.max(Math.abs(target) * 0.004, isPercent ? 0.08 : 0.3)
    : Math.max(span * 0.18, Math.abs(target) * 0.015, isPercent ? 0.25 : 0.6);
  const eventAmplitude = pattern === "flat"
    ? 0
    : Math.max(span * 0.35, waveAmplitudeBase * 1.15);

  const values = Array.from({ length: safePoints }, (_, index) => {
    const t = index / (safePoints - 1);
    const baseline = start + (target - start) * t;
    const waveA = Math.sin((t * 2.6 + phase) * Math.PI) * waveAmplitudeBase * 0.42;
    const waveB = Math.cos((t * 5.2 + phase * 0.5) * Math.PI) * waveAmplitudeBase * 0.22;
    const event = eventShape(pattern, t, direction, eventAmplitude);
    const raw = baseline + waveA + waveB + event;
    const clamped = clampMetricRange(raw, isPercent);
    return roundToPrecision(clamped, precision);
  });

  values[0] = roundToPrecision(start, precision);
  values[safePoints - 1] = roundToPrecision(target, precision);

  if (direction === "up" && values[0] >= values[safePoints - 1]) {
    const minStep = precision > 0 ? 1 / 10 ** precision : 1;
    values[0] = roundToPrecision(
      clampMetricRange(values[safePoints - 1] - minStep, isPercent),
      precision,
    );
  } else if (direction === "down" && values[0] <= values[safePoints - 1]) {
    const minStep = precision > 0 ? 1 / 10 ** precision : 1;
    values[0] = roundToPrecision(
      clampMetricRange(values[safePoints - 1] + minStep, isPercent),
      precision,
    );
  }

  return values;
}

export function formatSparklineValueFromReference(referenceValue: string, value: number): string {
  const parsed = parseMetricNumber(referenceValue);
  const precision = parsed?.precision ?? 0;
  const normalized = roundToPrecision(value, precision);

  if (referenceValue.includes("%")) {
    return `${normalized.toFixed(Math.max(precision, 0))}%`;
  }
  if (/\bhrs?\b/i.test(referenceValue)) {
    return `${normalized.toFixed(Math.max(precision, 1))} hrs`;
  }
  if (/\bmin\b/i.test(referenceValue)) {
    return `${normalized.toFixed(Math.max(precision, 1))} min`;
  }
  if (precision > 0) {
    return normalized.toFixed(precision);
  }
  return Math.round(normalized).toLocaleString("en-US");
}
