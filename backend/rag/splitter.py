from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from typing import List

def split_transcript(transcript_text: str, chunk_size: int = 700, chunk_overlap: int = 100) -> List[Document]:
    docs = [Document(
        page_content=transcript_text,
        metadata={"source": "youtube"}
    )]
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    return splitter.split_documents(docs)
