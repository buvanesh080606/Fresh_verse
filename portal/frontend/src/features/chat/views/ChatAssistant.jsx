import React, { useState, useRef, useEffect } from 'react';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import SparkleLogo from '../../../components/ui/SparkleLogo';
import { Send, User, Sparkles, AlertCircle } from 'lucide-react';

const ChatAssistant = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I'm the FreshVerse AI Campus Assistant. I can look up your timetable, locate faculty cabins, check bus schedules, or provide info on upcoming events. How can I help you today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const presets = [
    "What's my next class?",
    "Show bus timings",
    "Where is AI Lab?",
    "Upcoming events",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend) => {
    const text = textToSend || query;
    if (!text.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setQuery('');
    setLoading(true);

    try {
      const response = await api.post('ai/chat/', {
        query: text,
        chat_history: messages.slice(-10).map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: response.data.response },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "I'm sorry, I encountered an issue connecting to the database server. Please check your network connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] text-left max-w-5xl mx-auto p-1">
      {/* Assistant Header */}
      <div className="flex items-center gap-3 border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4 flex-shrink-0">
        <div className="p-2.5 bg-accent/10 rounded-2xl flex items-center justify-center">
          <SparkleLogo size={24} className="animate-bounce" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-brand-text dark:text-brand-text-dark flex items-center gap-2">
            Gemini Campus Assistant <Sparkles className="w-4 h-4 text-accent" />
          </h2>
          <p className="text-xs text-brand-text/60 dark:text-brand-text-dark/60">
            Answers queries strictly constrained to campus database information.
          </p>
        </div>
      </div>

      {/* Messages Deck */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 px-2">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 max-w-[80%] ${
              m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                m.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-brand-border/30 dark:bg-brand-border-dark/30'
              }`}
            >
              {m.role === 'user'
                ? <User className="w-4.5 h-4.5" />
                : <SparkleLogo size={18} />
              }
            </div>

            {/* Bubble */}
            <div
              className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm border ${
                m.role === 'user'
                  ? 'bg-accent border-accent text-white rounded-tr-none'
                  : 'glass-chat border-brand-border/25 text-brand-text dark:text-brand-text-dark rounded-tl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center">
            <div className="w-9 h-9 rounded-xl bg-brand-border/30 dark:bg-brand-border-dark/30 flex items-center justify-center flex-shrink-0">
              <SparkleLogo size={18} />
            </div>
            <div className="glass-chat border border-brand-border/25 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Chips & Input Bar */}
      <div className="pt-4 border-t border-brand-border/20 dark:border-brand-border-dark/20 flex-shrink-0 space-y-4">
        {/* Presets */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2.5 justify-start">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="px-4 py-2 text-xs rounded-full bg-[#7C2D12]/10 hover:bg-[#7C2D12]/15 dark:bg-accent/15 dark:hover:bg-accent/25 text-[#5c2a18] dark:text-[#f3d9cb] font-bold border border-[#7C2D12]/10 dark:border-accent/15 transition-all duration-150 cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="relative flex items-center rounded-2xl border border-[#7C2D12]/30 dark:border-brand-border-dark/45 bg-[#7C2D12]/5 dark:bg-brand-card-dark/60 p-1.5 focus-within:ring-2 focus-within:ring-[#7C2D12]/30 focus-within:border-[#7C2D12] transition-all">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about classes, professors, hostels..."
            className="flex-1 min-w-0 bg-transparent border-0 focus:outline-none focus:ring-0 px-3.5 py-2.5 text-sm text-[#4a2315] dark:text-brand-text-dark placeholder-[#7C2D12]/50 dark:placeholder-brand-text-dark/40"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !query.trim()}
            className="p-3 rounded-xl bg-[#7C2D12] hover:bg-[#7C2D12]/95 text-white shadow-md shadow-[#7C2D12]/20 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>

        <p className="text-[10px] text-center text-brand-text/45 dark:text-brand-text-dark/45">
          FreshVerse AI checks timetable, hostel, and directory context before prompting. Non-campus questions will be restricted.
        </p>
      </div>
    </div>
  );
};

export default ChatAssistant;
