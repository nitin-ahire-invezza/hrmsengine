# ingest.py

import os
import chromadb
from chromadb.config import Settings

from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter


# ----------------------------
# Configuration (KEEP IN SYNC)
# ----------------------------

PDF_DIR = "./data"
PERSIST_DIR = "./chroma_store"
COLLECTION_NAME = "hrms_policies"

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


# ----------------------------
# Initialize Chroma
# ----------------------------

client = chromadb.PersistentClient(
    path="./chroma_store"
)

embeddings = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL
)

vectorstore = Chroma(
    client=client,
    collection_name=COLLECTION_NAME,
    embedding_function=embeddings,
)

# ----------------------------
# Text splitter
# ----------------------------

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)


# ----------------------------
# Ingest PDFs
# ----------------------------

if not os.path.exists(PDF_DIR):
    raise RuntimeError(f"PDF directory not found: {PDF_DIR}")

pdf_files = [f for f in os.listdir(PDF_DIR) if f.lower().endswith(".pdf")]

if not pdf_files:
    print("⚠️ No PDF files found in data directory.")
else:
    for file in pdf_files:
        pdf_path = os.path.join(PDF_DIR, file)
        print(f"📄 Processing: {pdf_path}")

        loader = PyPDFLoader(pdf_path)
        documents = loader.load()

        # Add clean metadata
        for doc in documents:
            doc.metadata["source"] = file

        # Split into chunks
        chunks = text_splitter.split_documents(documents)

        # Add to Chroma
        vectorstore.add_documents(chunks)

    # Persist to disk
    #client.persist()

    print("✅ All PDFs ingested and persisted successfully!")
