import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ToolId } from '../../types';
import { 
  MagnifyingGlassIcon, 
  DocumentTextIcon, 
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { api, NCBISearchResult, NCBIFetchResponse } from '../../services/api';
import PieChart from '../charts/PieChart';
import GCContentPlot from '../charts/GCContentPlot';

const NCBISearch: React.FC = () => {
  const { isAgentProcessing } = useApp();
  
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isFetching, setIsFetching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [searchResults, setSearchResults] = useState<NCBISearchResult[]>([]);
  const [fetchedSequence, setFetchedSequence] = useState<NCBIFetchResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setFetchedSequence(null);

    try {
      const response = await api.searchNCBI(query, maxResults);
      if (response.success) {
        setSearchResults(response.results);
        if (response.results.length === 0) {
          setError('No results found. Try a different search term.');
        }
      } else {
        setError(response.message || 'Search failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search NCBI');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFetch = async (accession: string) => {
    setIsFetching(accession);
    setError(null);

    try {
      const response = await api.fetchNCBISequence(accession);
      if (response.success) {
        setFetchedSequence(response);
      } else {
        setError(response.message || 'Failed to fetch sequence');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sequence');
    } finally {
      setIsFetching(null);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadFasta = () => {
    if (!fetchedSequence) return;
    
    const fastaContent = `>${fetchedSequence.accession} ${fetchedSequence.description}\n${fetchedSequence.sequence.match(/.{1,70}/g)?.join('\n')}`;
    const blob = new Blob([fastaContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fetchedSequence.accession}.fasta`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">NCBI Search</h2>
        <p className="text-slate-500">Search and fetch DNA sequences from NCBI GenBank/RefSeq databases.</p>
      </div>

      {/* Search Box */}
      <div className={`bg-white rounded-xl shadow-sm border p-6 mb-6 transition-colors duration-500 ${isAgentProcessing ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200'}`}>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Search Query</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Homo sapiens insulin mRNA, BRCA1, NM_000600..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-slate-700 mb-2">Max Results</label>
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value))}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <MagnifyingGlassIcon className="w-5 h-5 animate-pulse" />
                  Searching...
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Example queries */}
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <span>Try:</span>
          <button 
            onClick={() => setQuery('Homo sapiens insulin mRNA')}
            className="px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
          >
            Human insulin
          </button>
          <button 
            onClick={() => setQuery('GFP green fluorescent protein')}
            className="px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
          >
            GFP
          </button>
          <button 
            onClick={() => setQuery('pUC19 vector')}
            className="px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
          >
            pUC19 vector
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-slate-400" />
              Search Results ({searchResults.length})
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {searchResults.map((result) => (
                <div 
                  key={result.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    fetchedSequence?.accession === result.accession 
                      ? 'border-brand-400 bg-brand-50' 
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="font-medium text-brand-600 text-sm truncate">{result.accession}</div>
                      <div className="text-xs text-slate-600 mt-1 line-clamp-2 break-words">{result.title}</div>
                      <div className="text-xs text-slate-400 mt-1">{result.length.toLocaleString()} bp</div>
                    </div>
                    <button
                      onClick={() => handleFetch(result.accession)}
                      disabled={isFetching === result.accession}
                      className="px-3 py-1.5 bg-brand-600 text-white text-xs rounded-lg hover:bg-brand-500 transition-colors disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
                    >
                      {isFetching === result.accession ? (
                        'Fetching...'
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          Fetch
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fetched Sequence */}
        {fetchedSequence && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Fetched Sequence</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(fetchedSequence.sequence, 'seq')}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Copy sequence"
                >
                  {copiedField === 'seq' ? (
                    <CheckIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <ClipboardDocumentIcon className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={downloadFasta}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Download FASTA"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Accession</div>
                <div className="text-sm font-medium text-brand-600">{fetchedSequence.accession}</div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Description</div>
                <div className="text-sm text-slate-700 break-words">{fetchedSequence.description}</div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Length</div>
                <div className="text-sm text-slate-700">{fetchedSequence.length.toLocaleString()} bp</div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Sequence</div>
                <div className="bg-slate-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                  <pre className="font-mono text-xs text-slate-600 whitespace-pre-wrap break-all leading-relaxed">
                    {fetchedSequence.sequence}
                  </pre>
                </div>
              </div>
            </div>

            {/* Sequence Analysis Charts */}
            {fetchedSequence.sequence && fetchedSequence.sequence.length > 20 && (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nucleotide Composition */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <PieChart
                      title="Nucleotide Composition"
                      data={[
                        { label: 'Adenine (A)', value: (fetchedSequence.sequence.match(/A/gi) || []).length, color: '#22c55e' },
                        { label: 'Thymine (T)', value: (fetchedSequence.sequence.match(/T/gi) || []).length, color: '#ef4444' },
                        { label: 'Guanine (G)', value: (fetchedSequence.sequence.match(/G/gi) || []).length, color: '#3b82f6' },
                        { label: 'Cytosine (C)', value: (fetchedSequence.sequence.match(/C/gi) || []).length, color: '#f59e0b' },
                      ]}
                      size={160}
                    />
                  </div>

                  {/* GC Content Sliding Window */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <GCContentPlot
                      title="GC Content (Sliding Window)"
                      sequence={fetchedSequence.sequence}
                      windowSize={Math.min(50, Math.floor(fetchedSequence.sequence.length / 5))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {searchResults.length === 0 && !isSearching && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <MagnifyingGlassIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">Search NCBI Database</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Enter a gene name, organism, accession number, or any keyword to search 
            the NCBI nucleotide database (GenBank/RefSeq).
          </p>
        </div>
      )}
    </div>
  );
};

export default NCBISearch;
