import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Mic, Send, StopCircle, Heart } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);

  const sendMessage = async (audioBlob = null) => {
    const formData = new FormData();
    if (input) formData.append('message', input);
    if (audioBlob) formData.append('audio', audioBlob, 'voice.wav');

    // Add user message to UI
    const userMsg = { role: 'user', content: input || "🎤 Voice note" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const res = await axios.post('http://localhost:8000/chat', formData);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      console.error(err);
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    let chunks = [];
    mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      sendMessage(blob);
    };
    mediaRecorder.current.start();
    setIsRecording(true);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <header className="p-4 bg-white border-b flex justify-center items-center gap-2">
        <Heart className="text-rose-400" />
        <h1 className="text-xl font-semibold text-slate-700">Serenity Safe Space</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[85%] ${
              m.role === 'user' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border text-slate-800 shadow-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
      </main>

      <footer className="p-4 bg-white border-t">
        <div className="max-w-2xl mx-auto flex items-center gap-2 bg-slate-100 p-2 rounded-full">
          <button 
            onClick={isRecording ? () => mediaRecorder.current.stop() : startRecording}
            className={`p-3 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            {isRecording ? <StopCircle /> : <Mic />}
          </button>
          <input 
            className="flex-1 bg-transparent p-2 outline-none text-slate-700"
            placeholder="Tell me what's on your mind..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={() => sendMessage()} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition">
            <Send size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;