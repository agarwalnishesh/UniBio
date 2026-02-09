import React from 'react';
import BarChart from './BarChart';
import PieChart from './PieChart';
import GCContentPlot from './GCContentPlot';
import { FunctionCall } from '../../services/api';

interface ChartRendererProps {
  functionCalls: FunctionCall[];
}

/**
 * Auto-detects function call results and renders appropriate charts.
 * Used in the AI chat sidebar to visualize tool results inline.
 */
const ChartRenderer: React.FC<ChartRendererProps> = ({ functionCalls }) => {
  if (!functionCalls || functionCalls.length === 0) return null;

  const charts: React.ReactNode[] = [];
  let chartKey = 0;

  for (const fc of functionCalls) {
    const result = fc.result;
    if (!result || result.error) continue;

    switch (fc.function) {
      case 'design_primers': {
        const pairs = result.primer_pairs;
        if (pairs && pairs.length > 0) {
          charts.push(
            <div key={`chart-${chartKey++}`} className="bg-white rounded-lg p-3 border border-slate-200">
              <BarChart
                title="Primer Tm Comparison"
                yLabel="Tm (°C)"
                height={160}
                grouped={true}
                groupLabels={["Forward", "Reverse"]}
                data={pairs.slice(0, 5).map((pair: any) => ({
                  label: `#${(pair.pair_id ?? 0) + 1}`,
                  value: pair.left_tm ?? 0,
                  color: '#0d9488',
                  secondaryValue: pair.right_tm ?? 0,
                  secondaryColor: '#64748b'
                }))}
              />
            </div>
          );
        }
        break;
      }

      case 'find_restriction_sites': {
        const enzymes = result.enzymes;
        if (enzymes && enzymes.length > 0) {
          charts.push(
            <div key={`chart-${chartKey++}`} className="bg-white rounded-lg p-3 border border-slate-200">
              <BarChart
                title="Cut Frequency"
                yLabel="Cuts"
                height={160}
                data={enzymes.slice(0, 8).map((e: any) => ({
                  label: e.enzyme_name,
                  value: e.cut_count,
                  color: e.cut_count === 1 ? '#22c55e' : '#f59e0b'
                }))}
              />
            </div>
          );
        }
        break;
      }

      case 'fetch_ncbi_sequence': {
        const seq = result.sequence;
        if (seq && seq.length > 20) {
          const aCount = (seq.match(/A/gi) || []).length;
          const tCount = (seq.match(/T/gi) || []).length;
          const gCount = (seq.match(/G/gi) || []).length;
          const cCount = (seq.match(/C/gi) || []).length;

          charts.push(
            <div key={`chart-${chartKey++}`} className="bg-white rounded-lg p-3 border border-slate-200">
              <PieChart
                title="Nucleotide Composition"
                size={140}
                data={[
                  { label: 'A', value: aCount, color: '#22c55e' },
                  { label: 'T', value: tCount, color: '#ef4444' },
                  { label: 'G', value: gCount, color: '#3b82f6' },
                  { label: 'C', value: cCount, color: '#f59e0b' },
                ]}
              />
            </div>
          );

          if (seq.length > 100) {
            charts.push(
              <div key={`chart-${chartKey++}`} className="bg-white rounded-lg p-3 border border-slate-200">
                <GCContentPlot
                  title="GC Content"
                  sequence={seq}
                  windowSize={Math.min(50, Math.floor(seq.length / 5))}
                  height={120}
                />
              </div>
            );
          }
        }
        break;
      }

      case 'analyze_primer': {
        if (result.tm !== undefined) {
          charts.push(
            <div key={`chart-${chartKey++}`} className="bg-white rounded-lg p-3 border border-slate-200">
              <BarChart
                title="Primer Thermodynamics"
                yLabel="Temperature (°C)"
                height={140}
                data={[
                  { label: 'Tm', value: result.tm ?? 0, color: '#0d9488' },
                  { label: 'Hairpin', value: result.hairpin_tm ?? 0, color: result.hairpin_tm > 40 ? '#ef4444' : '#64748b' },
                  { label: 'Homodimer', value: result.homodimer_tm ?? 0, color: result.homodimer_tm > 40 ? '#ef4444' : '#64748b' },
                ]}
              />
            </div>
          );
        }
        break;
      }
    }
  }

  if (charts.length === 0) return null;

  return (
    <div className="space-y-3 mt-2">
      {charts}
    </div>
  );
};

export default ChartRenderer;
