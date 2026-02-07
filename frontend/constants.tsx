import { ToolId, ToolDefinition, PrimerDesignData } from './types';
import { 
  BeakerIcon, 
  ScissorsIcon, 
  LinkIcon, 
  HomeIcon,
  MagnifyingGlassIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export const DEFAULT_PRIMER_DATA: PrimerDesignData = {
  sequence: "",
  optimalTm: 60,
  gcClamp: true,
  productSizeMin: 100,
  productSizeMax: 1000,
  saltConcentration: 50
};

export const TOOLS: Record<ToolId, ToolDefinition> = {
  [ToolId.DASHBOARD]: {
    id: ToolId.DASHBOARD,
    name: "Dashboard",
    description: "Overview of your projects and recent analysis.",
    icon: HomeIcon,
    defaultData: {}
  },
  [ToolId.PRIMER_DESIGN]: {
    id: ToolId.PRIMER_DESIGN,
    name: "Primer Design",
    description: "Generate optimal PCR primer pairs with Tm and GC calculation.",
    icon: BeakerIcon,
    defaultData: DEFAULT_PRIMER_DATA
  },
  [ToolId.RESTRICTION_ANALYZER]: {
    id: ToolId.RESTRICTION_ANALYZER,
    name: "Restriction Finder",
    description: "Identify restriction enzyme cut sites in your sequence.",
    icon: ScissorsIcon,
    defaultData: { sequence: "", enzymeSet: 'common', circular: false }
  },
  [ToolId.GIBSON_ASSEMBLY]: {
    id: ToolId.GIBSON_ASSEMBLY,
    name: "Gibson Assembly",
    description: "Design overlaps for isothermal assembly of fragments.",
    icon: LinkIcon,
    defaultData: { fragments: [], minOverlap: 20 }
  },
  [ToolId.NCBI_SEARCH]: {
    id: ToolId.NCBI_SEARCH,
    name: "NCBI Search",
    description: "Search and fetch sequences from NCBI GenBank database.",
    icon: MagnifyingGlassIcon,
    defaultData: { query: "", maxResults: 10 }
  },
  [ToolId.PAPER_SEARCH]: {
    id: ToolId.PAPER_SEARCH,
    name: "Paper Search",
    description: "Find research papers on PubMed for any biomedical topic.",
    icon: DocumentMagnifyingGlassIcon,
    defaultData: { query: "", maxResults: 10, sort: "relevance" }
  }
};

export const AGENT_SYSTEM_INSTRUCTION = `
You are the UniBio Agent, an expert biotech assistant.
Your goal is to help scientists with molecular biology tasks using available tools.

Available Backend Tools:
- design_primers: Design PCR primers for DNA amplification
- analyze_primer: Analyze a primer for Tm, hairpin, and dimer formation
- check_primer_compatibility: Check if two primers will form dimers
- check_specificity: Check if a primer binds specifically to a template
- find_restriction_sites: Find restriction enzyme cut sites in DNA
- design_gibson_primers: Design primers for Gibson assembly cloning
- search_ncbi_nucleotide: Search NCBI database for sequences
- fetch_ncbi_sequence: Fetch a sequence from NCBI by accession ID
- search_research_papers: Search PubMed for scientific papers and publications
- fetch_paper_details: Fetch full details of a paper by PubMed ID

Be concise, scientific, and helpful. When users provide sequences, use the appropriate tools to analyze them.
When users ask about research papers, literature, or studies, use search_research_papers to find relevant publications.
`;
