import React from 'react';

interface GCContentPlotProps {
  sequence: string;
  windowSize?: number;
  title?: string;
  height?: number;
}

const GCContentPlot: React.FC<GCContentPlotProps> = ({ 
  sequence, 
  windowSize = 50,
  title,
  height = 140
}) => {
  if (!sequence || sequence.length < windowSize) return null;

  // Calculate GC content in sliding windows
  const dataPoints: { position: number; gcContent: number }[] = [];
  const step = Math.max(1, Math.floor(windowSize / 4));
  
  for (let i = 0; i <= sequence.length - windowSize; i += step) {
    const window = sequence.slice(i, i + windowSize);
    const gcCount = (window.match(/[GC]/gi) || []).length;
    dataPoints.push({
      position: i + windowSize / 2,
      gcContent: (gcCount / windowSize) * 100
    });
  }

  if (!dataPoints.length) return null;

  const svgWidth = 500;
  const padTop = 15;
  const padBottom = 30;
  const padLeft = 40;
  const padRight = 10;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const maxGC = 100;
  const minGC = 0;

  const xToPixel = (pos: number) => padLeft + (pos / sequence.length) * plotWidth;
  const yToPixel = (gc: number) => padTop + plotHeight - ((gc - minGC) / (maxGC - minGC)) * plotHeight;

  // Build path
  const pathPoints = dataPoints.map((d, i) => {
    const x = xToPixel(d.position);
    const y = yToPixel(d.gcContent);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Fill area path
  const areaPath = pathPoints + 
    ` L ${xToPixel(dataPoints[dataPoints.length - 1].position)} ${yToPixel(0)}` +
    ` L ${xToPixel(dataPoints[0].position)} ${yToPixel(0)} Z`;

  // Overall GC content
  const overallGC = ((sequence.match(/[GC]/gi) || []).length / sequence.length * 100).toFixed(1);

  return (
    <div className="w-full">
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
          <span className="text-xs text-slate-500">
            Overall GC: <span className="font-medium text-brand-600">{overallGC}%</span>
            {' '}| Window: {windowSize}bp
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <svg 
          viewBox={`0 0 ${svgWidth} ${height}`} 
          className="w-full" 
          style={{ minWidth: '300px' }}
        >
          {/* Reference lines */}
          {[0, 25, 50, 75, 100].map((gc) => (
            <g key={gc}>
              <line 
                x1={padLeft} 
                y1={yToPixel(gc)} 
                x2={padLeft + plotWidth} 
                y2={yToPixel(gc)} 
                stroke={gc === 50 ? '#0d948844' : '#e2e8f0'} 
                strokeWidth={gc === 50 ? 1.5 : 1} 
                strokeDasharray={gc === 50 ? '6,3' : '4,4'}
              />
              <text 
                x={padLeft - 5} 
                y={yToPixel(gc) + 3} 
                textAnchor="end" 
                className="fill-slate-400" 
                fontSize="9"
              >
                {gc}%
              </text>
            </g>
          ))}

          {/* Fill area */}
          <path d={areaPath} fill="url(#gcGradient)" opacity={0.3} />

          {/* GC content line */}
          <path d={pathPoints} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinejoin="round" />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gcGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* X-axis label */}
          <text 
            x={padLeft + plotWidth / 2} 
            y={height - 5} 
            textAnchor="middle" 
            className="fill-slate-400" 
            fontSize="10"
          >
            Position (bp)
          </text>

          {/* X ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
            const pos = Math.round(frac * sequence.length);
            return (
              <text 
                key={i}
                x={xToPixel(pos)} 
                y={padTop + plotHeight + 14} 
                textAnchor="middle" 
                className="fill-slate-400" 
                fontSize="9"
              >
                {pos}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default GCContentPlot;
