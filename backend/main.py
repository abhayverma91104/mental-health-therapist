import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from services.rag_engine import RAGEngine
from services.ai_logic import AILogic
import shutil
import uuid

load_dotenv()
app = FastAPI()

# Allow Frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = RAGEngine()
ai_logic = AILogic()

@app.on_event("startup")
def startup_event():
    # Ingest PDFs when the server starts
    rag.ingest_pdfs()

@app.post("/chat")
async def chat_endpoint(
    message: str = Form(None), 
    audio: UploadFile = File(None)
):
    temp_path = None
    try:
        # 1. Get RAG Context
        query_for_rag = message if message else "emotional distress"
        context = rag.get_context(query_for_rag)

        # 2. Handle Audio Input
        if audio:
            unique_id = uuid.uuid4().hex
            temp_path = f"temp_{unique_id}_{audio.filename}"
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(audio.file, buffer)

        # 3. Generate AI Response using AILogic
        response_text = await ai_logic.generate_response(
            message=message,
            context=context,
            audio_path=temp_path
        )
        
        return {"reply": response_text}

    except Exception as e:
        error_msg = str(e)
        # Provide user-friendly error messages
        if "quota" in error_msg.lower() or "429" in error_msg:
            raise HTTPException(
                status_code=429, 
                detail="API quota exceeded. Please check your Gemini API key, billing settings, or try again later."
            )
        elif "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            raise HTTPException(
                status_code=401,
                detail="Invalid API key. Please check your GEMINI_API_KEY in the .env file."
            )
        else:
            raise HTTPException(status_code=500, detail=f"Error: {error_msg}")
    finally:
        # Cleanup temp audio file
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)