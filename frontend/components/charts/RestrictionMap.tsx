import React from 'react';

interface CutSite {
  enzyme: string;
  positions: number[];
  color?: string;
}

interface RestrictionMapProps {
  sequenceLength: number;
  sites: CutSite[];
  title?: string;
  maxEnzymes?: number;
}

const RestrictionMap: React.FC<RestrictionMapProps> = ({ 
  sequenceLength, 
  sites, 
  title,
  maxEnzymes = 12
}) => {
  if (!sites.length || !sequenceLength) return null;

  const displaySites = sites.slice(0, maxEnzymes);
  const svgWidth = 600;
  const padLeft = 10;
  const padRight = 10;
  const lineY = 40;
  const mapWidth = svgWidth - padLeft - padRight;
  const rowHeight = 22;
  const svgHeight = lineY + 20 + displaySites.length * rowHeight + 20;

  const colors = [
    '#0d9488', '#dc2626', '#2563eb', '#d97706', '#7c3aed',
    '#059669', '#e11d48', '#0284c7', '#ca8a04', '#9333ea',
    '#0891b2', '#be123c'
  ];

  const posToX = (pos: number) => padLeft + (pos / sequenceLength) * mapWidth;

  // Tick marks
  const tickCount = Math.min(10, Math.floor(sequenceLength / 100));
  const tickInterval = Math.ceil(sequenceLength / tickCount / 100) * 100;
  const ticks: number[] = [];
  for (let i = 0; i <= sequenceLength; i += tickInterval) {
    ticks.push(i);
  }
  if (ticks[ticks.length - 1] !== sequenceLength) {
    ticks.push(sequenceLength);
  }

  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-slate-700 mb-3">{title}</h4>}
      <div className="overflow-x-auto">
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="w-full" 
          style={{ minWidth: '400px' }}
        >
          {/* Sequence line */}
          <line 
            x1={padLeft} 
            y1={lineY} 
            x2={padLeft + mapWidth} 
            y2={lineY} 
            stroke="#334155" 
            strokeWidth="3" 
            strokeLinecap="round"
          />

          {/* Tick marks and labels */}
          {ticks.map((pos, i) => (
            <g key={i}>
              <line 
                x1={posToX(pos)} 
                y1={lineY - 5} 
                x2={posToX(pos)} 
                y2={lineY + 5} 
                stroke="#64748b" 
                strokeWidth="1"
              />
              <text 
                x={posToX(pos)} 
                y={lineY - 10} 
                textAnchor="middle" 
                className="fill-slate-400" 
                fontSize="9"
              >
                {pos}
              </text>
            </g>
          ))}

          {/* 5' and 3' labels */}
          <text x={padLeft - 2} y={lineY + 16} className="fill-slate-500" fontSize="10" fontWeight="600">5'</text>
          <text x={padLeft + mapWidth + 2} y={lineY + 16} className="fill-slate-500" fontSize="10" fontWeight="600" textAnchor="end">3'</text>

          {/* Cut sites per enzyme */}
          {displaySites.map((site, sIdx) => {
            const color = site.color || colors[sIdx % colors.length];
            const yOffset = lineY + 25 + sIdx * rowHeight;

            return (
              <g key={sIdx}>
                {/* Enzyme name */}
                <text 
                  x={padLeft} 
                  y={yOffset + 4} 
                  className="fill-slate-600" 
                  fontSize="10" 
                  fontWeight="500"
                >
                  {site.enzyme}
                </text>

                {/* Cut lines */}
                {site.positions.map((pos, pIdx) => {
                  const x = posToX(pos);
                  return (
                    <g key={pIdx}>
                      {/* Vertical line from main sequence to enzyme row */}
                      <line 
                        x1={x} 
                        y1={lineY} 
                        x2={x} 
                        y2={yOffset - 2} 
                        stroke={color} 
                        strokeWidth="1.5" 
                        opacity={0.6}
                        strokeDasharray="3,2"
                      />
                      {/* Triangle marker on sequence */}
                      <polygon
                        points={`${x - 3},${lineY + 3} ${x + 3},${lineY + 3} ${x},${lineY}`}
                        fill={color}
                      />
                      {/* Position dot on enzyme row */}
                      <circle 
                        cx={x} 
                        cy={yOffset} 
                        r="3.5" 
                        fill={color}
                      >
                        <title>{`${site.enzyme} cuts at position ${pos}`}</title>
                      </circle>
                    </g>
                  );
                })}

                {/* Cut count badge */}
                <text 
                  x={svgWidth - padRight} 
                  y={yOffset + 4} 
                  textAnchor="end" 
                  className="fill-slate-400" 
                  fontSize="9"
                >
                  {site.positions.length}x
                </text>
              </g>
            );
          })}

          {sites.length > maxEnzymes && (
            <text 
              x={svgWidth / 2} 
              y={svgHeight - 5} 
              textAnchor="middle" 
              className="fill-slate-400" 
              fontSize="9"
            >
              +{sites.length - maxEnzymes} more enzymes...
            </text>
          )}
        </svg>
      </div>
    </div>
  );
};

export default RestrictionMap;
