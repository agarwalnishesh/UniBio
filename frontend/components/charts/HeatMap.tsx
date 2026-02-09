import React from 'react';

interface HeatMapCell {
  value: number;
  label?: string;
}

interface HeatMapProps {
  data: HeatMapCell[][];
  rowLabels: string[];
  colLabels: string[];
  title?: string;
  colorScale?: 'green' | 'red' | 'blue' | 'diverging';
  showValues?: boolean;
  valueFormat?: (val: number) => string;
  minValue?: number;
  maxValue?: number;
}

const HeatMap: React.FC<HeatMapProps> = ({ 
  data, 
  rowLabels, 
  colLabels, 
  title,
  colorScale = 'green',
  showValues = true,
  valueFormat = (v) => v.toFixed(1),
  minValue,
  maxValue
}) => {
  if (!data.length || !data[0].length) return null;

  const allValues = data.flat().map(c => c.value);
  const min = minValue ?? Math.min(...allValues);
  const max = maxValue ?? Math.max(...allValues);
  const range = max - min || 1;

  const getColor = (value: number): string => {
    const t = Math.max(0, Math.min(1, (value - min) / range));
    
    switch (colorScale) {
      case 'green':
        return `rgb(${Math.round(240 - t * 200)}, ${Math.round(240 - t * 50)}, ${Math.round(240 - t * 200)})`;
      case 'red':
        return `rgb(${Math.round(240 - t * 10)}, ${Math.round(240 - t * 190)}, ${Math.round(240 - t * 190)})`;
      case 'blue':
        return `rgb(${Math.round(240 - t * 190)}, ${Math.round(240 - t * 130)}, ${Math.round(240 - t * 10)})`;
      case 'diverging': {
        // Green -> White -> Red
        if (t < 0.5) {
          const s = t * 2;
          return `rgb(${Math.round(34 + s * 221)}, ${Math.round(197 - s * 50)}, ${Math.round(94 + s * 161)})`;
        } else {
          const s = (t - 0.5) * 2;
          return `rgb(${Math.round(255)}, ${Math.round(147 - s * 97)}, ${Math.round(255 - s * 195)})`;
        }
      }
      default:
        return `rgb(${Math.round(240 - t * 200)}, ${Math.round(240 - t * 50)}, ${Math.round(240 - t * 200)})`;
    }
  };

  const getTextColor = (value: number): string => {
    const t = (value - min) / range;
    return t > 0.6 ? 'white' : '#334155';
  };

  const cellSize = 64;
  const labelWidth = 80;

  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-slate-700 mb-3">{title}</h4>}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Column headers */}
          <div className="flex" style={{ marginLeft: `${labelWidth}px` }}>
            {colLabels.map((label, i) => (
              <div 
                key={i} 
                className="text-xs text-slate-500 font-medium text-center truncate px-1"
                style={{ width: `${cellSize}px` }}
                title={label}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Rows */}
          {data.map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-center">
              {/* Row label */}
              <div 
                className="text-xs text-slate-600 font-medium text-right pr-3 truncate flex-shrink-0"
                style={{ width: `${labelWidth}px` }}
                title={rowLabels[rowIdx]}
              >
                {rowLabels[rowIdx]}
              </div>
              
              {/* Cells */}
              {row.map((cell, colIdx) => (
                <div
                  key={colIdx}
                  className="flex items-center justify-center border border-white rounded-sm"
                  style={{ 
                    width: `${cellSize}px`, 
                    height: '36px',
                    backgroundColor: getColor(cell.value),
                    color: getTextColor(cell.value)
                  }}
                  title={`${rowLabels[rowIdx]} / ${colLabels[colIdx]}: ${valueFormat(cell.value)}`}
                >
                  {showValues && (
                    <span className="text-xs font-medium">
                      {cell.label || valueFormat(cell.value)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Color scale legend */}
          <div className="flex items-center gap-2 mt-3" style={{ marginLeft: `${labelWidth}px` }}>
            <span className="text-xs text-slate-400">{valueFormat(min)}</span>
            <div 
              className="h-3 rounded-full flex-1"
              style={{ 
                maxWidth: '120px',
                background: `linear-gradient(to right, ${getColor(min)}, ${getColor((min + max) / 2)}, ${getColor(max)})`
              }}
            />
            <span className="text-xs text-slate-400">{valueFormat(max)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatMap;
