"""
Web search using SerpAPI (Google Search API)
More reliable than DuckDuckGo, requires API key.
Get free key at: https://serpapi.com/
"""
import os
import requests
from typing import Dict
from dotenv import load_dotenv

load_dotenv()


def search_web_serpapi(query: str, max_results: int = 5) -> Dict:
    """
    Search using SerpAPI (Google search results).
    
    Args:
        query: Search query
        max_results: Maximum results to return
        
    Returns:
        Dict with search results
    """
    api_key = os.getenv("SERPAPI_KEY")
    
    if not api_key:
        return {
            "success": False,
            "query": query,
            "results_count": 0,
            "results": [],
            "error": "SERPAPI_KEY not found in .env",
            "message": "Add SERPAPI_KEY to .env file. Get free key at: https://serpapi.com/"
        }
    
    try:
        url = "https://serpapi.com/search"
        params = {
            "q": query,
            "api_key": api_key,
            "num": max_results,
            "engine": "google"
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        results = []
        for result in data.get("organic_results", [])[:max_results]:
            results.append({
                "title": result.get("title", ""),
                "snippet": result.get("snippet", ""),
                "url": result.get("link", ""),
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
            "message": f"Search failed: {str(e)}"
        }


def search_scientific_papers_serpapi(query: str, max_results: int = 5) -> Dict:
    """Search Google Scholar using SerpAPI."""
    api_key = os.getenv("SERPAPI_KEY")
    
    if not api_key:
        return {
            "success": False,
            "query": query,
            "results_count": 0,
            "results": [],
            "message": "SERPAPI_KEY not found"
        }
    
    try:
        url = "https://serpapi.com/search"
        params = {
            "q": query,
            "api_key": api_key,
            "num": max_results,
            "engine": "google_scholar"
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        results = []
        for result in data.get("organic_results", [])[:max_results]:
            results.append({
                "title": result.get("title", ""),
                "snippet": result.get("snippet", ""),
                "url": result.get("link", ""),
                "source": result.get("publication_info", {}).get("summary", ""),
                "citations": result.get("inline_links", {}).get("cited_by", {}).get("total", 0)
            })
        
        return {
            "success": True,
            "query": query,
            "results_count": len(results),
            "results": results,
            "message": f"Found {len(results)} papers for '{query}'"
        }
        
    except Exception as e:
        return {
            "success": False,
            "query": query,
            "results_count": 0,
            "results": [],
            "error": str(e),
            "message": f"Search failed: {str(e)}"
        }
