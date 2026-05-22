from langchain_community.vectorstores import FAISS
from langchain_core.retrievers import BaseRetriever

def get_retriever(vector_store: FAISS, search_type: str = "mmr", k: int = 5) -> BaseRetriever:
    return vector_store.as_retriever(
        search_type=search_type,
        search_kwargs={"k": k}
    )
