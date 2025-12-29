# chat.py

from langchain_core.prompts import PromptTemplate
from langchain.chains import RetrievalQA

from langchain_community.llms import Ollama
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

from chromadb.config import Settings
import chromadb

# ----------------------------
# Constants
# ----------------------------

PERSIST_DIR = "./chroma_store"
COLLECTION_NAME = "hrms_policies"

PROMPT_TEMPLATE = """
You are an AI assistant answering employee questions using company policy documents.

Instructions:
- Read the entire context carefully.
- Identify which SINGLE policy document is most relevant to the question.
- Answer ONLY from that policy.
- Do NOT mix or merge rules from different policies.
- If multiple policies are present and the answer is unclear, ask for clarification or state which policy you are using.
- Rephrase policies in clear, employee-friendly language.
- Do NOT invent rules.
- If the policy does not specify the answer, say: "The policy document does not specify this."

Context:
{context}

Question:
{question}

Answer:
"""

# ----------------------------
# Lazy singletons (API-safe)
# ----------------------------

_vectorstore = None
_qa_chain = None


def get_vectorstore():
    global _vectorstore

    if _vectorstore is None:
        client = chromadb.PersistentClient(
            path="./chroma_store"
        )

        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        _vectorstore = Chroma(
            client=client,
            collection_name=COLLECTION_NAME,
            embedding_function=embeddings,
        )

    return _vectorstore


def get_qa_chain():
    global _qa_chain

    if _qa_chain is None:
        prompt = PromptTemplate(
            template=PROMPT_TEMPLATE,
            input_variables=["context", "question"],
        )

        retriever = get_vectorstore().as_retriever(
            search_kwargs={"k": 3}
        )

        # llm = Ollama(
        #     model="gemma3:4b",
        #     temperature=0.2,
        # )

        # llm = Ollama(
        #     model="gemma:2b",
        #     temperature=0.25,
        #     keep_alive="30m"
        # )

        llm = Ollama(
            model="llama3.2:1b",
            temperature=0.2,
            keep_alive="30m"
        )

        _qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=retriever,
            chain_type="stuff",
            chain_type_kwargs={"prompt": prompt},
            return_source_documents=True,
        )

    return _qa_chain


# ----------------------------
# Public API function
# ----------------------------

def ask_policy_bot(question: str):
    qa_chain = get_qa_chain()
    result = qa_chain.invoke({"query": question})

    print("\n========== RETRIEVAL DEBUG ==========")
    print("Question:", question)

    for i, doc in enumerate(result["source_documents"], 1):
        print(f"\n--- Document {i} ---")
        print("Source:", doc.metadata.get("source"))
        print(doc.page_content[:800])  # first 800 chars

    print("====================================\n")

    return {
        "answer": result["result"],
        "sources": [d.metadata.get("source") for d in result["source_documents"]],
    }
