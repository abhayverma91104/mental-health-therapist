# Serenity - Mental Health Companion

A mental health therapy companion application powered by Google Gemini AI with RAG (Retrieval Augmented Generation) capabilities.

## Features

- 🤖 AI-powered mental health support using Google Gemini
- 📚 RAG-based responses using clinical knowledge base
- 🎤 Voice input support
- 💬 Text chat interface
- 🔒 Secure and anonymous interactions

## Prerequisites

- Python 3.9+
- Node.js 16+ and npm
- Google Gemini API key

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Activate the virtual environment:
```bash
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows
```

3. Install dependencies (if not already installed):
```bash
pip install -r requirements.txt
```

4. Set up your environment variables:
   - The `.env` file should already exist in the `backend` directory
   - Make sure it contains your Google Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

5. Start the backend server:
```bash
python main.py
```

The backend will run on `http://localhost:8000`

### 2. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

## Running the Project

You need to run both the backend and frontend servers simultaneously:

### Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate
python main.py
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Then open your browser and navigate to the frontend URL (usually `http://localhost:5173`)

## API Endpoints

- `POST /chat` - Send a message or audio file to the AI
  - Form data:
    - `message` (optional): Text message
    - `audio` (optional): Audio file

## Notes

- The backend will automatically ingest PDFs from the `knowledge_base` directory on startup
- Make sure your Google Gemini API key has access to the required models
- The RAG system uses ChromaDB for vector storage

