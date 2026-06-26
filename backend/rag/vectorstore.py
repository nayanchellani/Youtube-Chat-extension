from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from typing import List

def get_embedding_model(model_name: str = "models/gemini-embedding-001") -> GoogleGenerativeAIEmbeddings:
    return GoogleGenerativeAIEmbeddings(model=model_name)

def create_vector_store(documents: List[Document], embedding_model: GoogleGenerativeAIEmbeddings) -> FAISS:
    return FAISS.from_documents(
        documents=documents,
        embedding=embedding_model
    )
