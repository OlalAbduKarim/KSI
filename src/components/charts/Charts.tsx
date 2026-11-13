import React, { useState } from 'react';

interface GroupedDivisionItem {
  label: string;
  avgPassRate: number;
  avgAttendance: number;
  schoolCount: number;
}

export const DivisionPerformanceChart: React.FC<{
  data: GroupedDivisionItem[];
}> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const width = 560;
  const height = 240;
  const padLeft = 36;
  const padBottom = 38;
  const padTop = 18;
  const padRight = 16;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const groupW = innerW / Math.max(1, data.length);
  const barW = Math.min(24, groupW * 0.28);

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-end gap-5 text-xs text-slate-600 mb-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#0B1E3D] inline-block" />
          Avg Pass Rate (%)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#0D9488] inline-block" />
          Avg Attendance (%)
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label="School performance by Kampala division"
      >
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = padTop + innerH - (tick / 100) * innerH;
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={padLeft - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-mono tabular-nums"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const cx = padLeft + i * groupW + groupW / 2;
          const passH = (d.avgPassRate / 100) * innerH;
          const attH = (d.avgAttendance / 100) * innerH;
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={d.label}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {isHovered && (
                <rect
                  x={padLeft + i * groupW + 4}
                  y={padTop}
                  width={groupW - 8}
                  height={innerH}
                  fill="#f1f5f9"
                  rx={4}
                />
              )}
              <rect
                x={cx - barW - 2}
                y={padTop + innerH - passH}
                width={barW}
                height={Math.max(2, passH)}
                fill="#0B1E3D"
                rx={2}
              />
              <rect
                x={cx + 2}
                y={padTop + innerH - attH}
                width={barW}
                height={Math.max(2, attH)}
                fill="#0D9488"
                rx={2}
              />
              <text
                x={cx}
                y={height - 18}
                textAnchor="middle"
                className="fill-slate-700 text-[11px] font-medium"
              >
                {d.label}
              </text>
              <text
                x={cx}
                y={height - 6}
                textAnchor="middle"
                className="fill-slate-400 text-[9px] font-mono tabular-nums"
              >
                {d.schoolCount} sch
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredIdx !== null && data[hoveredIdx] && (
        <div className="mt-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-md flex items-center justify-between tabular-nums">
          <span className="font-medium">{data[hoveredIdx].label} Division</span>
          <span className="font-mono">
            Pass: {data[hoveredIdx].avgPassRate}% · Attendance: {data[hoveredIdx].avgAttendance}%
          </span>
        </div>
      )}
    </div>
  );
};

interface TrendPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export const TermLineChart: React.FC<{
  data: TrendPoint[];
  unit?: string;
  primaryLabel: string;
  primaryColor?: string;
  secondaryLabel?: string;
  secondaryColor?: string;
  minY?: number;
  maxY?: number;
}> = ({
  data,
  unit = '%',
  primaryLabel,
  primaryColor = '#0B1E3D',
  secondaryLabel,
  secondaryColor = '#0D9488',
  minY,
  maxY,
}) => {
  const width = 460;
  const height = 185;
  const padLeft = 46;
  const padRight = 24;
  const padTop = 18;
  const padBottom = 30;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const allVals = data.flatMap((d) =>
    d.secondaryValue !== undefined ? [d.value, d.secondaryValue] : [d.value]
  );
  const rawMin = minY !== undefined ? minY : Math.floor(Math.min(...allVals) * 0.9);
  const rawMax = maxY !== undefined ? maxY : Math.ceil(Math.max(...allVals) * 1.05) || 100;
  const span = Math.max(1, rawMax - rawMin);

  const getX = (idx: number) =>
    data.length <= 1 ? padLeft + innerW / 2 : padLeft + (idx / (data.length - 1)) * innerW;
  const getY = (val: number) => padTop + innerH - ((val - rawMin) / span) * innerH;

  const primaryPoints = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const secondaryPoints =
    secondaryLabel && data.every((d) => d.secondaryValue !== undefined)
      ? data.map((d, i) => `${getX(i)},${getY(d.secondaryValue as number)}`).join(' ')
      : null;

  const ticks = [rawMin, Math.round(rawMin + span / 2), rawMax];

  return (
    <div className="w-full">
      <div className="flex items-center justify-end gap-4 text-xs text-slate-600 mb-1.5">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-3 h-0.5 inline-block"
            style={{ backgroundColor: primaryColor }}
          />
          {primaryLabel}
        </span>
        {secondaryLabel && (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 inline-block"
              style={{ backgroundColor: secondaryColor }}
            />
            {secondaryLabel}
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {ticks.map((t, idx) => {
          const y = getY(t);
          return (
            <g key={idx}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={padLeft - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-mono tabular-nums"
              >
                {t.toLocaleString()}
                {unit}
              </text>
            </g>
          );
        })}

        {data.length > 1 && (
          <polyline
            fill="none"
            stroke={primaryColor}
            strokeWidth="2.5"
            points={primaryPoints}
          />
        )}
        {secondaryPoints && (
          <polyline
            fill="none"
            stroke={secondaryColor}
            strokeWidth="2.5"
            strokeDasharray="4 3"
            points={secondaryPoints}
          />
        )}

        {data.map((d, i) => {
          const x = getX(i);
          const y1 = getY(d.value);
          return (
            <g key={d.label}>
              <circle cx={x} cy={y1} r="4" fill={primaryColor} />
              <text
                x={x}
                y={y1 - 9}
                textAnchor="middle"
                className="fill-slate-800 text-[10px] font-mono font-semibold tabular-nums"
              >
                {d.value.toLocaleString()}
                {unit}
              </text>
              {d.secondaryValue !== undefined && secondaryLabel && (
                <>
                  <circle
                    cx={x}
                    cy={getY(d.secondaryValue)}
                    r="3.5"
                    fill={secondaryColor}
                  />
                  <text
                    x={x}
                    y={getY(d.secondaryValue) + 14}
                    textAnchor="middle"
                    className="fill-teal-700 text-[10px] font-mono tabular-nums"
                  >
                    {d.secondaryValue.toLocaleString()}
                    {unit}
                  </text>
                </>
              )}
              <text
                x={x}
                y={height - 8}
                textAnchor="middle"
                className="fill-slate-600 text-[11px] font-medium"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const HorizontalDistributionChart: React.FC<{
  items: { label: string; count: number; color: string }[];
  total: number;
  unitLabel?: string;
}> = ({ items, total, unitLabel = 'schools' }) => {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="font-mono text-slate-600 tabular-nums">
                {item.count} {unitLabel} ({pct}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-sm overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
