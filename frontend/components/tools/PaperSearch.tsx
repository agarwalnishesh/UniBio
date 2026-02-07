import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ToolId, PaperSearchData } from '../../types';
import {
  ArrowPathIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AcademicCapIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { api, PaperSearchResult, PaperDetailResponse } from '../../services/api';

const PaperSearch: React.FC = () => {
  const { toolState, updateToolData, isAgentProcessing } = useApp();
  const data = toolState[ToolId.PAPER_SEARCH] as PaperSearchData;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PaperSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Expanded paper details
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null);
  const [paperDetails, setPaperDetails] = useState<Record<string, PaperDetailResponse>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  const handleChange = (field: keyof PaperSearchData, value: any) => {
    updateToolData(ToolId.PAPER_SEARCH, { [field]: value });
    setError(null);
  };

  const handleSearch = async () => {
    if (!data.query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setTotalCount(null);
    setResultMessage(null);
    setExpandedPaper(null);
    setPaperDetails({});

    try {
      const response = await api.searchPapers(
        data.query,
        data.maxResults,
        data.sort
      );

      if (response.success) {
        setResults(response.results);
        setTotalCount(response.total_count ?? null);
        setResultMessage(
          response.message || `Found ${response.results.length} paper(s)`
        );
      } else {
        setError(response.message || 'No papers found. Try a different search query.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search papers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandPaper = async (pmid: string) => {
    if (expandedPaper === pmid) {
      setExpandedPaper(null);
      return;
    }

    setExpandedPaper(pmid);

    // Fetch details if not already cached
    if (!paperDetails[pmid]) {
      setLoadingDetail(pmid);
      try {
        const detail = await api.fetchPaperDetails(pmid);
        if (detail.success) {
          setPaperDetails((prev) => ({ ...prev, [pmid]: detail }));
        }
      } catch (err) {
        console.error('Failed to fetch paper details:', err);
      } finally {
        setLoadingDetail(null);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const hasQuery = data.query.trim().length > 0;

  // Suggested searches
  const suggestions = [
    'CRISPR cas9 gene editing',
    'PCR primer design optimization',
    'Gibson assembly cloning',
    'mRNA vaccine technology',
    'gene therapy delivery systems',
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Research Paper Finder
        </h2>
        <p className="text-slate-500">
          Search PubMed for scientific literature across biomedical and life
          sciences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Search & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search Input */}
          <div
            className={`bg-white rounded-xl shadow-sm border p-6 transition-colors duration-500 ${
              isAgentProcessing
                ? 'border-brand-400 ring-2 ring-brand-100'
                : 'border-slate-200'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
                Search PubMed
              </h3>
              {totalCount !== null && (
                <span className="text-xs text-slate-400">
                  {totalCount.toLocaleString()} total results
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={data.query}
                onChange={(e) => handleChange('query', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='e.g., "CRISPR gene editing", "PCR optimization", "restriction enzyme cloning"'
                className="w-full p-4 pr-12 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm text-slate-700 placeholder:text-slate-400"
              />
              <button
                onClick={handleSearch}
                disabled={!hasQuery || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <MagnifyingGlassIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Suggestion Chips */}
            {results.length === 0 && !isLoading && (
              <div className="mt-4">
                <p className="text-xs text-slate-400 mb-2">Try searching for:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        handleChange('query', s);
                      }}
                      className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 rounded-full whitespace-nowrap transition-colors border border-transparent hover:border-brand-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <BookOpenIcon className="w-5 h-5 text-brand-600" />
                  Results
                </h3>
                {resultMessage && (
                  <span className="text-sm text-green-600">{resultMessage}</span>
                )}
              </div>

              {results.map((paper, idx) => {
                const isExpanded = expandedPaper === paper.pmid;
                const detail = paperDetails[paper.pmid];
                const isDetailLoading = loadingDetail === paper.pmid;

                return (
                  <div
                    key={paper.pmid}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-brand-300 transition-colors"
                  >
                    {/* Paper Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                            <span className="text-xs text-slate-400">
                              PMID: {paper.pmid}
                            </span>
                            {paper.year && (
                              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                {paper.year}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-slate-800 leading-snug mb-2">
                            {paper.title}
                          </h4>
                          <p className="text-xs text-slate-500 mb-1">
                            {paper.authors}
                          </p>
                          {paper.journal && (
                            <p className="text-xs text-brand-600 font-medium">
                              {paper.journal}
                            </p>
                          )}
                        </div>
                        <a
                          href={paper.pubmed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Open in PubMed"
                        >
                          <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                        </a>
                      </div>

                      {/* Abstract Preview */}
                      {paper.abstract_preview && !isExpanded && (
                        <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                          {paper.abstract_preview}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => handleExpandPaper(paper.pmid)}
                          className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUpIcon className="w-4 h-4" />
                              Collapse
                            </>
                          ) : (
                            <>
                              <ChevronDownIcon className="w-4 h-4" />
                              Full Abstract
                            </>
                          )}
                        </button>
                        {paper.doi && (
                          <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1"
                          >
                            <DocumentTextIcon className="w-4 h-4" />
                            DOI
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50 p-5">
                        {isDetailLoading ? (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            Loading full details...
                          </div>
                        ) : detail ? (
                          <div className="space-y-4">
                            {/* Full Abstract */}
                            <div>
                              <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                Abstract
                              </h5>
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {detail.abstract}
                              </p>
                            </div>

                            {/* Keywords */}
                            {detail.keywords && detail.keywords.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                  Keywords
                                </h5>
                                <div className="flex flex-wrap gap-1.5">
                                  {detail.keywords.map((kw, i) => (
                                    <span
                                      key={i}
                                      className="text-xs px-2 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-100"
                                    >
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* MeSH Terms */}
                            {detail.mesh_terms && detail.mesh_terms.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                  MeSH Terms
                                </h5>
                                <div className="flex flex-wrap gap-1.5">
                                  {detail.mesh_terms.slice(0, 10).map((term, i) => (
                                    <span
                                      key={i}
                                      className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full"
                                    >
                                      {term}
                                    </span>
                                  ))}
                                  {detail.mesh_terms.length > 10 && (
                                    <span className="text-xs px-2 py-1 text-slate-400">
                                      +{detail.mesh_terms.length - 10} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Full Author List */}
                            <div>
                              <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                Authors
                              </h5>
                              <p className="text-xs text-slate-600">
                                {detail.authors}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">
                            {paper.abstract_preview || 'No abstract available.'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && results.length === 0 && !error && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <AcademicCapIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Search the Scientific Literature
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Enter a search query above to find research papers from PubMed,
                the world's largest biomedical literature database with over 36
                million citations.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Parameters & Info */}
        <div className="space-y-6">
          <div
            className={`bg-white rounded-xl shadow-sm border p-6 transition-colors duration-500 ${
              isAgentProcessing
                ? 'border-brand-400 ring-2 ring-brand-100'
                : 'border-slate-200'
            }`}
          >
            <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <ArrowPathIcon className="w-4 h-4 text-slate-400" />
              Search Options
            </h3>

            <div className="space-y-5">
              {/* Max Results */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    Max Results
                  </label>
                  <span className="text-sm font-mono text-brand-600 bg-brand-50 px-2 rounded">
                    {data.maxResults}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={data.maxResults}
                  onChange={(e) =>
                    handleChange('maxResults', parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>1</span>
                  <span>50</span>
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sort By
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'relevance', label: 'Most Relevant' },
                    { value: 'pub_date', label: 'Newest First' },
                    { value: 'first_author', label: 'First Author' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        data.sort === option.value
                          ? 'border-brand-300 bg-brand-50 text-brand-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="sort"
                        value={option.value}
                        checked={data.sort === option.value}
                        onChange={(e) => handleChange('sort', e.target.value)}
                        className="accent-brand-600"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={!hasQuery || isLoading}
                className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-4 h-4" />
                    Search Papers
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search Tips */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">
              Search Tips
            </h3>
            <ul className="space-y-2 text-xs text-slate-500">
              <li className="flex items-start gap-2">
                <span className="text-brand-500 mt-0.5">*</span>
                Use quotes for exact phrases: "gene therapy"
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-500 mt-0.5">*</span>
                Combine terms with AND/OR: CRISPR AND delivery
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-500 mt-0.5">*</span>
                Filter by author: Smith J[Author]
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-500 mt-0.5">*</span>
                Filter by journal: Nature[Journal]
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-500 mt-0.5">*</span>
                Date range: 2023:2026[dp]
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperSearch;
