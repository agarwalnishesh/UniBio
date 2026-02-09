import React from 'react';

interface BarChartData {
  label: string;
  value: number;
  color?: string;
  secondaryValue?: number;
  secondaryColor?: string;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  yLabel?: string;
  height?: number;
  showValues?: boolean;
  grouped?: boolean;
  groupLabels?: [string, string];
}

const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  title, 
  yLabel,
  height = 200, 
  showValues = true,
  grouped = false,
  groupLabels
}) => {
  if (!data.length) return null;

  const allValues = data.flatMap(d => 
    [d.value, d.secondaryValue].filter((v): v is number => v !== undefined)
  );
  const maxValue = Math.max(...allValues) * 1.15;
  const minValue = Math.min(0, ...allValues);
  const range = maxValue - minValue;

  const barWidth = grouped ? 20 : 32;
  const groupWidth = grouped ? 52 : 44;
  const chartWidth = Math.max(data.length * groupWidth + 60, 200);
  const chartHeight = height;
  const padTop = 20;
  const padBottom = 50;
  const padLeft = 45;
  const padRight = 10;
  const plotHeight = chartHeight - padTop - padBottom;
  const plotWidth = chartWidth - padLeft - padRight;

  const yToPixel = (val: number) => {
    return padTop + plotHeight - ((val - minValue) / range) * plotHeight;
  };

  // Y-axis ticks
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    return minValue + (range / tickCount) * i;
  });

  const defaultColors = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'];

  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-slate-700 mb-3">{title}</h4>}
      <div className="overflow-x-auto">
        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className="w-full" 
          style={{ minWidth: `${Math.min(chartWidth, 300)}px`, maxHeight: `${chartHeight}px` }}
        >
          {/* Y-axis label */}
          {yLabel && (
            <text 
              x={12} 
              y={padTop + plotHeight / 2} 
              textAnchor="middle" 
              transform={`rotate(-90, 12, ${padTop + plotHeight / 2})`}
              className="fill-slate-400" 
              fontSize="10"
            >
              {yLabel}
            </text>
          )}

          {/* Grid lines and Y ticks */}
          {ticks.map((tick, i) => (
            <g key={i}>
              <line 
                x1={padLeft} 
                y1={yToPixel(tick)} 
                x2={padLeft + plotWidth} 
                y2={yToPixel(tick)} 
                stroke="#e2e8f0" 
                strokeWidth="1" 
                strokeDasharray={i === 0 ? "0" : "4,4"}
              />
              <text 
                x={padLeft - 6} 
                y={yToPixel(tick) + 3} 
                textAnchor="end" 
                className="fill-slate-400" 
                fontSize="10"
              >
                {tick.toFixed(tick % 1 === 0 ? 0 : 1)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {data.map((item, i) => {
            const x = padLeft + i * groupWidth + (groupWidth - (grouped ? barWidth * 2 + 4 : barWidth)) / 2;
            const barH = ((item.value - minValue) / range) * plotHeight;
            const color = item.color || defaultColors[i % defaultColors.length];

            return (
              <g key={i}>
                {/* Primary bar */}
                <rect
                  x={x}
                  y={yToPixel(item.value)}
                  width={barWidth}
                  height={barH}
                  rx={3}
                  fill={color}
                  opacity={0.85}
                >
                  <title>{`${item.label}: ${item.value.toFixed(1)}`}</title>
                </rect>

                {showValues && (
                  <text 
                    x={x + barWidth / 2} 
                    y={yToPixel(item.value) - 4} 
                    textAnchor="middle" 
                    className="fill-slate-600" 
                    fontSize="9" 
                    fontWeight="500"
                  >
                    {item.value.toFixed(1)}
                  </text>
                )}

                {/* Secondary bar (for grouped) */}
                {grouped && item.secondaryValue !== undefined && (
                  <>
                    <rect
                      x={x + barWidth + 4}
                      y={yToPixel(item.secondaryValue)}
                      width={barWidth}
                      height={((item.secondaryValue - minValue) / range) * plotHeight}
                      rx={3}
                      fill={item.secondaryColor || '#64748b'}
                      opacity={0.85}
                    >
                      <title>{`${item.label} (R): ${item.secondaryValue.toFixed(1)}`}</title>
                    </rect>
                    {showValues && (
                      <text 
                        x={x + barWidth + 4 + barWidth / 2} 
                        y={yToPixel(item.secondaryValue) - 4} 
                        textAnchor="middle" 
                        className="fill-slate-500" 
                        fontSize="9" 
                        fontWeight="500"
                      >
                        {item.secondaryValue.toFixed(1)}
                      </text>
                    )}
                  </>
                )}

                {/* X-axis label */}
                <text 
                  x={x + (grouped ? barWidth + 2 : barWidth / 2)} 
                  y={chartHeight - padBottom + 14} 
                  textAnchor="middle" 
                  className="fill-slate-500" 
                  fontSize="10"
                >
                  {item.label}
                </text>
              </g>
            );
          })}

          {/* Legend for grouped charts */}
          {grouped && groupLabels && (
            <g>
              <rect x={padLeft} y={chartHeight - 16} width={10} height={10} rx={2} fill="#0d9488" opacity={0.85} />
              <text x={padLeft + 14} y={chartHeight - 8} className="fill-slate-500" fontSize="9">{groupLabels[0]}</text>
              <rect x={padLeft + 70} y={chartHeight - 16} width={10} height={10} rx={2} fill="#64748b" opacity={0.85} />
              <text x={padLeft + 84} y={chartHeight - 8} className="fill-slate-500" fontSize="9">{groupLabels[1]}</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default BarChart;
