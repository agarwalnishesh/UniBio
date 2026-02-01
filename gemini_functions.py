"""
Function definitions for Gemini AI agent.
These define the tools/functions that Gemini can call to interact with the UniBio API.
"""

# Function schemas in Gemini's format
# Using simple dict format that Gemini SDK will convert
GEMINI_FUNCTIONS = [
    {
        "name": "design_primers",
        "description": "Design PCR primers for DNA amplification using Primer3. Analyzes a DNA sequence and generates optimal primer pairs based on melting temperature, GC content, and product size constraints.",
        "parameters": {
            "type_": "OBJECT",
            "properties": {
                "sequence": {
                    "type_": "STRING",
                    "description": "The DNA sequence template (5' to 3') for which to design primers. Must contain only valid DNA bases (ATGC)."
                },
                "min_tm": {
                    "type_": "NUMBER",
                    "description": "Minimum melting temperature (°C) for primers. Typical range: 50-65°C. Default: 57.0"
                },
                "max_tm": {
                    "type_": "NUMBER",
                    "description": "Maximum melting temperature (°C) for primers. Must be greater than min_tm. Default: 63.0"
                },
                "prod_min": {
                    "type_": "INTEGER",
                    "description": "Minimum PCR product size in base pairs. Default: 100"
                },
                "prod_max": {
                    "type_": "INTEGER",
                    "description": "Maximum PCR product size in base pairs. Must be greater than prod_min. Default: 300"
                }
            },
            "required": ["sequence"]
        }
    },
    {
        "name": "analyze_primer",
        "description": "Analyze a single primer sequence for thermodynamic properties. Returns melting temperature (Tm), hairpin formation potential, and homodimer formation potential.",
        "parameters": {
            "type_": "OBJECT",
            "properties": {
                "sequence": {
                    "type_": "STRING",
                    "description": "The primer sequence (5' to 3') to analyze. Must be 15-35 bases long."
                }
            },
            "required": ["sequence"]
        }
    },
    {
        "name": "check_primer_compatibility",
        "description": "Check if two primers (forward and reverse) will form primer-dimers. Evaluates heterodimer formation between a primer pair.",
        "parameters": {
            "type_": "OBJECT",
            "properties": {
                "forward_seq": {
                    "type_": "STRING",
                    "description": "Forward primer sequence (5' to 3')"
                },
                "reverse_seq": {
                    "type_": "STRING",
                    "description": "Reverse primer sequence (5' to 3')"
                }
            },
            "required": ["forward_seq", "reverse_seq"]
        }
    },
    {
        "name": "check_specificity",
        "description": "Check if a primer binds specifically to a template sequence (exactly once). Searches both DNA strands and handles circular plasmid topology.",
        "parameters": {
            "type_": "OBJECT",
            "properties": {
                "primer_seq": {
                    "type_": "STRING",
                    "description": "The primer sequence to check"
                },
                "template_seq": {
                    "type_": "STRING",
                    "description": "The template/plasmid sequence to search against"
                }
            },
            "required": ["primer_seq", "template_seq"]
        }
    },
    {
        "name": "find_restriction_sites",
        "description": "Scan a DNA sequence for restriction enzyme recognition sites. Searches for common commercial enzymes from the REBASE database.",
        "parameters": {
            "type_": "OBJECT",
            "properties": {
                "sequence": {
                    "type_": "STRING",
                    "description": "DNA sequence to scan for restriction sites. Must be at least 6 bases long."
                }
            },
            "required": ["sequence"]
        }
    },
    {
        "name": "design_gibson_primers",
        "description": "Design primers for Gibson assembly cloning. Generates primers with homology overhangs to seamlessly join an insert into a vector.",
        "parameters": {
            "type_": "OBJECT",
            "properties": {
                "vector_seq": {
                    "type_": "STRING",
                    "description": "Vector sequence (linearized at insertion site)"
                },
                "insert_seq": {
                    "type_": "STRING",
                    "description": "Insert sequence to clone into the vector"
                },
                "overlap_length": {
                    "type_": "INTEGER",
                    "description": "Length of homology overlap in base pairs. Recommended: 15-40bp. Default: 25"
                }
            },
            "required": ["vector_seq", "insert_seq"]
        }
    }
]


def get_function_declarations():
    """
    Returns function declarations formatted for Gemini API.
    """
    return GEMINI_FUNCTIONS


def get_function_by_name(function_name: str):
    """
    Retrieve a specific function declaration by name.
    
    Args:
        function_name: Name of the function to retrieve
        
    Returns:
        Function declaration dict or None if not found
    """
    for func in GEMINI_FUNCTIONS:
        if func["name"] == function_name:
            return func
    return None
