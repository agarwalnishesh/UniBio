import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ToolId, GibsonData } from '../../types';
import { LinkIcon, BeakerIcon, ExclamationTriangleIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { api, GibsonAssemblyResponse } from '../../services/api';

const GibsonAssembly: React.FC = () => {
  const { toolState, updateToolData, isAgentProcessing } = useApp();
  const data = toolState[ToolId.GIBSON_ASSEMBLY] as GibsonData;
  
  const [vectorSeq, setVectorSeq] = useState('');
  const [insertSeq, setInsertSeq] = useState('');
  const [overlapLength, setOverlapLength] = useState(25);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GibsonAssemblyResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleDesignPrimers = async () => {
    if (!vectorSeq || vectorSeq.length < 20) {
      setError('Vector sequence must be at least 20 base pairs');
      return;
    }
    if (!insertSeq || insertSeq.length < 20) {
      setError('Insert sequence must be at least 20 base pairs');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.designGibsonPrimers({
        vector_seq: vectorSeq,
        insert_seq: insertSeq,
        overlap_length: overlapLength,
      });
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to design Gibson assembly primers');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasInput = vectorSeq.length >= 20 && insertSeq.length >= 20;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Gibson Assembly</h2>
        <p className="text-slate-500">Design primers with homology overhangs for seamless DNA assembly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vector Sequence */}
          <div className={`bg-white rounded-xl shadow-sm border p-6 transition-colors duration-500 ${isAgentProcessing ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Vector Sequence</h3>
              <span className="text-xs text-slate-400">Linearized at insertion site</span>
            </div>
            <textarea 
              value={vectorSeq}
              onChange={(e) => {
                setVectorSeq(e.target.value.toUpperCase().replace(/[^ATGCNRYSWKMBDHV]/gi, ''));
                setResult(null);
                setError(null);
              }}
              placeholder="Paste linearized vector sequence (5' -> 3')..."
              className="w-full h-32 p-4 font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none leading-relaxed text-slate-700 tracking-wide"
              spellCheck={false}
            />
            <div className="mt-2 text-xs text-slate-400">
              Length: {vectorSeq.length} bp
            </div>
          </div>

          {/* Insert Sequence */}
          <div className={`bg-white rounded-xl shadow-sm border p-6 transition-colors duration-500 ${isAgentProcessing ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Insert Sequence</h3>
              <span className="text-xs text-slate-400">Gene/fragment to clone</span>
            </div>
            <textarea 
              value={insertSeq}
              onChange={(e) => {
                setInsertSeq(e.target.value.toUpperCase().replace(/[^ATGCNRYSWKMBDHV]/gi, ''));
                setResult(null);
                setError(null);
              }}
              placeholder="Paste insert sequence (5' -> 3')..."
              className="w-full h-32 p-4 font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none leading-relaxed text-slate-700 tracking-wide"
              spellCheck={false}
            />
            <div className="mt-2 text-xs text-slate-400">
              Length: {insertSeq.length} bp
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
          {result && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <BeakerIcon className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-slate-800">Designed Primers</h3>
              </div>

              <div className="space-y-6">
                {/* Forward Primer */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-sm font-semibold text-slate-800">Forward Primer</span>
                      <span className="text-xs text-slate-500 ml-2">{result.forward_primer.length} bp</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(result.forward_primer, 'fwd')}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {copiedField === 'fwd' ? (
                        <CheckIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <ClipboardDocumentIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-sm break-all">
                    <span className="text-brand-600">{result.vector_overlap_fwd}</span>
                    <span className="text-slate-700">{result.insert_binding_fwd}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    <span className="text-brand-600">■</span> Vector homology ({result.overlap_length}bp) + 
                    <span className="text-slate-700"> ■</span> Insert binding
                  </div>
                </div>

                {/* Reverse Primer */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-sm font-semibold text-slate-800">Reverse Primer</span>
                      <span className="text-xs text-slate-500 ml-2">{result.reverse_primer.length} bp</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(result.reverse_primer, 'rev')}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {copiedField === 'rev' ? (
                        <CheckIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <ClipboardDocumentIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-sm break-all">
                    <span className="text-brand-600">{result.vector_overlap_rev}</span>
                    <span className="text-slate-700">{result.insert_binding_rev}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    <span className="text-brand-600">■</span> Vector homology ({result.overlap_length}bp) + 
                    <span className="text-slate-700"> ■</span> Insert binding
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Protocol tip:</strong> Use these primers to PCR amplify your insert, 
                  then assemble with linearized vector using Gibson Assembly Master Mix (50°C, 15-60 min).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Parameters */}
        <div className="space-y-6">
          <div className={`bg-white rounded-xl shadow-sm border p-6 transition-colors duration-500 ${isAgentProcessing ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200'}`}>
            <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-slate-400" />
              Parameters
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Overlap Length (bp)</label>
                  <span className="text-sm font-mono text-brand-600 bg-brand-50 px-2 rounded">{overlapLength}</span>
                </div>
                <input 
                  type="range" 
                  min="15" 
                  max="40" 
                  value={overlapLength}
                  onChange={(e) => {
                    setOverlapLength(parseInt(e.target.value));
                    setResult(null);
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>15bp</span>
                  <span>40bp</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Recommended: 20-30bp for standard assembly
                </p>
              </div>

              {!hasInput && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-xs text-yellow-800">
                    Enter both vector and insert sequences (min 20bp each).
                  </p>
                </div>
              )}
              
              <button 
                onClick={handleDesignPrimers}
                disabled={!hasInput || isLoading}
                className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <LinkIcon className="w-4 h-4 animate-pulse" />
                    Designing...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    Design Gibson Primers
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-xl p-6 border border-brand-200">
            <h4 className="font-semibold text-brand-900 mb-3">About Gibson Assembly</h4>
            <ul className="text-sm text-brand-800 space-y-2">
              <li>• Seamless, scarless DNA assembly</li>
              <li>• Multiple fragments in one reaction</li>
              <li>• No restriction sites required</li>
              <li>• Isothermal (50°C) reaction</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GibsonAssembly;
