import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ToolId } from '../types';
import { 
  BeakerIcon, 
  ScissorsIcon, 
  LinkIcon, 
  HomeIcon,
  MagnifyingGlassIcon,
  DocumentMagnifyingGlassIcon,
  ChevronDownIcon,
  CpuChipIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  ChartBarIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

interface SidebarTool {
  id: ToolId | string;
  name: string;
  icon: React.ComponentType<any>;
  available: boolean;
}

interface SidebarGroup {
  id: string;
  name: string;
  tools: SidebarTool[];
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    id: 'cloning',
    name: 'Cloning & Primers',
    tools: [
      { id: ToolId.PRIMER_DESIGN, name: 'Primer Design', icon: BeakerIcon, available: true },
      { id: ToolId.RESTRICTION_ANALYZER, name: 'Restriction Finder', icon: ScissorsIcon, available: true },
      { id: ToolId.GIBSON_ASSEMBLY, name: 'Gibson Assembly', icon: LinkIcon, available: true },
      { id: 'golden_gate', name: 'Golden Gate', icon: LinkIcon, available: false },
    ]
  },
  {
    id: 'search',
    name: 'Search & Discovery',
    tools: [
      { id: ToolId.NCBI_SEARCH, name: 'NCBI Search', icon: MagnifyingGlassIcon, available: true },
      { id: ToolId.PAPER_SEARCH, name: 'Paper Search', icon: DocumentMagnifyingGlassIcon, available: true },
      { id: 'uniprot', name: 'UniProt Search', icon: MagnifyingGlassIcon, available: false },
    ]
  },
  {
    id: 'sequence',
    name: 'Sequence Analysis',
    tools: [
      { id: 'seq_align', name: 'Sequence Alignment', icon: ArrowsRightLeftIcon, available: false },
      { id: 'orf_finder', name: 'ORF Finder', icon: ChartBarIcon, available: false },
      { id: 'codon_opt', name: 'Codon Optimization', icon: CpuChipIcon, available: false },
    ]
  },
  {
    id: 'genome',
    name: 'Genome Engineering',
    tools: [
      { id: 'crispr', name: 'CRISPR Guide Design', icon: SparklesIcon, available: false },
      { id: 'base_edit', name: 'Base Editor', icon: CpuChipIcon, available: false },
    ]
  },
  {
    id: 'protein',
    name: 'Protein Tools',
    tools: [
      { id: 'protein_props', name: 'Protein Properties', icon: ChartBarIcon, available: false },
      { id: 'structure', name: 'Structure Prediction', icon: CpuChipIcon, available: false },
    ]
  }
];

const Sidebar: React.FC = () => {
  const { activeTool, setActiveTool } = useApp();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['cloning', 'search']));

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isGroupActive = (group: SidebarGroup) => 
    group.tools.some(t => t.available && t.id === activeTool);

  return (
    <div className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-300 flex-shrink-0">
      <div className="p-5 flex-1 overflow-y-auto scrollbar-hide">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
            U
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">UniBio</h1>
        </div>

        <nav className="space-y-3">
          {/* Dashboard */}
          <button
            onClick={() => setActiveTool(ToolId.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTool === ToolId.DASHBOARD
                ? 'bg-brand-900/50 text-brand-100 border border-brand-800' 
                : 'hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            <HomeIcon className={`w-5 h-5 ${activeTool === ToolId.DASHBOARD ? 'text-brand-500' : 'text-slate-500'}`} />
            Dashboard
          </button>

          {/* Grouped sections */}
          {SIDEBAR_GROUPS.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            const groupActive = isGroupActive(group);
            const hasAvailable = group.tools.some(t => t.available);

            return (
              <div key={group.id}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${
                    groupActive ? 'text-brand-400' : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <span>{group.name}</span>
                  <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Group tools */}
                <div className={`space-y-0.5 overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-[400px] mt-1' : 'max-h-0'}`}>
                  {group.tools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = tool.available && activeTool === tool.id;
                    
                    if (tool.available) {
                      return (
                        <button
                          key={tool.id}
                          onClick={() => setActiveTool(tool.id as ToolId)}
                          className={`w-full flex items-center gap-3 pl-5 pr-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                            isActive 
                              ? 'bg-brand-900/50 text-brand-100 border border-brand-800' 
                              : 'hover:bg-slate-800 hover:text-white border border-transparent'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-brand-500' : 'text-slate-500'}`} />
                          <span className="truncate">{tool.name}</span>
                        </button>
                      );
                    }

                    // Coming soon tool
                    return (
                      <div
                        key={tool.id}
                        className="flex items-center gap-3 pl-5 pr-3 py-2 text-sm rounded-md border border-transparent opacity-45 cursor-default"
                      >
                        <Icon className="w-4 h-4 text-slate-600" />
                        <span className="truncate text-slate-500">{tool.name}</span>
                        <LockClosedIcon className="w-3 h-3 text-slate-600 ml-auto flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-medium">
            DS
          </div>
          <div className="text-xs">
            <div className="font-medium text-white">Dr. Scientist</div>
            <div className="text-slate-500">Pro Plan</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
