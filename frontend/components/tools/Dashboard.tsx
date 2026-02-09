import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ToolId } from '../../types';
import { api } from '../../services/api';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowRightIcon, 
  ChevronDownIcon,
  BeakerIcon,
  ScissorsIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  DocumentMagnifyingGlassIcon,
  CpuChipIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  ChartBarIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

// Types for dashboard categories
interface ToolItem {
  id: ToolId | string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  available: boolean;
}

interface ToolCategory {
  id: string;
  name: string;
  description: string;
  color: string;        // tailwind color name for accent
  bgGradient: string;   // gradient for header
  icon: React.ComponentType<any>;
  tools: ToolItem[];
}

const CATEGORIES: ToolCategory[] = [
  {
    id: 'cloning',
    name: 'Cloning & Primer Design',
    description: 'Design primers, plan cloning strategies, and analyze restriction sites.',
    color: 'brand',
    bgGradient: 'from-teal-600 to-emerald-700',
    icon: BeakerIcon,
    tools: [
      { id: ToolId.PRIMER_DESIGN, name: 'Primer Design', description: 'Generate optimal PCR primer pairs with Tm, GC%, and quality scoring.', icon: BeakerIcon, available: true },
      { id: ToolId.RESTRICTION_ANALYZER, name: 'Restriction Finder', description: 'Scan DNA for restriction enzyme cut sites with visual maps.', icon: ScissorsIcon, available: true },
      { id: ToolId.GIBSON_ASSEMBLY, name: 'Gibson Assembly', description: 'Design overlap primers for seamless isothermal assembly.', icon: LinkIcon, available: true },
      { id: 'golden_gate', name: 'Golden Gate Assembly', description: 'Plan Type IIS restriction enzyme-based modular cloning.', icon: LinkIcon, available: false },
    ]
  },
  {
    id: 'search',
    name: 'Search & Discovery',
    description: 'Search biological databases and scientific literature.',
    color: 'blue',
    bgGradient: 'from-blue-600 to-indigo-700',
    icon: MagnifyingGlassIcon,
    tools: [
      { id: ToolId.NCBI_SEARCH, name: 'NCBI Search', description: 'Search and fetch sequences from GenBank/RefSeq with composition analysis.', icon: MagnifyingGlassIcon, available: true },
      { id: ToolId.PAPER_SEARCH, name: 'Paper Search', description: 'Find research papers on PubMed for any biomedical topic.', icon: DocumentMagnifyingGlassIcon, available: true },
      { id: 'uniprot_search', name: 'UniProt Search', description: 'Search protein sequences, structures, and functional annotations.', icon: MagnifyingGlassIcon, available: false },
    ]
  },
  {
    id: 'sequence',
    name: 'Sequence Analysis',
    description: 'Analyze, align, and annotate DNA and protein sequences.',
    color: 'purple',
    bgGradient: 'from-purple-600 to-violet-700',
    icon: ChartBarIcon,
    tools: [
      { id: 'sequence_align', name: 'Sequence Alignment', description: 'Pairwise and multiple sequence alignment with BLAST integration.', icon: ArrowsRightLeftIcon, available: false },
      { id: 'orf_finder', name: 'ORF Finder', description: 'Identify open reading frames and predict coding sequences.', icon: ChartBarIcon, available: false },
      { id: 'codon_opt', name: 'Codon Optimization', description: 'Optimize codon usage for expression in specific host organisms.', icon: CpuChipIcon, available: false },
    ]
  },
  {
    id: 'genome',
    name: 'Genome Engineering',
    description: 'Design guides for CRISPR and other genome editing technologies.',
    color: 'amber',
    bgGradient: 'from-amber-500 to-orange-600',
    icon: SparklesIcon,
    tools: [
      { id: 'crispr_design', name: 'CRISPR Guide Design', description: 'Design sgRNAs with on/off-target scoring for Cas9 and Cas12.', icon: SparklesIcon, available: false },
      { id: 'base_editing', name: 'Base Editor Designer', description: 'Plan precise base editing experiments with ABE/CBE systems.', icon: CpuChipIcon, available: false },
    ]
  },
  {
    id: 'protein',
    name: 'Protein Tools',
    description: 'Analyze protein properties, predict structures, and design mutations.',
    color: 'rose',
    bgGradient: 'from-rose-500 to-pink-600',
    icon: CpuChipIcon,
    tools: [
      { id: 'protein_props', name: 'Protein Properties', description: 'Calculate molecular weight, pI, extinction coefficient, and more.', icon: ChartBarIcon, available: false },
      { id: 'structure_pred', name: 'Structure Prediction', description: 'Predict 3D protein structure from amino acid sequence.', icon: CpuChipIcon, available: false },
    ]
  }
];

