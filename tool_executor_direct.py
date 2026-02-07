"""
Direct tool executor for Gemini agent.
Calls functions directly instead of via HTTP to avoid self-blocking issues.
"""
from typing import Dict, Any

# Import the actual utility functions
from utils.primer3_util import PrimerEngine
from utils.check_specificity import check_specificity
from utils.Restriction_Enzyme import find_restriction_sites
from utils.Gibson_Assembly import design_gibson_primers
from utils.ncbi_util import NCBIUtil
from utils.pubmed_util import PubMedUtil


class DirectToolExecutor:
    """Executes tool/function calls directly by calling the underlying functions."""
    
    def execute(self, function_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a function call directly.
        
        Args:
            function_name: Name of the function to execute
            parameters: Parameters to pass to the function
            
        Returns:
            Response data from the function
        """
        try:
            if function_name == "design_primers":
                return self._design_primers(parameters)
            elif function_name == "analyze_primer":
                return self._analyze_primer(parameters)
            elif function_name == "check_primer_compatibility":
                return self._check_compatibility(parameters)
            elif function_name == "check_specificity":
                return self._check_specificity(parameters)
            elif function_name == "find_restriction_sites":
                return self._find_restriction_sites(parameters)
            elif function_name == "design_gibson_primers":
                return self._design_gibson(parameters)
            elif function_name == "search_ncbi_nucleotide":
                return self._search_ncbi(parameters)
            elif function_name == "fetch_ncbi_sequence":
                return self._fetch_ncbi(parameters)
            elif function_name == "search_research_papers":
                return self._search_papers(parameters)
            elif function_name == "fetch_paper_details":
                return self._fetch_paper_details(parameters)
            else:
                return {
                    "error": f"Unknown function: {function_name}",
                    "success": False
                }
        except Exception as e:
            return {
                "error": f"Error executing {function_name}: {str(e)}",
                "success": False
            }
    
    def _design_primers(self, params: Dict) -> Dict:
        result = PrimerEngine.generate_primers(
            sequence=params.get("sequence", ""),
            min_tm=params.get("min_tm", 57.0),
            max_tm=params.get("max_tm", 63.0),
            prod_min=params.get("prod_min", 100),
            prod_max=params.get("prod_max", 300)
        )
        
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
            "message": f"Found {num_returned} primer pair(s)" if num_returned > 0 else "No suitable primers found."
        }
    
    def _analyze_primer(self, params: Dict) -> Dict:
        result = PrimerEngine.analyze_sequence(params.get("sequence", ""))
        warnings = []
        if result['hairpin_tm'] > 40.0:
            warnings.append(f"High hairpin risk (Tm: {result['hairpin_tm']}°C)")
        if result['homodimer_tm'] > 40.0:
            warnings.append(f"High homodimer risk (Tm: {result['homodimer_tm']}°C)")
        return {**result, "warnings": warnings}
    
    def _check_compatibility(self, params: Dict) -> Dict:
        result = PrimerEngine.check_compatibility(
            params.get("forward_seq", ""),
            params.get("reverse_seq", "")
        )
        recommendation = "✓ Primers are compatible" if not result['has_dimer_risk'] else \
                        f"⚠️ High dimer risk (Tm: {result['dimer_tm']}°C). Consider redesigning."
        return {**result, "recommendation": recommendation}
    
    def _check_specificity(self, params: Dict) -> Dict:
        result = check_specificity(
            params.get("primer_seq", ""),
            params.get("template_seq", "")
        )
        if result['is_specific']:
            recommendation = "✓ Primer is specific (binds exactly once)"
        elif result['count'] == 0:
            recommendation = "⚠️ Primer does not bind to template"
        else:
            recommendation = f"⚠️ Non-specific: binds {result['count']} times."
        return {**result, "recommendation": recommendation}
    
    def _find_restriction_sites(self, params: Dict) -> Dict:
        results = find_restriction_sites(params.get("sequence", ""))
        enzymes = [
            {
                "enzyme_name": item['enzyme_name'],
                "cut_count": item['cut_count'],
                "cut_positions": item['cut_positions']
            }
            for item in results
        ]
        return {
            "total_enzymes_found": len(enzymes),
            "enzymes": enzymes,
            "message": f"Found {len(enzymes)} enzyme(s) that cut this sequence"
        }
    
    def _design_gibson(self, params: Dict) -> Dict:
        fwd, rev = design_gibson_primers(
            params.get("vector_seq", ""),
            params.get("insert_seq", "")
        )
        overlap_len = params.get("overlap_length", 25)
        return {
            "forward_primer": fwd,
            "reverse_primer": rev,
            "overlap_length": overlap_len,
            "vector_overlap_fwd": fwd[:overlap_len],
            "vector_overlap_rev": rev[:overlap_len],
            "insert_binding_fwd": fwd[overlap_len:],
            "insert_binding_rev": rev[overlap_len:],
            "message": f"Gibson assembly primers designed with {overlap_len}bp overlaps"
        }
    
    def _search_ncbi(self, params: Dict) -> Dict:
        # Convert retmax to int (Gemini may send it as float like 1.0)
        retmax = int(params.get("retmax", 5))
        results = NCBIUtil.search_nucleotide(
            params.get("query", ""),
            retmax
        )
        return {
            "success": True,
            "results": results,
            "message": f"Found {len(results)} results"
        }
    
    def _fetch_ncbi(self, params: Dict) -> Dict:
        result = NCBIUtil.fetch_sequence(params.get("accession_id", ""))
        if result:
            return {
                "success": True,
                **result,
                "message": f"Successfully fetched sequence"
            }
        return {
            "success": False,
            "message": "Could not fetch sequence"
        }
    
    def _search_papers(self, params: Dict) -> Dict:
        max_results = int(params.get("max_results", 5))
        sort = params.get("sort", "relevance")
        results = PubMedUtil.search_papers(
            query=params.get("query", ""),
            max_results=max_results,
            sort=sort
        )
        # Remove internal fields
        for r in results:
            r.pop("_total_results", None)
            r.pop("authors_full", None)
            r.pop("publication_type", None)
            r.pop("mesh_terms", None)
        return {
            "success": True,
            "results": results,
            "message": f"Found {len(results)} papers"
        }
    
    def _fetch_paper_details(self, params: Dict) -> Dict:
        result = PubMedUtil.fetch_paper_details(params.get("pmid", ""))
        if result:
            return {
                "success": True,
                **result,
                "message": "Successfully fetched paper details"
            }
        return {
            "success": False,
            "message": "Could not fetch paper details"
        }
    
    def health_check(self) -> bool:
        """Always returns True since we're calling functions directly."""
        return True
