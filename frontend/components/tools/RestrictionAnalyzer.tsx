import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ToolId, RestrictionData } from '../../types';
import { ScissorsIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { api, RestrictionEnzyme } from '../../services/api';
import BarChart from '../charts/BarChart';
import RestrictionMap from '../charts/RestrictionMap';

const RestrictionAnalyzer: React.FC = () => {
  const { toolState, updateToolData, isAgentProcessing } = useApp();
  const data = toolState[ToolId.RESTRICTION_ANALYZER] as RestrictionData;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RestrictionEnzyme[]>([]);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handleChange = (field: keyof RestrictionData, value: any) => {
    updateToolData(ToolId.RESTRICTION_ANALYZER, { [field]: value });
    setResults([]);
    setResultMessage(null);
    setError(null);
  };

  const handleFindSites = async () => {
    if (!data.sequence || data.sequence.length < 6) {
      setError('Sequence must be at least 6 base pairs');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await api.findRestrictionSites(data.sequence);
      setResults(response.enzymes);
      setResultMessage(response.message || `Found ${response.total_enzymes_found} enzyme(s)`);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze restriction sites');
    } finally {
      setIsLoading(false);
    }
  };

  const hasSequence = data.sequence.length >= 6;
  const gcContent = data.sequence ? 
    ((data.sequence.match(/[GC]/gi)?.length || 0) / data.sequence.length * 100).toFixed(1) : '0';

  // Group enzymes by cut count for visualization
  const singleCutters = results.filter(e => e.cut_count === 1);
  const multiCutters = results.filter(e => e.cut_count > 1);
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Restriction Site Finder</h2>
        <p className="text-slate-500">Identify restriction enzyme cut sites in your DNA sequence.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input & Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`bg-white rounded-xl shadow-sm border p-6 transition-colors duration-500 ${isAgentProcessing ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">DNA Sequence</h3>
              <span className="text-xs font-mono text-slate-400">FASTA / Raw</span>
            </div>
            <textarea 
              value={data.sequence}
              onChange={(e) => handleChange('sequence', e.target.value.toUpperCase().replace(/[^ATGCNRYSWKMBDHV]/gi, ''))}
              placeholder="Paste DNA sequence here..."
              className="w-full h-40 p-4 font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none leading-relaxed text-slate-700 tracking-wide"
              spellCheck={false}
            />
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>Length: {data.sequence.length} bp</span>
              <span>GC: {gcContent}%</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-6">
              {/* Single Cutters - Most useful for cloning */}
              {singleCutters.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <h3 className="font-semibold text-slate-800">Single Cutters ({singleCutters.length})</h3>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Ideal for cloning</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {singleCutters.map((enzyme) => (
                      <div key={enzyme.enzyme_name} className="bg-slate-50 rounded-lg p-3 border border-slate-100 overflow-hidden">
                        <div className="font-medium text-slate-800 truncate">{enzyme.enzyme_name}</div>
                        <div className="text-xs text-slate-500 mt-1 truncate" title={`Position: ${enzyme.cut_positions.join(', ')}`}>
                          Position: {enzyme.cut_positions.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi Cutters */}
              {multiCutters.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <h3 className="font-semibold text-slate-800">Multiple Cutters ({multiCutters.length})</h3>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Enzyme</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cuts</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Positions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200 text-sm">
                        {multiCutters.slice(0, 10).map((enzyme) => (
                          <tr key={enzyme.enzyme_name}>
                            <td className="px-4 py-3 font-medium text-slate-800">{enzyme.enzyme_name}</td>
                            <td className="px-4 py-3 text-slate-600">{enzyme.cut_count}</td>
                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                              {enzyme.cut_positions.slice(0, 5).join(', ')}
                              {enzyme.cut_positions.length > 5 && '...'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {multiCutters.length > 10 && (
                      <div className="p-3 bg-slate-50 text-center text-xs text-slate-500">
                        And {multiCutters.length - 10} more enzymes...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Charts */}
              {results.length > 0 && (
                <div className="space-y-6">
                  {/* Restriction Map */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <RestrictionMap
                      title="Restriction Map"
                      sequenceLength={data.sequence.length}
                      sites={results.slice(0, 12).map(e => ({
                        enzyme: e.enzyme_name,
                        positions: e.cut_positions
                      }))}
                    />
                  </div>

                  {/* Cut Frequency Chart */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <BarChart
                      title="Cut Frequency by Enzyme"
                      yLabel="Number of Cuts"
                      data={results.slice(0, 10).map((e, i) => ({
                        label: e.enzyme_name,
                        value: e.cut_count,
                        color: e.cut_count === 1 ? '#22c55e' : '#f59e0b'
                      }))}
                    />
                  </div>
                </div>
              )}

              {results.length === 0 && resultMessage && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  {resultMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Controls */}
        <div className="space-y-6">
          <div className={`bg-white rounded-xl shadow-sm border p-6 transition-colors duration-500 ${isAgentProcessing ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200'}`}>
            <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <ScissorsIcon className="w-4 h-4 text-slate-400" />
              Options
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <label className="text-sm font-medium text-slate-700">Circular DNA</label>
                <button 
                  onClick={() => handleChange('circular', !data.circular)}
                  className={`w-11 h-6 flex items-center rounded-full transition-colors ${data.circular ? 'bg-brand-600' : 'bg-slate-300'}`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ml-1 ${data.circular ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {!hasSequence && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-xs text-yellow-800">
                    Enter a sequence to find restriction sites.
                  </p>
                </div>
              )}
              
              <button 
                onClick={handleFindSites}
                disabled={!hasSequence || isLoading}
                className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <MagnifyingGlassIcon className="w-4 h-4 animate-pulse" />
                    Searching...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-4 h-4" />
                    Find Sites
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          {results.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Enzymes</span>
                  <span className="font-medium text-slate-900">{results.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Single Cutters</span>
                  <span className="font-medium text-green-600">{singleCutters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Multi Cutters</span>
                  <span className="font-medium text-amber-600">{multiCutters.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestrictionAnalyzer;
