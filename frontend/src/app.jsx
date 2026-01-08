import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Mic, Send, StopCircle, Sparkles, Loader2 } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorder = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (audioBlob = null) => {
    if (!input.trim() && !audioBlob) return;
    
    const formData = new FormData();
    if (input) formData.append('message', input);
    if (audioBlob) formData.append('audio', audioBlob, 'voice.wav');

    // Add user message to UI
    const userMsg = { role: 'user', content: input || "Voice message sent " };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:8000/chat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      console.error('Error sending message:', err);
      let errorMessage = "I'm having trouble connecting right now. ";
      
      if (err.response) {
        const errorDetail = err.response.data?.detail || err.response.data?.message || 'Unknown error';
        if (errorDetail.includes('quota') || errorDetail.includes('429')) {
          errorMessage = "⚠️ API quota exceeded. Please check your Gemini API key and billing settings, or try again later.";
        } else {
          errorMessage = `Error: ${errorDetail}`;
        }
      } else if (err.request) {
        errorMessage = "Could not connect to the server. Please make sure the backend is running on port 8000.";
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage,
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      let chunks = [];
      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        sendMessage(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "⚠️ Could not access microphone. Please check your browser permissions.",
        isError: true
      }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans antialiased">
      {/* Header */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                Serenity
              </h1>
              <p className="text-xs text-slate-500 font-medium">Your safe space to share</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-700 font-medium">Online</span>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-12">
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Welcome to Serenity</h2>
              <p className="text-slate-600 max-w-md leading-relaxed">
                I'm here to listen and support you. Share what's on your mind, and I'll respond with care and understanding.
              </p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div 
              key={i} 
              className={`flex items-start gap-3 animate-fade-in ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {m.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                  <Sparkles className="text-white" size={16} />
                </div>
              )}
              <div 
                className={`group relative max-w-[75%] ${
                  m.role === 'user' ? 'ml-auto' : ''
                }`}
              >
                <div 
                  className={`px-5 py-3.5 rounded-2xl shadow-sm transition-all duration-200 ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : m.isError
                      ? 'bg-red-50 border border-red-200 text-red-800 rounded-bl-md'
                      : 'bg-white border border-slate-200/60 text-slate-800 rounded-bl-md hover:shadow-md'
                  }`}
                >
                  <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user' ? 'text-white' : 'text-slate-700'
                  }`}>
                    {m.content}
                  </p>
                </div>
              </div>
              {m.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center shadow-md">
                  <span className="text-white text-xs font-semibold">You</span>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                <Sparkles className="text-white" size={16} />
              </div>
              <div className="px-5 py-3.5 bg-white border border-slate-200/60 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex items-center gap-1.5">
                  <Loader2 className="text-blue-600 animate-spin" size={16} />
                  <span className="text-sm text-slate-500">Serenity is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="px-4 py-4 bg-white/80 backdrop-blur-md border-t border-slate-200/60">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-white rounded-2xl border border-slate-200/60 shadow-lg p-2.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 transition-all">
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className={`flex-shrink-0 p-3 rounded-xl transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-500 text-white shadow-lg scale-105 animate-pulse' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
            </button>
            
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                className="w-full bg-transparent resize-none outline-none text-slate-700 placeholder:text-slate-400 text-[15px] leading-6 py-2.5 px-2 max-h-32 overflow-y-auto"
                placeholder="Share what's on your mind..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                disabled={isLoading || isRecording}
              />
            </div>
            
            <button 
              onClick={() => sendMessage()} 
              disabled={(!input.trim() && !isRecording) || isLoading}
              className={`flex-shrink-0 p-3 rounded-xl transition-all duration-200 ${
                (input.trim() || isRecording) && !isLoading
                  ? 'bg-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 hover:bg-blue-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
          
          {isRecording && (
            <div className="mt-2 text-center">
              <span className="text-xs text-red-600 font-medium flex items-center justify-center gap-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Recording... Click to stop
              </span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;