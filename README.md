# UniBio

**UniBio** is a molecular biology research platform that combines lab tools (primer design, restriction analysis, Gibson assembly, NCBI search) with an AI assistant powered by Google Gemini. Use the web UI to run analyses and chat with the agent to automate workflows.

---

## Features

| Category | Tools |
|----------|--------|
| **Cloning & primer design** | Primer Design (PCR primers with Tm/GC), Restriction Finder, Gibson Assembly |
| **Search & discovery** | NCBI Search (GenBank sequences), Paper Search (PubMed) |
| **AI assistant** | Right-sidebar chat that can run tools, show charts, and answer biology questions |

- **Primer Design** — Design PCR primer pairs (Primer3), with Tm, GC%, product size; analyze single primers and check compatibility/specificity.
- **Restriction Finder** — Find restriction enzyme cut sites in DNA (linear or circular); filter by common enzymes or full set.
- **Gibson Assembly** — Design overlapping primers for isothermal assembly of multiple fragments.
- **NCBI Search** — Search NCBI nucleotide database and fetch sequences by accession; view and copy FASTA.
- **Paper Search** — Search PubMed for research papers and fetch details by PMID.
- **AI Assistant** — Chat with a Gemini-backed agent that can call the above tools, summarize results, and render charts (e.g. Tm bar charts, restriction maps, GC content).

---

## Tech stack

- **Backend:** Python 3, FastAPI, Uvicorn, Pydantic  
- **Biology:** Biopython, Primer3 (`primer3-py`), NCBI Entrez, PubMed  
- **AI:** Google Gemini (generativeai), optional DuckDuckGo/SerpAPI for web search  
- **Frontend:** React 19, TypeScript, Vite, Heroicons  
- **Charts:** Custom React components (bar, pie, heatmap, linear maps) for tool results and chat

---

## Project structure

```
UniBio/
├── main.py              # FastAPI app and routes
├── models.py            # Pydantic request/response models
├── gemini_agent.py      # Gemini chat + function calling
├── gemini_functions.py  # Tool definitions for Gemini
├── tool_executor.py     # HTTP-based tool execution
├── tool_executor_direct.py  # Direct (in-process) tool execution
├── utils/               # Biology utilities
│   ├── primer3_util.py
│   ├── Restriction_Enzyme.py
│   ├── Gibson_Assembly.py
│   ├── ncbi_util.py
│   ├── pubmed_util.py
│   └── ...
├── frontend/            # React + Vite app
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/   # AgentChat, Sidebar, Dashboard, tools, charts
│   │   ├── services/api.ts
│   │   ├── context/
│   │   └── types.ts
│   ├── package.json
│   └── vite.config.ts
├── .env                  # Backend env (see below)
├── requirements.txt
└── README.md
```

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- **Gemini API key** (for AI chat) — [Google AI Studio](https://aistudio.google.com/apikey)
- **NCBI email** (required for NCBI/PubMed) — [NCBI account](https://www.ncbi.nlm.nih.gov/account/)
- **NCBI API key** (optional but recommended for higher rate limits) — [NCBI API key](https://www.ncbi.nlm.nih.gov/account/settings/)

---

## Environment variables

Create a `.env` file in the **project root** (backend):

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes (for AI) | Google Gemini API key |
| `DEFAULT_GEMINI_MODEL` | No | e.g. `gemini-2.5-flash-lite` (default used if unset) |
| `API_BASE_URL` | No | Backend URL for tool executor; default `http://localhost:8000` |
| `NCBI_EMAIL` | Yes (for NCBI) | Email for NCBI Entrez |
| `NCBI_API_KEY` | No | NCBI API key for higher rate limits |
| `SERPAPI_KEY` | No | For SerpAPI web/scholar search (optional) |

Do **not** commit `.env` or put real keys in the README.

---

## Setup and run

### 1. Backend

```bash
cd UniBio
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
```

Copy or create `.env` in the project root with at least `GEMINI_API_KEY` and `NCBI_EMAIL`.

```bash
python main.py
```

API runs at **http://localhost:8000**. Interactive docs: **http://localhost:8000/docs**.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173** (or the port Vite prints). It talks to the backend at `http://localhost:8000` (see `frontend/services/api.ts` if you need to change the base URL).

### 3. Use the app

- Open the frontend URL in a browser.
- Use the **sidebar** or **Dashboard** to open tools (Primer Design, Restriction Finder, Gibson Assembly, NCBI Search, Paper Search).
- Open the **AI Assistant** (right sidebar) to chat; it can run the same tools and show inline charts.

---

## API overview

| Endpoint | Description |
|----------|-------------|
| `GET /`, `GET /health` | Health check |
| `POST /design-primers` | Design PCR primers |
| `POST /analyze-primer` | Analyze single primer |
| `POST /check-compatibility` | Primer pair dimer check |
| `POST /check-specificity` | Primer specificity vs template |
| `POST /find-restriction-sites` | Restriction sites in sequence |
| `POST /design-gibson` | Gibson assembly overlaps |
| `POST /ncbi-search` | Search NCBI nucleotide |
| `POST /ncbi-fetch` | Fetch sequence by accession |
| `POST /search-papers` | Search PubMed |
| `POST /fetch-paper` | Fetch paper by PMID |
| `POST /chat` | AI chat (Gemini + tools) |
| `GET /chat/models` | List available chat models |

Full request/response schemas: **http://localhost:8000/docs**.

---

## License

Use and modify as needed for your project. If you redistribute, keep attribution to the original authors.
