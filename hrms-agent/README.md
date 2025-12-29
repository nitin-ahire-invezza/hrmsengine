# HRMS Policy Chatbot (RAG + Ollama)

A Retrieval-Augmented Generation (RAG) based chatbot for answering company HR / policy questions using **local LLMs via Ollama**, **LangChain**, and **ChromaDB**.

The system indexes policy PDFs and exposes a REST API that can be consumed by a React frontend or any client.

---

## Features

- PDF-based knowledge ingestion
- Semantic search using ChromaDB
- Local LLM via Ollama (privacy-friendly)
- FastAPI backend
- RAG-based answers (grounded in documents)
- Model-switchable (Llama / Gemma)
---

## Tech Stack

- **Backend**: FastAPI  
- **LLM Runtime**: Ollama  
- **LLM Model**: `llama3.2:1b` (default)  
- **Embeddings**: `sentence-transformers/all-MiniLM-L6-v2`  
- **Vector DB**: ChromaDB  
- **Framework**: LangChain  
- **OS**: Ubuntu / WSL recommended  

## 📁 Project Structure

```
hrms-agent/
├── api.py
├── chat.py
├── ingest-pdf.py
├── requirements.txt
├── README.md
├── policies/
│   └── *.pdf
├── chroma_store/      # generated (NOT committed)
└── .venv/             # virtual env (NOT committed)
```

---

## Important Notes

- `chroma_store/` is **NOT committed to Git**
- Documents must be **re-ingested on every new machine**
- Ollama must be installed on the target machine

---

## Setup Instructions

### System Dependencies

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip build-essential curl git
```

---

### Install Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2:1b
```

---

### Clone Repository

```bash
git clone https://github.com/<your-username>/hrms-agent.git
cd hrms-agent
```

---

### Python Virtual Environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Ingest Policy Documents

Place all policy PDFs in the `policies/` directory, then run:

```bash
python ingest-pdf.py
```

---

### Run the API

```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

---

## Test API

```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"wfh policy"}'
```