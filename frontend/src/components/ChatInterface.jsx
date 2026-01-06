import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Heart } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (audioBlob = null) => {
    if (!input.trim() && !audioBlob) return;

    const formData = new FormData();
    if (input) formData.append('message', input);
    if (audioBlob) formData.append('audio', audioBlob, 'voice.wav');

    const userMsg = { role: 'user', content: input || "🎤 Voice message" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:8000/chat', formData);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto border-x bg-white">
      <header className="p-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Heart className="text-rose-500 fill-rose-500" size={20} />
          <h1 className="font-bold text-slate-700">Serenity</h1>
        </div>
        <span className="text-xs text-green-500 font-medium bg-green-50 px-2 py-1 rounded-full">Secure & Anonymous</span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${
              m.role === 'user' ? 'bg-serenity-600 text-white' : 'bg-white border text-slate-800'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-400 animate-pulse">Serenity is reflecting...</div>}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-2">
          <VoiceRecorder onRecordingComplete={(blob) => handleSend(blob)} />
          <input
            className="flex-1 bg-transparent p-2 outline-none text-sm"
            placeholder="How are you truly feeling?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={() => handleSend()} className="p-2 bg-serenity-600 text-white rounded-xl">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;