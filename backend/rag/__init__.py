from .transcript import get_transcript
from .splitter import split_transcript
from .vectorstore import get_embedding_model, create_vector_store
from .retriever import get_retriever
from .chain import create_rag_chain

def build_rag_chain(video_id: str, languages: list = ["en"]):
    transcript_text = get_transcript(video_id, languages=languages)
    docs = split_transcript(transcript_text)
    embedding_model = get_embedding_model()
    vector_store = create_vector_store(docs, embedding_model)
    retriever = get_retriever(vector_store)
    chain = create_rag_chain(retriever)
    return chain
