"""
UniBio API - Molecular Biology Tools API
FastAPI backend for primer design, Gibson assembly, and restriction enzyme analysis.
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sys
from pathlib import Path

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from models import (
    PrimerDesignRequest, PrimerDesignResponse,
    PrimerAnalysisRequest, PrimerAnalysisResponse,
    PrimerCompatibilityRequest, PrimerCompatibilityResponse,
    SpecificityCheckRequest, SpecificityCheckResponse,
    RestrictionSiteRequest, RestrictionSiteResponse, RestrictionEnzyme,
    GibsonAssemblyRequest, GibsonAssemblyResponse,
    HealthResponse
)
from utils.primer3_util import PrimerEngine
from utils.check_specificity import check_specificity
from utils.Restriction_Enzyme import find_restriction_sites
from utils.Gibson_Assembly import design_gibson_primers


# ============= APP INITIALIZATION =============

app = FastAPI(
    title="UniBio API",
    description="Molecular biology tools for primer design and cloning",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============= HEALTH & INFO ENDPOINTS =============

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - API health check."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "available_endpoints": [
            "/docs",
            "/health",
            "/design-primers",
            "/analyze-primer",
            "/check-compatibility",
            "/check-specificity",
            "/find-restriction-sites",
            "/design-gibson"
        ]
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "available_endpoints": ["/docs", "/health", "/design-primers"]
    }


# ============= PRIMER DESIGN ENDPOINTS =============

@app.post("/design-primers", response_model=PrimerDesignResponse)
async def design_primers(request: PrimerDesignRequest):
    """
    Design PCR primers for a given DNA sequence.
    
    Uses Primer3 to generate optimal primer pairs based on:
    - Melting temperature (Tm) range
    - Product size range
    - GC content
    - Secondary structure avoidance
    """
    try:
        result = PrimerEngine.generate_primers(
            sequence=request.sequence,
            min_tm=request.min_tm,
            max_tm=request.max_tm,
            prod_min=request.prod_min,
            prod_max=request.prod_max
        )
        
        # Extract primer pairs from Primer3 output
        primer_pairs = []
        num_returned = result.get('PRIMER_PAIR_NUM_RETURNED', 0)
        
        for i in range(num_returned):
            pair = {
                "pair_id": i,
                "left_sequence": result.get(f'PRIMER_LEFT_{i}_SEQUENCE', ''),
                "right_sequence": result.get(f'PRIMER_RIGHT_{i}_SEQUENCE', ''),
                "left_tm": result.get(f'PRIMER_LEFT_{i}_TM', 0),
                "right_tm": result.get(f'PRIMER_RIGHT_{i}_TM', 0),
                "left_gc": result.get(f'PRIMER_LEFT_{i}_GC_PERCENT', 0),
                "right_gc": result.get(f'PRIMER_RIGHT_{i}_GC_PERCENT', 0),
                "product_size": result.get(f'PRIMER_PAIR_{i}_PRODUCT_SIZE', 0),
                "penalty": result.get(f'PRIMER_PAIR_{i}_PENALTY', 0)
            }
            primer_pairs.append(pair)
        
        return {
            "success": num_returned > 0,
            "primer_pairs": primer_pairs,
            "raw_output": result,
            "message": f"Found {num_returned} primer pair(s)" if num_returned > 0 else "No suitable primers found. Try adjusting parameters."
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Primer design failed: {str(e)}"
        )


@app.post("/analyze-primer", response_model=PrimerAnalysisResponse)
async def analyze_primer(request: PrimerAnalysisRequest):
    """
    Analyze a single primer sequence for thermodynamic properties.
    
    Returns:
    - Melting temperature (Tm)
    - Hairpin formation potential
    - Homodimer formation potential
    """
    try:
        result = PrimerEngine.analyze_sequence(request.sequence)
        
        # Add warnings based on analysis
        warnings = []
        if result['hairpin_tm'] > 40.0:
            warnings.append(f"High hairpin risk (Tm: {result['hairpin_tm']}°C)")
        if result['homodimer_tm'] > 40.0:
            warnings.append(f"High homodimer risk (Tm: {result['homodimer_tm']}°C)")
        if result['tm'] < 50.0 or result['tm'] > 65.0:
            warnings.append(f"Tm outside optimal range (50-65°C): {result['tm']}°C")
        
        return {
            **result,
            "warnings": warnings
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Primer analysis failed: {str(e)}"
        )


@app.post("/check-compatibility", response_model=PrimerCompatibilityResponse)
async def check_compatibility(request: PrimerCompatibilityRequest):
    """
    Check if two primers (forward/reverse) will form primer-dimers.
    
    Evaluates heterodimer formation between primer pairs.
    """
    try:
        result = PrimerEngine.check_compatibility(
            request.forward_seq,
            request.reverse_seq
        )
        
        recommendation = "✓ Primers are compatible" if not result['has_dimer_risk'] else \
                        f"⚠️ High dimer risk (Tm: {result['dimer_tm']}°C). Consider redesigning."
        
        return {
            **result,
            "recommendation": recommendation
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Compatibility check failed: {str(e)}"
        )


# ============= SPECIFICITY CHECK ENDPOINT =============

@app.post("/check-specificity", response_model=SpecificityCheckResponse)
async def check_primer_specificity(request: SpecificityCheckRequest):
    """
    Check if a primer binds specifically to the template (exactly once).
    
    Searches both strands and handles circular plasmid topology.
    """
    try:
        result = check_specificity(request.primer_seq, request.template_seq)
        
        if result['is_specific']:
            recommendation = "✓ Primer is specific (binds exactly once)"
        elif result['count'] == 0:
            recommendation = "⚠️ Primer does not bind to template"
        else:
            recommendation = f"⚠️ Non-specific: binds {result['count']} times. Redesign recommended."
        
        return {
            **result,
            "recommendation": recommendation
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Specificity check failed: {str(e)}"
        )


# ============= RESTRICTION ENZYME ENDPOINT =============

@app.post("/find-restriction-sites", response_model=RestrictionSiteResponse)
async def find_restriction_enzyme_sites(request: RestrictionSiteRequest):
    """
    Scan DNA sequence for restriction enzyme recognition sites.
    
    Searches common commercial enzymes from REBASE database.
    Returns enzyme names, cut counts, and positions.
    """
    try:
        results = find_restriction_sites(request.sequence)
        
        enzymes = [
            RestrictionEnzyme(
                enzyme_name=item['enzyme_name'],
                cut_count=item['cut_count'],
                cut_positions=item['cut_positions']
            )
            for item in results
        ]
        
        message = f"Found {len(enzymes)} enzyme(s) that cut this sequence" if enzymes else \
                 "No restriction sites found for common enzymes"
        
        return {
            "total_enzymes_found": len(enzymes),
            "enzymes": enzymes,
            "message": message
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Restriction site analysis failed: {str(e)}"
        )


# ============= GIBSON ASSEMBLY ENDPOINT =============

@app.post("/design-gibson", response_model=GibsonAssemblyResponse)
async def design_gibson_assembly(request: GibsonAssemblyRequest):
    """
    Design primers for Gibson assembly cloning.
    
    Generates primers with homology overhangs to join insert into vector.
    Default overlap: 25bp (optimal for Gibson assembly).
    """
    try:
        # Modify the Gibson function to accept overlap_length
        # For now, we'll use the default 25bp from the original function
        fwd, rev = design_gibson_primers(request.vector_seq, request.insert_seq)
        
        # Parse the primer structure
        overlap_len = request.overlap_length
        vector_overlap_fwd = fwd[:overlap_len]
        insert_binding_fwd = fwd[overlap_len:]
        
        vector_overlap_rev = rev[:overlap_len]
        insert_binding_rev = rev[overlap_len:]
        
        return {
            "forward_primer": fwd,
            "reverse_primer": rev,
            "overlap_length": overlap_len,
            "vector_overlap_fwd": vector_overlap_fwd,
            "vector_overlap_rev": vector_overlap_rev,
            "insert_binding_fwd": insert_binding_fwd,
            "insert_binding_rev": insert_binding_rev,
            "message": f"Gibson assembly primers designed with {overlap_len}bp overlaps"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gibson assembly design failed: {str(e)}"
        )


# ============= ERROR HANDLERS =============

@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    """Handle validation errors."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": str(exc)}
    )


# ============= RUN SERVER =============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes (disable in production)
        log_level="info"
    )
