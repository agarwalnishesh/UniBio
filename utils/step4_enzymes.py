from Bio.Restriction import CommOnly, Analysis
from Bio.Seq import Seq

def find_restriction_sites(sequence_text):
    """
    Scans a DNA sequence and returns which enzymes cut it,
    and exactly where they cut.
    """
    # 1. Convert text to a DNA object
    dna_seq = Seq(sequence_text)
    
    # 2. Setup the analysis with "CommOnly" (Common Commercial Enzymes)
    # This creates a virtual "lab" with all common enzymes ready to use
    analysis = Analysis(CommOnly, dna_seq)
    
    # 3. Get the results (a dictionary of Enzyme -> Cut Sites)
    result_dictionary = analysis.full()
    
    # 4. Clean up the output for display
    # We only want to see enzymes that actually found a cut site (list is not empty)
    found_enzymes = []
    
    for enzyme, cut_locations in result_dictionary.items():
        if len(cut_locations) > 0:
            found_enzymes.append({
                "enzyme_name": str(enzyme),
                "cut_count": len(cut_locations),
                "cut_positions": cut_locations
            })
            
    return found_enzymes

# --- RUN (takes user input when you run the script) ---
if __name__ == "__main__":
    sequence_input = input("Enter DNA sequence to scan for restriction sites: ").strip().upper()
    if not sequence_input:
        print("No sequence entered. Exiting.")
        exit(1)

    print(f"\nScanning DNA: {sequence_input}")
    results = find_restriction_sites(sequence_input)

    print(f"\nFound {len(results)} enzymes that cut this sequence:")
    for item in results:
        print(f"- {item['enzyme_name']} cuts {item['cut_count']} time(s) at position {item['cut_positions']}")