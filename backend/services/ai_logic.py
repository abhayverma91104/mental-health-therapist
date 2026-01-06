import google.generativeai as genai
import os

class AILogic:
    def __init__(self):
        self.system_prompt = """
        You are 'Serenity', a supportive mental health companion. 
        - Use the CLINICAL CONTEXT provided to ground your advice in evidence-based practices.
        - If the user expresses intent to harm themselves, provide crisis resources (988) immediately.
        - Maintain a calm, empathetic, and non-judgmental tone.
        - Clearly state you are an AI, not a doctor, if asked for medical diagnosis.
        """
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

    async def generate_response(self, message: str, context: str, audio_path: str = None):
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=self.system_prompt
        )
        
        content_parts = [f"CLINICAL CONTEXT:\n{context}"]
        
        if message:
            content_parts.append(f"USER MESSAGE: {message}")
            
        if audio_path:
            audio_file = genai.upload_file(path=audio_path)
            content_parts.append(audio_file)

        response = model.generate_content(content_parts)
        return response.text