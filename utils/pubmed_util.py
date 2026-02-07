"""
PubMed research paper search utility using NCBI Entrez API.
Leverages the same BioPython Entrez module used for sequence searching.
"""
import os
from Bio import Entrez, Medline
from dotenv import load_dotenv
from typing import List, Dict, Optional

# Load environment variables
load_dotenv()

# Reuse NCBI configuration (same as ncbi_util.py)
Entrez.email = os.getenv("NCBI_EMAIL", "your.email@example.com")
NCBI_API_KEY = os.getenv("NCBI_API_KEY")
if NCBI_API_KEY:
    Entrez.api_key = NCBI_API_KEY


class PubMedUtil:
    """
    Utility class for searching and fetching research papers from PubMed
    via the NCBI Entrez API.
    """

    @staticmethod
    def search_papers(
        query: str,
        max_results: int = 10,
        sort: str = "relevance"
    ) -> List[Dict]:
        """
        Search PubMed for research papers matching a query.

        Args:
            query: Search term (e.g., "CRISPR cas9 gene editing",
                   "primer design PCR optimization")
            max_results: Maximum number of results to return (1-50)
            sort: Sort order - "relevance", "pub_date", or "first_author"

        Returns:
            List of dicts with paper metadata (pmid, title, authors,
            journal, year, abstract snippet, doi)
        """
        try:
            # Map user-friendly sort names to Entrez sort values
            sort_map = {
                "relevance": "relevance",
                "pub_date": "pub_date",
                "date": "pub_date",
                "first_author": "first_author",
                "author": "first_author",
            }
            entrez_sort = sort_map.get(sort, "relevance")

            # Search PubMed
            handle = Entrez.esearch(
                db="pubmed",
                term=query,
                retmax=max_results,
                sort=entrez_sort,
                usehistory="y",
            )
            search_results = Entrez.read(handle)
            handle.close()

            id_list = search_results.get("IdList", [])
            total_count = int(search_results.get("Count", 0))

            if not id_list:
                return []

            # Fetch summaries for the found papers
            papers = PubMedUtil._fetch_paper_summaries(id_list)

            # Attach total count to the first result for reference
            if papers:
                papers[0]["_total_results"] = total_count

            return papers

        except Exception as e:
            print(f"Error searching PubMed: {e}")
            return []

    @staticmethod
    def _fetch_paper_summaries(pmids: List[str]) -> List[Dict]:
        """
        Fetch detailed summaries for a list of PubMed IDs using Medline format.

        Args:
            pmids: List of PubMed IDs

        Returns:
            List of paper metadata dicts
        """
        try:
            handle = Entrez.efetch(
                db="pubmed",
                id=",".join(pmids),
                rettype="medline",
                retmode="text",
            )
            records = Medline.parse(handle)

            papers = []
            for record in records:
                # Extract authors
                authors = record.get("AU", [])
                author_str = ", ".join(authors[:3])
                if len(authors) > 3:
                    author_str += f" et al. (+{len(authors) - 3} more)"

                # Extract year from date
                date = record.get("DP", "")
                year = date[:4] if len(date) >= 4 else ""

                # Extract abstract (may be a list)
                abstract = record.get("AB", "")
                if isinstance(abstract, list):
                    abstract = " ".join(abstract)

                # Truncate abstract for preview
                abstract_preview = abstract[:300] + "..." if len(abstract) > 300 else abstract

                # Extract DOI from Article Identifier field
                doi = ""
                aid_list = record.get("AID", [])
                for aid in aid_list:
                    if "[doi]" in aid:
                        doi = aid.replace(" [doi]", "")
                        break

                # Extract PMID
                pmid = record.get("PMID", "")

                papers.append({
                    "pmid": pmid,
                    "title": record.get("TI", "No title available"),
                    "authors": author_str,
                    "authors_full": authors,
                    "journal": record.get("JT", record.get("TA", "")),
                    "journal_abbrev": record.get("TA", ""),
                    "year": year,
                    "date": date,
                    "abstract_preview": abstract_preview,
                    "doi": doi,
                    "pubmed_url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else "",
                    "publication_type": record.get("PT", []),
                    "mesh_terms": record.get("MH", []),
                })

            handle.close()
            return papers

        except Exception as e:
            print(f"Error fetching paper summaries: {e}")
            return []

    @staticmethod
    def fetch_paper_details(pmid: str) -> Optional[Dict]:
        """
        Fetch full details for a single paper by PubMed ID.

        Args:
            pmid: PubMed ID (e.g., "12345678")

        Returns:
            Dict with full paper metadata including complete abstract,
            or None if not found
        """
        try:
            handle = Entrez.efetch(
                db="pubmed",
                id=pmid,
                rettype="medline",
                retmode="text",
            )
            records = list(Medline.parse(handle))
            handle.close()

            if not records:
                return None

            record = records[0]

            # Extract authors
            authors = record.get("AU", [])
            author_str = ", ".join(authors)

            # Extract DOI
            doi = ""
            aid_list = record.get("AID", [])
            for aid in aid_list:
                if "[doi]" in aid:
                    doi = aid.replace(" [doi]", "")
                    break

            # Extract year from date
            date = record.get("DP", "")
            year = date[:4] if len(date) >= 4 else ""

            # Full abstract
            abstract = record.get("AB", "No abstract available.")
            if isinstance(abstract, list):
                abstract = " ".join(abstract)

            return {
                "pmid": record.get("PMID", pmid),
                "title": record.get("TI", "No title available"),
                "authors": author_str,
                "authors_list": authors,
                "journal": record.get("JT", record.get("TA", "")),
                "journal_abbrev": record.get("TA", ""),
                "year": year,
                "date": date,
                "abstract": abstract,
                "doi": doi,
                "pubmed_url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                "publication_type": record.get("PT", []),
                "mesh_terms": record.get("MH", []),
                "keywords": record.get("OT", []),
                "language": record.get("LA", []),
                "source": record.get("SO", ""),
            }

        except Exception as e:
            print(f"Error fetching paper details: {e}")
            return None
