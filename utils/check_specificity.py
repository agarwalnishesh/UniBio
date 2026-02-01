# utils.py

def check_specificity(primer_seq: str, template_seq: str) -> dict:
    """
    Checks if a primer binds to the template exactly once.
    Handles both DNA strands and circular topology.
    
    Args:
        primer_seq: The primer sequence (5' to 3')
        template_seq: The full plasmid/gene sequence
        
    Returns:
        dict: {'is_specific': bool, 'count': int}
    """
    # 1. Standardize inputs
    primer = primer_seq.upper()
    template = template_seq.upper()
    
    # 2. Handle circular topology (append the start of sequence to the end)
    # This ensures we catch matches that wrap around the plasmid origin
    search_space = template + template[:len(primer)]
    
    # 3. Create Reverse Complement
    # Trans switch: A->T, T->A, G->C, C->G
    trans_table = str.maketrans("ATGC", "TGCA")
    primer_rc = primer.translate(trans_table)[::-1]
    
    # 4. Count matches on BOTH strands
    # Matches in 'search_space' = binding to bottom strand
    fwd_matches = search_space.count(primer)
    
    # Matches of RC in 'search_space' = binding to top strand
    rev_matches = search_space.count(primer_rc)
    
    total_matches = fwd_matches + rev_matches
    
    return {
        "is_specific": total_matches == 1,
        "count": total_matches,
        "warning": None if total_matches == 1 else f"Primer binds {total_matches} times"
    }
