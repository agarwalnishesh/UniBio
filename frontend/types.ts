/**
 * UniBio Types - Matching Backend API
 * 
 * Available tools (matching backend endpoints):
 * 1. Primer Design: Design PCR primers with Primer3
 * 2. Restriction Analyzer: Find restriction enzyme cut sites
 * 3. Gibson Assembly: Design primers for Gibson assembly cloning
 */

export enum ToolId {
  DASHBOARD = 'dashboard',
  PRIMER_DESIGN = 'primer_design',
  RESTRICTION_ANALYZER = 'restriction_analyzer',
  GIBSON_ASSEMBLY = 'gibson_assembly',
  NCBI_SEARCH = 'ncbi_search',
  PAPER_SEARCH = 'paper_search'
}

// -- Form Data Types --

export interface PrimerDesignData {
  sequence: string;
  optimalTm: number;
  gcClamp: boolean;
  productSizeMin: number;
  productSizeMax: number;
  saltConcentration: number;
}

export interface RestrictionData {
  sequence: string;
  enzymeSet: 'common' | 'all' | 'commercial';
  circular: boolean;
}

export interface GibsonData {
  fragments: Array<{ id: string; sequence: string; name: string }>;
  minOverlap: number;
}

export interface NCBISearchData {
  query: string;
  maxResults: number;
}

export interface PaperSearchData {
  query: string;
  maxResults: number;
  sort: 'relevance' | 'pub_date' | 'first_author';
}

// Union type for all tool data
export type ToolData = PrimerDesignData | RestrictionData | GibsonData | NCBISearchData | PaperSearchData | Record<string, any>;

// -- Agent & Chat Types --

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isToolCall?: boolean;
  toolName?: string;
}

export interface ToolDefinition {
  id: ToolId;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  defaultData: ToolData;
}
