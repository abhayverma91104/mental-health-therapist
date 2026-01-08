import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import google.generativeai as genai
from services.rag_engine import RAGEngine
import shutil

load_dotenv()
app = FastAPI()

# Allow Frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
rag = RAGEngine()

SYSTEM_PROMPT = """
You are 'Serenity', a supportive mental health companion. 
1. Use the provided CLINICAL CONTEXT to guide your advice.
2. If the user mentions self-harm, immediately prioritize safety resources.
3. Be empathetic, concise, and non-judgmental.
4. You are an AI, not a clinical doctor.
"""

@app.on_event("startup")
def startup_event():
    # Ingest PDFs when the server starts
    rag.ingest_pdfs()

@app.post("/chat")
async def chat_endpoint(
    message: str = Form(None), 
    audio: UploadFile = File(None)
):
    try:
        # Use model from env or default to gemini-1.5-flash (more stable free tier)
        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        model = genai.GenerativeModel(
            model_name=model_name, 
            system_instruction=SYSTEM_PROMPT
        )
        
        prompt_parts = []

        # 1. Handle RAG Context
        query_for_rag = message if message else "emotional distress"
        context = rag.get_context(query_for_rag)
        prompt_parts.append(f"CLINICAL CONTEXT:\n{context}")

        # 2. Handle Text Input
        if message:
            prompt_parts.append(f"USER MESSAGE: {message}")

        # 3. Handle Audio Input
        if audio:
            temp_path = f"temp_{audio.filename}"
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(audio.file, buffer)
            
            audio_upload = genai.upload_file(path=temp_path)
            prompt_parts.append(audio_upload)
            os.remove(temp_path) # cleanup

        # 4. Generate AI Response
        response = model.generate_content(prompt_parts)
        return {"reply": response.text}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)