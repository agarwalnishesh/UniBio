import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ToolId, PrimerDesignData } from '../../types';
import { ArrowPathIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { api, PrimerPair } from '../../services/api';

const PrimerDesign: React.FC = () => {
  const { toolState, updateToolData, isAgentProcessing } = useApp();
  const data = toolState[ToolId.PRIMER_DESIGN] as PrimerDesignData;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PrimerPair[]>([]);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handleChange = (field: keyof PrimerDesignData, value: any) => {
    updateToolData(ToolId.PRIMER_DESIGN, { [field]: value });
    // Clear results when parameters change
    setResults([]);
    setResultMessage(null);
    setError(null);
  };

  const handleDesignPrimers = async () => {
    if (!data.sequence || data.sequence.length < 50) {
      setError('Sequence must be at least 50 base pairs');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setResultMessage(null);

    try {
      const response = await api.designPrimers({
        sequence: data.sequence,
        min_tm: data.optimalTm - 3,
        max_tm: data.optimalTm + 3,
        prod_min: data.productSizeMin,
        prod_max: data.productSizeMax,
      });

      if (response.success) {
        setResults(response.primer_pairs);
        setResultMessage(response.message || `Found ${response.primer_pairs.length} primer pair(s)`);
      } else {
        setError(response.message || 'No suitable primers found. Try adjusting parameters.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to design primers');
    } finally {
      setIsLoading(false);
    }
  };

  const hasSequence = data.sequence.length > 10;
  const gcContent = data.sequence ? 
    ((data.sequence.match(/[GC]/gi)?.length || 0) / data.sequence.length * 100).toFixed(1) : '0';
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Primer Design</h2>
        <p className="text-slate-500">Generate optimal PCR primer pairs targeting your specific region of interest.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`bg-white rounded-xl shadow-sm border p-6 transition-colors duration-500 ${isAgentProcessing ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200'}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800">Target Sequence</h3>
                <span className="text-xs font-mono text-slate-400">FASTA / Raw</span>
            </div>
            <textarea 
                value={data.sequence}
                onChange={(e) => handleChange('sequence', e.target.value.toUpperCase().replace(/[^ATGCNRYSWKMBDHV]/gi, ''))}
                placeholder="Paste DNA sequence here (5' -> 3')..."
                className="w-full h-48 p-4 font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none leading-relaxed text-slate-700 tracking-wide"
                spellCheck={false}
            />
            <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>Length: {data.sequence.length} bp</span>
                <span>GC: {gcContent}%</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Candidate Pairs</h3>
                {resultMessage && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    {resultMessage}
                  </span>
                )}
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pair</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Forward (5'-3')</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reverse (5'-3')</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tm (°C)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">GC%</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200 text-sm">
                    {results.map((pair, idx) => (
                      <tr key={pair.pair_id} className={idx === 0 ? 'bg-green-50' : ''}>
                        <td className="px-4 py-4 whitespace-nowrap text-brand-600 font-medium">
                          #{pair.pair_id + 1}
                          {idx === 0 && <span className="ml-2 text-xs text-green-600">(Best)</span>}
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-slate-600 max-w-[150px] truncate" title={pair.left_sequence}>
                          {pair.left_sequence}
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-slate-600 max-w-[150px] truncate" title={pair.right_sequence}>
                          {pair.right_sequence}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                          <span className="text-xs">F:</span> {pair.left_tm.toFixed(1)} / <span className="text-xs">R:</span> {pair.right_tm.toFixed(1)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                          {pair.left_gc.toFixed(0)}% / {pair.right_gc.toFixed(0)}%
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-slate-600">{pair.product_size} bp</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Parameters */}
        <div className="space-y-6">
          <div className={`bg-white rounded-xl shadow-sm border p-6 transition-colors duration-500 ${isAgentProcessing ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200'}`}>
            <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <ArrowPathIcon className="w-4 h-4 text-slate-400" />
              Parameters
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Target Tm (°C)</label>
                  <span className="text-sm font-mono text-brand-600 bg-brand-50 px-2 rounded">{data.optimalTm}</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="75" 
                  step="0.5"
                  value={data.optimalTm}
                  onChange={(e) => handleChange('optimalTm', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>50°C</span>
                  <span>75°C</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min Product (bp)</label>
                  <input 
                    type="number" 
                    value={data.productSizeMin}
                    onChange={(e) => handleChange('productSizeMin', parseInt(e.target.value) || 100)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Product (bp)</label>
                  <input 
                    type="number" 
                    value={data.productSizeMax}
                    onChange={(e) => handleChange('productSizeMax', parseInt(e.target.value) || 1000)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-slate-100">
                <label className="text-sm font-medium text-slate-700">GC Clamp</label>
                <button 
                  onClick={() => handleChange('gcClamp', !data.gcClamp)}
                  className={`w-11 h-6 flex items-center rounded-full transition-colors ${data.gcClamp ? 'bg-brand-600' : 'bg-slate-300'}`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ml-1 ${data.gcClamp ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {!hasSequence && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-3 mt-4">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-xs text-yellow-800">
                    Enter a sequence (min 50bp) to start generating primers.
                  </p>
                </div>
              )}
              
              <button 
                onClick={handleDesignPrimers}
                disabled={!hasSequence || isLoading}
                className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Designing...
                  </>
                ) : (
                  'Design Primers'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrimerDesign;
