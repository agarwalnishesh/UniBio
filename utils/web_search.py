"""
Web search utility for UniBio Agent.
Allows the agent to search for scientific information online.
"""
from typing import List, Dict

try:
    from ddgs import DDGS
    DDGS_AVAILABLE = True
except ImportError:
    try:
        from duckduckgo_search import DDGS
        DDGS_AVAILABLE = True
    except ImportError:
        DDGS_AVAILABLE = False
        DDGS = None


def search_web(query: str, max_results: int = 5) -> Dict:
    """
    Search the web using DuckDuckGo for scientific information.
    
    Args:
        query: Search query
        max_results: Maximum number of results to return (default: 5)
        
    Returns:
        Dict containing search results with titles, snippets, and URLs
    """
    if not DDGS_AVAILABLE:
        return {
            "success": False,
            "query": query,
            "results_count": 0,
            "results": [],
            "error": "Search package not installed",
            "message": "Install with: pip install ddgs"
        }
    
    try:
        # Use DDGS - simple approach
        ddgs = DDGS()
        search_results = ddgs.text(query, max_results=max_results)
        
        results = []
        for result in search_results:
            results.append({
                "title": result.get("title", ""),
                "snippet": result.get("body", ""),
                "url": result.get("href", ""),
                "source": result.get("source", "")
            })
        
        return {
            "success": True,
            "query": query,
            "results_count": len(results),
            "results": results,
            "message": f"Found {len(results)} results for '{query}'"
        }
        
    except Exception as e:
        return {
            "success": False,
            "query": query,
            "results_count": 0,
            "results": [],
            "error": str(e),
            "message": f"Web search failed: {str(e)}"
        }


def search_scientific_papers(query: str, max_results: int = 5) -> Dict:
    """
    Search for scientific papers and articles.
    Uses DuckDuckGo with filters for scientific sources.
    
    Args:
        query: Search query
        max_results: Maximum number of results
        
    Returns:
        Dict containing search results from scientific sources
    """
    # Add scientific keywords to bias results toward academic sources
    enhanced_query = f"{query} site:pubmed.ncbi.nlm.nih.gov OR site:nature.com OR site:science.org OR site:pmc.ncbi.nlm.nih.gov OR site:biorxiv.org"
    
    return search_web(enhanced_query, max_results)


def search_protocols(query: str, max_results: int = 3) -> Dict:
    """
    Search for laboratory protocols and methods.
    
    Args:
        query: Protocol or method to search for
        max_results: Maximum number of results
        
    Returns:
        Dict containing protocol results
    """
    # Target protocol repositories
    enhanced_query = f"{query} protocol site:protocols.io OR site:nature.com/protocolexchange OR site:addgene.org"
    
    return search_web(enhanced_query, max_results)
