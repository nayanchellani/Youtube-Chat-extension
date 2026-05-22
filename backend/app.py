from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from backend.rag import build_rag_chain

load_dotenv()

app = FastAPI(title="YouTube Chatbot RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

active_chains = {}

class InitializeRequest(BaseModel):
    video_id: str

class ChatRequest(BaseModel):
    video_id: str
    question: str

@app.get("/")
def read_root():
    return {"message": "YouTube Chatbot RAG Backend is running successfully!"}

@app.post("/api/initialize")
def initialize_bot(request: InitializeRequest):
    video_id = request.video_id
    if not video_id:
        raise HTTPException(status_code=400, detail="video_id is required")
        
    if video_id in active_chains:
        return {
            "status": "success", 
            "message": f"Chatbot already initialized for video {video_id}"
        }
        
    try:
        print(f"Initializing RAG chain for video: {video_id}...")
        chain = build_rag_chain(video_id)
        active_chains[video_id] = chain
        return {
            "status": "success", 
            "message": f"Chatbot initialized successfully for video {video_id}"
        }
    except Exception as e:
        print(f"Initialization error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to initialize video: {str(e)}"
        )

@app.post("/api/chat")
def chat(request: ChatRequest):
    video_id = request.video_id
    question = request.question
    
    if not video_id or not question:
        raise HTTPException(status_code=400, detail="video_id and question are required")
        
    if video_id not in active_chains:
        try:
            print(f"Auto-initializing RAG chain for video: {video_id}...")
            chain = build_rag_chain(video_id)
            active_chains[video_id] = chain
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Could not automatically initialize video transcript: {str(e)}"
            )
            
    chain = active_chains[video_id]
    
    try:
        print(f"Invoking chain for video {video_id} with question: '{question}'")
        answer = chain.invoke(question)
        return {"answer": answer}
    except Exception as e:
        print(f"Inference error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate answer: {str(e)}"
        )
