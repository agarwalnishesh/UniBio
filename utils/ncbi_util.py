import os
from Bio import Entrez, SeqIO
from dotenv import load_dotenv
import io

# Load environment variables
load_dotenv()

# NCBI requires an email address for API usage
Entrez.email = os.getenv("NCBI_EMAIL", "your.email@example.com")
NCBI_API_KEY = os.getenv("NCBI_API_KEY")
if NCBI_API_KEY:
    Entrez.api_key = NCBI_API_KEY

class NCBIUtil:
    """
    Utility class for interacting with NCBI Entrez API.
    """
    
    @staticmethod
    def search_nucleotide(query: str, retmax: int = 5):
        """
        Search the nucleotide database for a given query.
        
        Args:
            query: Search term (e.g., "human insulin")
            retmax: Maximum number of results to return
            
        Returns:
            List of dictionaries containing accession IDs and titles
        """
        try:
            # IMPROVEMENT: Prioritize RefSeq for gene searches to get high-quality results
            search_term = query
            if ("gene" in query.lower() or "insulin" in query.lower() or "human" in query.lower()) and "prop" not in query.lower():
                search_term = f"({query}) AND srcdb_refseq[PROP]"
                
            handle = Entrez.esearch(db="nucleotide", term=search_term, retmax=retmax, sort="relevance")
            record = Entrez.read(handle)
            handle.close()
            
            ids = record.get("IdList", [])
            if not ids:
                # Fallback to original query if RefSeq returns nothing
                handle = Entrez.esearch(db="nucleotide", term=query, retmax=retmax, sort="relevance")
                record = Entrez.read(handle)
                handle.close()
                ids = record.get("IdList", [])
                
            if not ids:
                return []
                
            # Fetch summaries for these IDs to get titles
            summary_handle = Entrez.esummary(db="nucleotide", id=",".join(ids))
            summaries = Entrez.read(summary_handle)
            summary_handle.close()
            
            results = []
            for summary in summaries:
                results.append({
                    "accession": summary.get("Caption", ""),
                    "title": summary.get("Title", ""),
                    "id": summary.get("Id", ""),
                    "length": summary.get("Length", 0)
                })
            return results
            
        except Exception as e:
            print(f"Error searching NCBI: {e}")
            return []

    @staticmethod
    def fetch_sequence(accession_id: str):
        """
        Fetch a sequence from NCBI by accession ID.
        
        Args:
            accession_id: NCBI accession ID (e.g., "NM_000600")
            
        Returns:
            Dictionary containing sequence and metadata
        """
        try:
            handle = Entrez.efetch(db="nucleotide", id=accession_id, rettype="fasta", retmode="text")
            fasta_data = handle.read()
            handle.close()
            
            # Parse FASTA to get clean sequence and description
            fasta_io = io.StringIO(fasta_data)
            record = SeqIO.read(fasta_io, "fasta")
            
            return {
                "accession": record.id,
                "description": record.description,
                "sequence": str(record.seq).upper(),
                "length": len(record.seq)
            }
            
        except Exception as e:
            print(f"Error fetching from NCBI: {e}")
            return None