// Accordion card for each category
const CategoryCard: React.FC<{ 
  category: ToolCategory; 
  isOpen: boolean; 
  onToggle: () => void;
  onToolClick: (toolId: ToolId) => void;
}> = ({ category, isOpen, onToggle, onToolClick }) => {
  const Icon = category.icon;
  const availableCount = category.tools.filter(t => t.available).length;
  const totalCount = category.tools.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Category Header - Clickable */}
      <button 
        onClick={onToggle}
        className="w-full text-left"
      >
        <div className={`bg-gradient-to-r ${category.bgGradient} p-5 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{category.name}</h3>
              <p className="text-white/70 text-sm mt-0.5">{category.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-xs bg-white/15 px-3 py-1 rounded-full">
              {availableCount}/{totalCount} active
            </span>
            <ChevronDownIcon className={`w-5 h-5 text-white/80 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {/* Expandable Content */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {category.tools.map((tool) => {
            const ToolIcon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => tool.available && onToolClick(tool.id as ToolId)}
                disabled={!tool.available}
                className={`group relative p-4 rounded-xl text-left transition-all duration-200 ${
                  tool.available 
                    ? 'bg-slate-50 border border-slate-200 hover:border-brand-400 hover:bg-brand-50/50 hover:shadow-sm cursor-pointer' 
                    : 'bg-slate-50/50 border border-dashed border-slate-200 cursor-default'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    tool.available 
                      ? 'bg-brand-100 group-hover:bg-brand-200' 
                      : 'bg-slate-100'
                  }`}>
                    <ToolIcon className={`w-5 h-5 ${tool.available ? 'text-brand-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${tool.available ? 'text-slate-800' : 'text-slate-400'}`}>
                        {tool.name}
                      </span>
                      {!tool.available && (
                        <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-500 rounded-full font-medium uppercase tracking-wider">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${tool.available ? 'text-slate-500' : 'text-slate-400'}`}>
                      {tool.description}
                    </p>
                  </div>
                  {tool.available && (
                    <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all mt-1 flex-shrink-0" />
                  )}
                  {!tool.available && (
                    <LockClosedIcon className="w-4 h-4 text-slate-300 mt-1 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard
const Dashboard: React.FC = () => {
  const { setActiveTool } = useApp();
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['cloning', 'search']));

  useEffect(() => {
    checkServer();
  }, []);

  const checkServer = async () => {
    setServerStatus('checking');
    try {
      await api.healthCheck();
      setServerStatus('online');
    } catch {
      setServerStatus('offline');
    }
  };

  const toggleCategory = (id: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalAvailable = CATEGORIES.reduce((sum, c) => sum + c.tools.filter(t => t.available).length, 0);
  const totalTools = CATEGORIES.reduce((sum, c) => sum + c.tools.length, 0);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center pt-8 pb-10">
        <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 mb-6">
          <svg className="w-12 h-12 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Welcome to UniBio</h2>
        <p className="text-base text-slate-500 max-w-xl mx-auto mb-6">
          Your intelligent workbench for molecular biology. {totalAvailable} tools ready, {totalTools - totalAvailable} more on the way.
        </p>

        {/* Status Row */}
        <div className="flex items-center justify-center gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-sm">
            {serverStatus === 'checking' && (
              <>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                <span className="text-slate-600">Checking server...</span>
              </>
            )}
            {serverStatus === 'online' && (
              <>
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-green-700">Backend connected</span>
              </>
            )}
            {serverStatus === 'offline' && (
              <>
                <XCircleIcon className="w-5 h-5 text-red-500" />
                <span className="text-red-700">Backend offline</span>
                <button onClick={checkServer} className="text-brand-600 hover:underline ml-1">Retry</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Category Accordions */}
      <div className="space-y-4 pb-8">
        {CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            isOpen={openCategories.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
            onToolClick={setActiveTool}
          />
        ))}
      </div>

      {/* Quick Start Guide */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white mb-8">
        <h3 className="text-xl font-semibold mb-4">Quick Start Guide</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-brand-400 mb-2">Using the Tools</h4>
            <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
              <li>Expand a category above or use the sidebar</li>
              <li>Click on any active tool to open it</li>
              <li>Enter your DNA sequence and parameters</li>
              <li>View results with interactive charts</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium text-brand-400 mb-2">Using the AI Assistant</h4>
            <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
              <li>Use the chat panel on the right</li>
              <li>Ask in plain English (e.g., "Design primers for human insulin")</li>
              <li>The AI runs tools and shows charts automatically</li>
              <li>Ask follow-up questions to refine results</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Offline Warning */}
      {serverStatus === 'offline' && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Backend Server Not Running</h4>
          <p className="text-sm text-red-700 mb-3">
            The UniBio backend server is not responding. Please start it to use the tools.
          </p>
          <div className="bg-red-100 rounded p-3 font-mono text-sm text-red-800">
            cd UniBio<br/>
            python main.py
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
