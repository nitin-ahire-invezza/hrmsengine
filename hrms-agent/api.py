# api.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from chat import ask_policy_bot

app = FastAPI(title="Invezza Policy RAG API")

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]


@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    return ask_policy_bot(req.message)
