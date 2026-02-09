import React from 'react';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  title?: string;
  size?: number;
  showLegend?: boolean;
  donut?: boolean;
}

const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  title, 
  size = 180,
  showLegend = true,
  donut = true
}) => {
  if (!data.length) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 8;
  const innerRadius = donut ? radius * 0.55 : 0;

  let currentAngle = -90; // Start at top

  const slices = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const largeArc = angle > 180 ? 1 : 0;

    // Outer arc
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    // Inner arc (for donut)
    const ix1 = cx + innerRadius * Math.cos(endRad);
    const iy1 = cy + innerRadius * Math.sin(endRad);
    const ix2 = cx + innerRadius * Math.cos(startRad);
    const iy2 = cy + innerRadius * Math.sin(startRad);

    let path: string;
    if (donut) {
      path = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        'Z'
      ].join(' ');
    } else {
      path = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
    }

    // Label position
    const midAngle = (startAngle + endAngle) / 2;
    const midRad = (midAngle * Math.PI) / 180;
    const labelRadius = donut ? (radius + innerRadius) / 2 : radius * 0.65;
    const labelX = cx + labelRadius * Math.cos(midRad);
    const labelY = cy + labelRadius * Math.sin(midRad);

    return {
      path,
      color: item.color,
      label: item.label,
      percentage,
      value: item.value,
      labelX,
      labelY,
      showLabel: percentage > 5
    };
  });

  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-slate-700 mb-3">{title}</h4>}
      <div className="flex items-center gap-6 flex-wrap justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((slice, i) => (
            <g key={i}>
              <path
                d={slice.path}
                fill={slice.color}
                stroke="white"
                strokeWidth="2"
                opacity={0.9}
              >
                <title>{`${slice.label}: ${slice.value} (${slice.percentage.toFixed(1)}%)`}</title>
              </path>
              {slice.showLabel && (
                <text
                  x={slice.labelX}
                  y={slice.labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="11"
                  fontWeight="600"
                >
                  {slice.percentage.toFixed(0)}%
                </text>
              )}
            </g>
          ))}
          
          {/* Center text for donut */}
          {donut && (
            <text 
              x={cx} 
              y={cy} 
              textAnchor="middle" 
              dominantBaseline="central" 
              className="fill-slate-700" 
              fontSize="12" 
              fontWeight="600"
            >
              {total}
            </text>
          )}
        </svg>

        {showLegend && (
          <div className="flex flex-col gap-2">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-slate-600">
                  {item.label}: {item.value} ({((item.value / total) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PieChart;
