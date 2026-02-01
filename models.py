"""
Pydantic models for API request/response validation.
"""
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional


# ============= PRIMER DESIGN MODELS =============

class PrimerDesignRequest(BaseModel):
    """Request model for primer design endpoint."""
    sequence: str = Field(..., description="DNA sequence template (5' to 3')")
    min_tm: float = Field(57.0, ge=40.0, le=80.0, description="Minimum melting temperature (°C)")
    max_tm: float = Field(63.0, ge=40.0, le=80.0, description="Maximum melting temperature (°C)")
    prod_min: int = Field(100, ge=50, le=5000, description="Minimum product size (bp)")
    prod_max: int = Field(300, ge=50, le=5000, description="Maximum product size (bp)")
    
    @validator('sequence')
    def validate_sequence(cls, v):
        v = v.upper().strip()
        if not v:
            raise ValueError("Sequence cannot be empty")
        if not all(base in 'ATGCNRYSWKMBDHV' for base in v):
            raise ValueError("Sequence contains invalid DNA characters")
        return v
    
    @validator('max_tm')
    def validate_tm_range(cls, v, values):
        if 'min_tm' in values and v <= values['min_tm']:
            raise ValueError("max_tm must be greater than min_tm")
        return v
    
    @validator('prod_max')
    def validate_product_range(cls, v, values):
        if 'prod_min' in values and v <= values['prod_min']:
            raise ValueError("prod_max must be greater than prod_min")
        return v


class PrimerDesignResponse(BaseModel):
    """Response model for primer design."""
    success: bool
    primer_pairs: List[Dict]
    raw_output: Optional[Dict] = None
    message: Optional[str] = None


# ============= PRIMER ANALYSIS MODELS =============

class PrimerAnalysisRequest(BaseModel):
    """Request model for single primer analysis."""
    sequence: str = Field(..., description="Primer sequence (5' to 3')")
    
    @validator('sequence')
    def validate_sequence(cls, v):
        v = v.upper().strip()
        if not v:
            raise ValueError("Sequence cannot be empty")
        if len(v) < 15 or len(v) > 35:
            raise ValueError("Primer length should be between 15-35 bases")
        if not all(base in 'ATGCNRYSWKMBDHV' for base in v):
            raise ValueError("Sequence contains invalid DNA characters")
        return v


class PrimerAnalysisResponse(BaseModel):
    """Response model for primer analysis."""
    sequence: str
    tm: float
    hairpin_tm: float
    homodimer_tm: float
    warnings: List[str] = []


# ============= PRIMER COMPATIBILITY MODELS =============

class PrimerCompatibilityRequest(BaseModel):
    """Request model for checking primer pair compatibility."""
    forward_seq: str = Field(..., description="Forward primer sequence")
    reverse_seq: str = Field(..., description="Reverse primer sequence")
    
    @validator('forward_seq', 'reverse_seq')
    def validate_sequence(cls, v):
        v = v.upper().strip()
        if not v:
            raise ValueError("Sequence cannot be empty")
        if not all(base in 'ATGCNRYSWKMBDHV' for base in v):
            raise ValueError("Sequence contains invalid DNA characters")
        return v


class PrimerCompatibilityResponse(BaseModel):
    """Response model for primer compatibility check."""
    has_dimer_risk: bool
    dimer_tm: float
    recommendation: str


# ============= SPECIFICITY CHECK MODELS =============

class SpecificityCheckRequest(BaseModel):
    """Request model for specificity checking."""
    primer_seq: str = Field(..., description="Primer sequence")
    template_seq: str = Field(..., description="Template/plasmid sequence")
    
    @validator('primer_seq', 'template_seq')
    def validate_sequence(cls, v):
        v = v.upper().strip()
        if not v:
            raise ValueError("Sequence cannot be empty")
        if not all(base in 'ATGCNRYSWKMBDHV' for base in v):
            raise ValueError("Sequence contains invalid DNA characters")
        return v


class SpecificityCheckResponse(BaseModel):
    """Response model for specificity check."""
    is_specific: bool
    count: int
    warning: Optional[str] = None
    recommendation: str


# ============= RESTRICTION ENZYME MODELS =============

class RestrictionSiteRequest(BaseModel):
    """Request model for finding restriction sites."""
    sequence: str = Field(..., description="DNA sequence to scan")
    
    @validator('sequence')
    def validate_sequence(cls, v):
        v = v.upper().strip()
        if not v:
            raise ValueError("Sequence cannot be empty")
        if len(v) < 6:
            raise ValueError("Sequence too short for restriction site analysis")
        if not all(base in 'ATGCNRYSWKMBDHV' for base in v):
            raise ValueError("Sequence contains invalid DNA characters")
        return v


class RestrictionEnzyme(BaseModel):
    """Model for a single restriction enzyme result."""
    enzyme_name: str
    cut_count: int
    cut_positions: List[int]


class RestrictionSiteResponse(BaseModel):
    """Response model for restriction site analysis."""
    total_enzymes_found: int
    enzymes: List[RestrictionEnzyme]
    message: Optional[str] = None


# ============= GIBSON ASSEMBLY MODELS =============

class GibsonAssemblyRequest(BaseModel):
    """Request model for Gibson assembly primer design."""
    vector_seq: str = Field(..., description="Vector sequence (linearized)")
    insert_seq: str = Field(..., description="Insert sequence to clone")
    overlap_length: int = Field(25, ge=15, le=40, description="Overlap length (bp)")
    
    @validator('vector_seq', 'insert_seq')
    def validate_sequence(cls, v):
        v = v.upper().strip()
        if not v:
            raise ValueError("Sequence cannot be empty")
        if not all(base in 'ATGCNRYSWKMBDHV' for base in v):
            raise ValueError("Sequence contains invalid DNA characters")
        return v


class GibsonAssemblyResponse(BaseModel):
    """Response model for Gibson assembly."""
    forward_primer: str
    reverse_primer: str
    overlap_length: int
    vector_overlap_fwd: str
    vector_overlap_rev: str
    insert_binding_fwd: str
    insert_binding_rev: str
    message: Optional[str] = None


# ============= HEALTH CHECK MODEL =============

class HealthResponse(BaseModel):
    """Response model for health check endpoint."""
    status: str
    version: str
    available_endpoints: List[str]


# ============= AI AGENT MODELS =============

class ChatRequest(BaseModel):
    """Request model for AI chat endpoint."""
    message: str = Field(..., description="User's natural language query")
    model: Optional[str] = Field(None, description="Gemini model to use (e.g., gemini-2.0-flash-exp, gemini-1.5-pro)")
    
    @validator('message')
    def validate_message(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty")
        if len(v) > 10000:
            raise ValueError("Message too long (max 10000 characters)")
        return v


class FunctionCall(BaseModel):
    """Model for a single function call made by the agent."""
    function: str
    arguments: Dict
    result: Dict


class ChatResponse(BaseModel):
    """Response model for AI chat endpoint."""
    success: bool
    response: str
    model: str
    function_calls: List[FunctionCall] = []
    iterations: int = 0
    error: Optional[str] = None
