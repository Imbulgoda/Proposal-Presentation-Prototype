"use client";

import { useId, useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/child-profile";
import { cn, formatClinicalDate, formatPercent, formatStatus } from "@/lib/utils";

type Point = TrendPoint;
export type TrendMetric = "probability" | "weight" | "height" | "muac";

const METRIC: Record<TrendMetric, { key: keyof Point; label: string; unit: string; color: string; yDomain?: [number, number] }> = {
  probability: { key: "probability", label: "Demo Progression Score", unit: "%", color: "#2563eb", yDomain: [0, 100] },
  weight: { key: "weight", label: "Weight", unit: "kg", color: "#0f766e" },
  height: { key: "height", label: "Height", unit: "cm", color: "#0ea5e9" },
  muac: { key: "muac", label: "MUAC", unit: "cm", color: "#6366f1" },
};

export function TrendChart({
  data,
  metric,
  comparable,
  scoreLabel,
}: {
  data: Point[];
  metric: TrendMetric;
  comparable: boolean;
  scoreLabel?: string;
}) {
  const base = METRIC[metric];
  const spec =
    metric === "probability" && scoreLabel
      ? { ...base, label: scoreLabel }
      : base;
  const series = useMemo(
    () => data.filter((d) => d[spec.key] != null).map((d) => ({ ...d, value: d[spec.key] as number })),
    [data, spec.key],
  );

  if (!comparable && metric === "probability") {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-6 text-sm text-amber-950">
        Longitudinal comparison unavailable. The active model changed between these assessments.
      </p>
    );
  }

  if (series.length < 2) {
    return (
      <p className="rounded-xl bg-[#f8fafc] px-4 py-6 text-sm text-[#64748b]">
        Insufficient history. Available after the next completed assessment.
      </p>
    );
  }

  return (
    <div className="h-56 w-full rounded-xl bg-[#f8fafc] px-1 py-2 ring-1 ring-line/70" role="img" aria-label={`${spec.label} over visits`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e8eef5" strokeDasharray="3 3" />
          <XAxis dataKey="visit" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis
            domain={spec.yDomain ?? ["auto", "auto"]}
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => (metric === "probability" ? `${v}` : String(v))}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const row = payload[0].payload as Point & { value: number };
              return (
                <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-card">
                  <p className="font-semibold text-[#0f2744]">
                    {row.visit} · {formatClinicalDate(row.date)}
                  </p>
                  {metric === "probability" ? (
                    <>
                      <p className="mt-1 text-[#64748b]">Status: {formatStatus(row.status)}</p>
                      <p className="text-[#64748b]">Severity: {formatStatus(row.severity)}</p>
                      <p className="font-medium text-[#0f2744]">
                        {spec.label}: {formatPercent((row.probability ?? 0) / 100)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 font-medium text-[#0f2744]">
                      {spec.label}: {row.value} {spec.unit}
                    </p>
                  )}
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={spec.color}
            strokeWidth={2.5}
            dot={{ r: 5, fill: spec.color, stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            isAnimationActive
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function paddedExtent(values: number[], minSpan = 0.08): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const center = (min + max) / 2;
  let span = max - min;
  if (!Number.isFinite(span) || span < minSpan) {
    return [center - minSpan / 2, center + minSpan / 2];
  }
  const pad = span * 0.18;
  return [min - pad, max + pad];
}

function labelPlacement(
  screenX: number,
  screenY: number,
  index: number,
  total: number,
  centroidX: number,
  centroidY: number,
  compact: boolean,
): { lx: number; ly: number; angle: number } {
  const labelDist = compact ? 24 : 30;
  const dx = screenX - centroidX;
  const dy = screenY - centroidY;
  const dist = Math.hypot(dx, dy);
  const angle = dist > 3 ? Math.atan2(dy, dx) : (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    lx: screenX + Math.cos(angle) * labelDist,
    ly: screenY + Math.sin(angle) * labelDist,
    angle,
  };
}

export function LatentTrajectory({
  visits,
  warning,
  compact = false,
  className,
}: {
  visits: { id: string; visit_number: number; visit_date: string; projection?: { x: number; y: number } | null; prediction?: { risk?: number; status?: string } | null }[];
  warning?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const gridId = `latent-grid-${uid}`;
  const arrowId = `latent-arrow-${uid}`;
  const pts = visits.filter((v) => v.projection);
  if (pts.length === 0) {
    return (
      <p className={cn("rounded-xl bg-[#f8fafc] px-4 text-sm text-[#64748b]", compact ? "py-4" : "py-6")}>
        Projection coordinates appear after a visit produces a stored embedding.
      </p>
    );
  }
  const xs = pts.map((p) => p.projection!.x);
  const ys = pts.map((p) => p.projection!.y);
  const [minX, maxX] = paddedExtent(xs);
  const [minY, maxY] = paddedExtent(ys);
  const height = compact ? 180 : 300;
  const plotLeft = 48;
  const plotRight = 552;
  const plotTop = compact ? 28 : 36;
  const plotBottom = compact ? 150 : 260;
  const plotWidth = plotRight - plotLeft;
  const plotSpan = plotBottom - plotTop;
  const sx = (x: number) => ((x - minX) / (maxX - minX || 1)) * plotWidth + plotLeft;
  const sy = (y: number) => plotBottom - ((y - minY) / (maxY - minY || 1)) * plotSpan;

  const screenPts = pts.map((p) => ({
    ...p,
    x: sx(p.projection!.x),
    y: sy(p.projection!.y),
  }));
  const centroidX = screenPts.reduce((sum, p) => sum + p.x, 0) / screenPts.length;
  const centroidY = screenPts.reduce((sum, p) => sum + p.y, 0) / screenPts.length;

  return (
    <div className={className}>
      {warning ? <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">{warning}</p> : null}
      <svg
        viewBox={`0 0 600 ${height}`}
        className={cn("w-full rounded-xl bg-[#f8fafc] ring-1 ring-line/70", compact && "max-h-40")}
        role="img"
        aria-label="Latent representation trajectory"
      >
        <defs>
          <pattern id={gridId} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#94a3b8" opacity="0.35" />
          </pattern>
          <marker id={arrowId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#2563eb" />
          </marker>
        </defs>
        <rect width="600" height={height} fill={`url(#${gridId})`} />
        <rect
          x={plotLeft}
          y={plotTop}
          width={plotWidth}
          height={plotSpan}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1"
          rx="6"
        />
        {!compact ? (
          <>
            <text x={plotLeft + plotWidth / 2} y={plotBottom + 18} textAnchor="middle" fontSize="10" fill="#64748b">
              Projection axis 1
            </text>
            <text
              x={plotLeft - 10}
              y={plotTop + plotSpan / 2}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
              transform={`rotate(-90 ${plotLeft - 10} ${plotTop + plotSpan / 2})`}
            >
              Projection axis 2
            </text>
          </>
        ) : null}
        {screenPts.map((p, i) => {
          const next = screenPts[i + 1];
          const isFirst = i === 0;
          const isLast = i === screenPts.length - 1;
          const { lx, ly } = labelPlacement(p.x, p.y, i, screenPts.length, centroidX, centroidY, compact);
          const status = p.prediction?.status ? formatStatus(p.prediction.status) : null;
          const tooltip = [
            `Visit ${p.visit_number}`,
            formatClinicalDate(p.visit_date),
            status,
            p.prediction?.risk != null ? `Score: ${formatPercent(p.prediction.risk)}` : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <g key={p.id}>
              {next ? (
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={next.x}
                  y2={next.y}
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeOpacity={0.85}
                  markerEnd={`url(#${arrowId})`}
                />
              ) : null}
              {Math.hypot(lx - p.x, ly - p.y) > 12 ? (
                <line x1={p.x} y1={p.y} x2={lx} y2={ly} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
              ) : null}
              <circle
                cx={p.x}
                cy={p.y}
                r={compact ? (isLast ? 6 : 5) : isLast ? 8 : 7}
                fill={isFirst ? "#fff" : "#2563eb"}
                stroke="#2563eb"
                strokeWidth={isFirst ? 2.5 : 1.5}
              >
                <title>{tooltip}</title>
              </circle>
              <text
                x={lx}
                y={ly}
                fontSize={compact ? "10" : "11"}
                fill="#0f2744"
                fontWeight={isLast ? 600 : 400}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                <title>{tooltip}</title>
                V{p.visit_number}
              </text>
            </g>
          );
        })}
      </svg>
      {!compact ? (
        <p className="mt-3 text-xs leading-relaxed text-[#64748b]">
          Arrows follow visit order (earliest to latest). This visualization represents changes in the model&apos;s
          learned multidimensional representation. It does not independently determine clinical status.
        </p>
      ) : null}
    </div>
  );
}
