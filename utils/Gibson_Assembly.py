from Bio.Seq import Seq

def design_gibson_primers(vector_seq, insert_seq):
    """
    Creates primers to glue 'insert_seq' into 'vector_seq'.
    """
    # Standard overlap length for Gibson is usually 20-40 base pairs
    OVERLAP_LEN = 25
    
    # 1. Prepare the DNA objects
    # We need the vector to be "linear" (cut open). 
    # Imagine we cut it right at the start/end of the string provided.
    
    # FORWARD PRIMER:
    # Needs to match the START of the insert (to copy it)
    # Plus a tail matching the END of the vector (to stick to it)
    
    # Get the last 25 letters of the vector
    vector_tail = vector_seq[-OVERLAP_LEN:] 
    # Get the first 20 letters of the insert (standard primer length)
    insert_head = insert_seq[:20]
    
    forward_primer = vector_tail + insert_head
    
    # REVERSE PRIMER:
    # Needs to match the END of the insert
    # Plus a tail matching the START of the vector
    
    # For the reverse primer, we need the "Reverse Complement" 
    # because DNA has two strands running in opposite directions.
    
    # Get first 25 letters of vector -> Reverse Complement
    vector_head_rc = str(Seq(vector_seq[:OVERLAP_LEN]).reverse_complement())
    
    # Get last 20 letters of insert -> Reverse Complement
    insert_tail_rc = str(Seq(insert_seq[-20:]).reverse_complement())
    
    reverse_primer = vector_head_rc + insert_tail_rc
    
    return forward_primer, reverse_primer

# --- RUN (takes user input when you run the script) ---
if __name__ == "__main__":
    vector_input = input("Enter vector sequence: ").strip().upper()
    insert_input = input("Enter insert sequence: ").strip().upper()
    if not vector_input or not insert_input:
        print("Both vector and insert sequences are required. Exiting.")
        exit(1)

    print(f"\nVector: {vector_input[:50]}{'...' if len(vector_input) > 50 else ''}")
    print(f"Insert: {insert_input[:50]}{'...' if len(insert_input) > 50 else ''}")

    fwd, rev = design_gibson_primers(vector_input, insert_input)

    print("\n--- RESULTS ---")
    print(f"Forward Primer: {fwd}")
    print(f"Reverse Primer: {rev}")