from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from typing import List

def get_embedding_model(model_name: str = "sentence-transformers/all-MiniLM-L6-v2") -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(model_name=model_name)

def create_vector_store(documents: List[Document], embedding_model: HuggingFaceEmbeddings) -> FAISS:
    return FAISS.from_documents(
        documents=documents,
        embedding=embedding_model
    )
