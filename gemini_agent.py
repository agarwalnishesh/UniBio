"""
Gemini AI Agent for UniBio.
Handles natural language conversations and tool execution using Google's Gemini models.
"""
import os
import json
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from dotenv import load_dotenv

from gemini_functions import get_function_declarations
from tool_executor_direct import DirectToolExecutor

# Load environment variables
load_dotenv()


class GeminiAgent:
    """
    AI Agent powered by Google Gemini with function calling capabilities.
    Supports dynamic model selection.
    """
    
    # Available Gemini models
    AVAILABLE_MODELS = [
        "gemini-2.5-flash",           # Latest, fastest (Feb 2026)
        "gemini-2.5-pro",             # Latest Pro model
        "gemini-2.0-flash",           # Gemini 2.0 Flash
        "gemini-1.5-pro",             # Most capable, larger context
        "gemini-1.5-flash",           # Fast, good balance
        "gemini-1.5-flash-8b",        # Smallest, fastest
    ]
    
    def __init__(self, model_name: str = None, api_key: str = None):
        """
        Initialize Gemini agent with specified model.
        
        Args:
            model_name: Name of Gemini model to use. If None, uses DEFAULT_GEMINI_MODEL from .env
            api_key: Gemini API key. If None, uses GEMINI_API_KEY from .env
        """
        # Get API key
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Gemini API key not found. Set GEMINI_API_KEY in .env file or pass as argument."
            )
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        
        # Set model
        self.model_name = model_name or os.getenv("DEFAULT_GEMINI_MODEL", "gemini-2.5-flash")
        if self.model_name not in self.AVAILABLE_MODELS:
            print(f"Warning: {self.model_name} not in standard models. Proceeding anyway...")
        
        # Get function declarations
        self.functions = get_function_declarations()
        
        # System instruction to ensure consistent responses
        system_instruction = """You are UniBio, an expert molecular biology assistant. You help scientists with:
- Designing PCR primers
- Analyzing DNA sequences
- Finding restriction enzyme sites
- Planning Gibson assembly cloning
- Searching NCBI databases

IMPORTANT RULES:
1. ALWAYS provide a final text response summarizing what you did and the results
2. After calling tools, explain the results in clear scientific language
3. If you design primers, always show the primer sequences, Tm, and product size
4. Be concise but thorough in your explanations
5. Never end without a text response to the user"""
        
        # Initialize model with tools and system instruction
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            tools=self.functions,
            system_instruction=system_instruction
        )
        
        # Initialize direct tool executor (calls functions directly, no HTTP)
        self.tool_executor = DirectToolExecutor()
        
        # Initialize chat session
        self.chat = None
        
    def start_chat(self, history: List[Dict] = None):
        """
        Start a new chat session.
        
        Args:
            history: Optional chat history to initialize with
        """
        self.chat = self.model.start_chat(history=history or [])
        
    def send_message(self, message: str, max_iterations: int = 5) -> Dict[str, Any]:
        """
        Send a message to the agent and handle function calling loop.
        
        Args:
            message: User message
            max_iterations: Maximum number of function call iterations to prevent infinite loops
            
        Returns:
            Dict containing the final response and metadata
        """
        if not self.chat:
            self.start_chat()
        
        try:
            # Send initial message
            response = self.chat.send_message(message)
            
            # Track function calls
            function_calls_made = []
            iteration = 0
            
            # Handle function calling loop
            while iteration < max_iterations:
                # Check if model wants to call a function
                if not response.candidates or not response.candidates[0].content:
                    break
                
                if not response.candidates[0].content.parts:
                    break
                    
                parts = list(response.candidates[0].content.parts)
                
                # Check for function calls
                function_calls = [part for part in parts if hasattr(part, 'function_call') and part.function_call]
                
                if not function_calls:
                    # No more function calls, we have the final response
                    break
                
                # Execute each function call
                function_responses = []
                for fc_part in function_calls:
                    fc = fc_part.function_call
                    function_name = fc.name
                    function_args = dict(fc.args)
                    
                    print(f"🔧 Agent calling: {function_name}")
                    print(f"   Parameters: {json.dumps(function_args, indent=2)}")
                    
                    # Execute the function
                    result = self.tool_executor.execute(function_name, function_args)
                    
                    # Track the call
                    function_calls_made.append({
                        "function": function_name,
                        "arguments": function_args,
                        "result": result
                    })
                    
                    # Prepare response for Gemini
                    function_responses.append({
                        "function_call": fc,
                        "function_response": {
                            "name": function_name,
                            "response": result
                        }
                    })
                
                # Send function results back to model
                response_parts = []
                for fr in function_responses:
                    response_parts.append(
                        genai.protos.Part(
                            function_response=genai.protos.FunctionResponse(
                                name=fr["function_response"]["name"],
                                response={"result": fr["function_response"]["response"]}
                            )
                        )
                    )
                
                response = self.chat.send_message(response_parts)
                iteration += 1
            
            # Extract final text response
            final_text = ""
            if response.candidates and response.candidates[0].content:
                if response.candidates[0].content.parts:
                    for part in list(response.candidates[0].content.parts):
                        if hasattr(part, 'text') and part.text:
                            final_text += part.text
            
            # If we made function calls but got no text, generate a summary
            if not final_text.strip() and function_calls_made:
                tool_names = [fc["function"] for fc in function_calls_made]
                final_text = f"I've completed the requested operations using: {', '.join(tool_names)}. "
                
                # Add context based on what tools were used
                if "design_primers" in tool_names:
                    last_primer_result = next((fc["result"] for fc in reversed(function_calls_made) if fc["function"] == "design_primers"), None)
                    if last_primer_result and last_primer_result.get("success"):
                        pairs = last_primer_result.get("primer_pairs", [])
                        if pairs:
                            final_text += f"Found {len(pairs)} primer pair(s). The best pair has a product size of {pairs[0].get('product_size', 'N/A')} bp."
                
                if "search_ncbi_nucleotide" in tool_names or "fetch_ncbi_sequence" in tool_names:
                    last_fetch = next((fc["result"] for fc in reversed(function_calls_made) if fc["function"] == "fetch_ncbi_sequence"), None)
                    if last_fetch and last_fetch.get("success"):
                        final_text += f" Retrieved sequence {last_fetch.get('accession', 'N/A')} ({last_fetch.get('length', 0)} bp)."
            
            return {
                "success": True,
                "response": final_text,
                "model": self.model_name,
                "function_calls": function_calls_made,
                "iterations": iteration
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "model": self.model_name
            }
    
    def get_chat_history(self) -> List[Dict]:
        """Get the current chat history."""
        if not self.chat:
            return []
        return self.chat.history
    
    def clear_history(self):
        """Clear chat history and start fresh."""
        self.start_chat()
    
    @classmethod
    def list_available_models(cls) -> List[str]:
        """List all available Gemini models."""
        return cls.AVAILABLE_MODELS
    
    def switch_model(self, new_model: str):
        """
        Switch to a different Gemini model.
        
        Args:
            new_model: Name of the new model to use
        """
        if new_model not in self.AVAILABLE_MODELS:
            print(f"⚠️  Warning: {new_model} not in standard models")
        
        self.model_name = new_model
        
        # Reinitialize model with new model name
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            tools=self.functions
        )
        
        # Restart chat with new model
        old_history = self.get_chat_history() if self.chat else None
        self.start_chat(history=old_history)
        
        print(f"✅ Switched to model: {new_model}")


# Convenience function for quick single queries
def ask_gemini(question: str, model: str = None) -> str:
    """
    Quick one-shot question to Gemini agent.
    
    Args:
        question: Question to ask
        model: Optional model name to use
        
    Returns:
        Agent's response as string
    """
    agent = GeminiAgent(model_name=model)
    agent.start_chat()
    result = agent.send_message(question)
    
    if result["success"]:
        return result["response"]
    else:
        return f"Error: {result.get('error', 'Unknown error')}"
