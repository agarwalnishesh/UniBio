/**
 * API Service for UniBio Backend Communication
 * Handles all HTTP requests to the FastAPI backend
 */

const API_BASE_URL = 'http://localhost:8000';

// Types matching backend models
export interface PrimerPair {
  pair_id: number;
  left_sequence: string;
  right_sequence: string;
  left_tm: number;
  right_tm: number;
  left_gc: number;
  right_gc: number;
  product_size: number;
  penalty: number;
}

export interface PrimerDesignResponse {
  success: boolean;
  primer_pairs: PrimerPair[];
  raw_output?: Record<string, any>;
  message?: string;
}

export interface PrimerAnalysisResponse {
  sequence: string;
  tm: number;
  hairpin_tm: number;
  homodimer_tm: number;
  warnings: string[];
}

export interface PrimerCompatibilityResponse {
  has_dimer_risk: boolean;
  dimer_tm: number;
  recommendation: string;
}

export interface SpecificityCheckResponse {
  is_specific: boolean;
  count: number;
  warning?: string;
  recommendation: string;
}

export interface RestrictionEnzyme {
  enzyme_name: string;
  cut_count: number;
  cut_positions: number[];
}

export interface RestrictionSiteResponse {
  total_enzymes_found: number;
  enzymes: RestrictionEnzyme[];
  message?: string;
}

export interface GibsonAssemblyResponse {
  forward_primer: string;
  reverse_primer: string;
  overlap_length: number;
  vector_overlap_fwd: string;
  vector_overlap_rev: string;
  insert_binding_fwd: string;
  insert_binding_rev: string;
  message?: string;
}

export interface NCBISearchResult {
  accession: string;
  title: string;
  id: string;
  length: number;
}

export interface NCBISearchResponse {
  success: boolean;
  results: NCBISearchResult[];
  message?: string;
}

export interface NCBIFetchResponse {
  success: boolean;
  accession: string;
  description: string;
  sequence: string;
  length: number;
  message?: string;
}

export interface PaperSearchResult {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  abstract_preview: string;
  doi: string;
  pubmed_url: string;
}

export interface PaperSearchResponse {
  success: boolean;
  results: PaperSearchResult[];
  total_count?: number;
  message?: string;
}

export interface PaperDetailResponse {
  success: boolean;
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  abstract: string;
  doi: string;
  pubmed_url: string;
  keywords: string[];
  mesh_terms: string[];
  message?: string;
}

export interface FunctionCall {
  function: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  model: string;
  function_calls: FunctionCall[];
  iterations: number;
  error?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  available_endpoints: string[];
}

// API Client
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = 30000  // Default 30 second timeout
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. The operation took too long.');
      }
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to server. Is the backend running?');
      }
      throw error;
    }
  }

  // Health Check
  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // Primer Design Endpoints
  async designPrimers(params: {
    sequence: string;
    min_tm?: number;
    max_tm?: number;
    prod_min?: number;
    prod_max?: number;
  }): Promise<PrimerDesignResponse> {
    return this.request<PrimerDesignResponse>('/design-primers', {
      method: 'POST',
      body: JSON.stringify({
        sequence: params.sequence,
        min_tm: params.min_tm ?? 57.0,
        max_tm: params.max_tm ?? 63.0,
        prod_min: params.prod_min ?? 100,
        prod_max: params.prod_max ?? 300,
      }),
    });
  }

  async analyzePrimer(sequence: string): Promise<PrimerAnalysisResponse> {
    return this.request<PrimerAnalysisResponse>('/analyze-primer', {
      method: 'POST',
      body: JSON.stringify({ sequence }),
    });
  }

  async checkCompatibility(
    forward_seq: string,
    reverse_seq: string
  ): Promise<PrimerCompatibilityResponse> {
    return this.request<PrimerCompatibilityResponse>('/check-compatibility', {
      method: 'POST',
      body: JSON.stringify({ forward_seq, reverse_seq }),
    });
  }

  async checkSpecificity(
    primer_seq: string,
    template_seq: string
  ): Promise<SpecificityCheckResponse> {
    return this.request<SpecificityCheckResponse>('/check-specificity', {
      method: 'POST',
      body: JSON.stringify({ primer_seq, template_seq }),
    });
  }

  // Restriction Sites
  async findRestrictionSites(sequence: string): Promise<RestrictionSiteResponse> {
    return this.request<RestrictionSiteResponse>('/find-restriction-sites', {
      method: 'POST',
      body: JSON.stringify({ sequence }),
    });
  }

  // Gibson Assembly
  async designGibsonPrimers(params: {
    vector_seq: string;
    insert_seq: string;
    overlap_length?: number;
  }): Promise<GibsonAssemblyResponse> {
    return this.request<GibsonAssemblyResponse>('/design-gibson', {
      method: 'POST',
      body: JSON.stringify({
        vector_seq: params.vector_seq,
        insert_seq: params.insert_seq,
        overlap_length: params.overlap_length ?? 25,
      }),
    });
  }

  // NCBI Endpoints
  async searchNCBI(query: string, retmax: number = 5): Promise<NCBISearchResponse> {
    return this.request<NCBISearchResponse>('/ncbi-search', {
      method: 'POST',
      body: JSON.stringify({ query, retmax }),
    });
  }

  async fetchNCBISequence(accession_id: string): Promise<NCBIFetchResponse> {
    return this.request<NCBIFetchResponse>('/ncbi-fetch', {
      method: 'POST',
      body: JSON.stringify({ accession_id }),
    });
  }

  // Paper Search
  async searchPapers(
    query: string,
    max_results: number = 10,
    sort: string = 'relevance'
  ): Promise<PaperSearchResponse> {
    return this.request<PaperSearchResponse>('/search-papers', {
      method: 'POST',
      body: JSON.stringify({ query, max_results, sort }),
    });
  }

  async fetchPaperDetails(pmid: string): Promise<PaperDetailResponse> {
    return this.request<PaperDetailResponse>('/fetch-paper', {
      method: 'POST',
      body: JSON.stringify({ pmid }),
    });
  }

  // AI Chat - longer timeout for complex operations
  async chat(
    message: string, 
    history?: Array<{ role: string; text: string }>,
    model?: string
  ): Promise<ChatResponse> {
    return this.request<ChatResponse>(
      '/chat',
      {
        method: 'POST',
        body: JSON.stringify({ message, history, model }),
      },
      120000  // 2 minute timeout for chat (may involve multiple tool calls)
    );
  }

  // Get available models
  async getAvailableModels(): Promise<{
    available_models: string[];
    model_details: Record<string, { name: string; description: string; best_for?: string }>;
    default_model: string;
  }> {
    return this.request('/chat/models');
  }
}

export const api = new ApiService();
export default api;
