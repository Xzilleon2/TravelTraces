from fastapi import APIRouter
from pydantic import BaseModel
from fastapi import HTTPException

from app.services.ai.ai_service import ask_groq

router = APIRouter()


class ChatRequest(BaseModel):
    message: str

router = APIRouter(
    prefix="/api",
    tags=["AI Chat"]
)

@router.post("/chat")
async def chat(req: ChatRequest):
    try:
        answer = ask_groq(req.message)
        return {"response": answer}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))