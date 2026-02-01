"""
Tool executor for Gemini agent.
Handles execution of function calls by making HTTP requests to the FastAPI endpoints.
"""
import requests
import os
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API base URL from environment
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")


class ToolExecutor:
    """Executes tool/function calls by routing to appropriate FastAPI endpoints."""
    
    # Map function names to API endpoints
    FUNCTION_ENDPOINT_MAP = {
        "design_primers": "/design-primers",
        "analyze_primer": "/analyze-primer",
        "check_primer_compatibility": "/check-compatibility",
        "check_specificity": "/check-specificity",
        "find_restriction_sites": "/find-restriction-sites",
        "design_gibson_primers": "/design-gibson",
        "search_ncbi_nucleotide": "/ncbi-search",
        "fetch_ncbi_sequence": "/ncbi-fetch"
    }
    
    def __init__(self, base_url: str = None):
        """
        Initialize tool executor.
        
        Args:
            base_url: Base URL for the API. Defaults to localhost:8000
        """
        self.base_url = base_url or API_BASE_URL
        
    # Functions that may need longer timeouts (e.g., external API calls)
    SLOW_FUNCTIONS = {"search_ncbi_nucleotide", "fetch_ncbi_sequence"}
    
    def execute(self, function_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a function call by making an HTTP request to the appropriate endpoint.
        
        Args:
            function_name: Name of the function to execute
            parameters: Parameters to pass to the function
            
        Returns:
            Response data from the API endpoint
            
        Raises:
            ValueError: If function name is not recognized
            requests.RequestException: If API request fails
        """
        # Get endpoint for this function
        endpoint = self.FUNCTION_ENDPOINT_MAP.get(function_name)
        
        if not endpoint:
            available = ", ".join(self.FUNCTION_ENDPOINT_MAP.keys())
            raise ValueError(
                f"Unknown function: {function_name}. "
                f"Available functions: {available}"
            )
        
        # Construct full URL
        url = f"{self.base_url}{endpoint}"
        
        # Use longer timeout for slow operations like NCBI
        timeout = 60 if function_name in self.SLOW_FUNCTIONS else 30
        
        try:
            # Make POST request to the endpoint
            response = requests.post(
                url,
                json=parameters,
                timeout=timeout,
                headers={"Content-Type": "application/json"}
            )
            
            # Raise exception for bad status codes
            response.raise_for_status()
            
            # Return JSON response
            return response.json()
            
        except requests.exceptions.Timeout:
            return {
                "error": f"Request to {function_name} timed out after {timeout} seconds",
                "success": False
            }
        except requests.exceptions.ConnectionError:
            return {
                "error": f"Could not connect to API at {self.base_url}. Is the server running?",
                "success": False
            }
        except requests.exceptions.HTTPError as e:
            return {
                "error": f"API returned error: {str(e)}",
                "status_code": response.status_code,
                "details": response.text,
                "success": False
            }
        except Exception as e:
            return {
                "error": f"Unexpected error executing {function_name}: {str(e)}",
                "success": False
            }
    
    def execute_batch(self, function_calls: list) -> list:
        """
        Execute multiple function calls in sequence.
        
        Args:
            function_calls: List of dicts with 'name' and 'parameters' keys
            
        Returns:
            List of response dicts from each function call
        """
        results = []
        for call in function_calls:
            result = self.execute(
                function_name=call.get("name"),
                parameters=call.get("parameters", {})
            )
            results.append({
                "function_name": call.get("name"),
                "result": result
            })
        return results
    
    def health_check(self) -> bool:
        """
        Check if the API server is running and accessible.
        
        Returns:
            True if server is healthy, False otherwise
        """
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
