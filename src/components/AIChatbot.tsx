import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Sprout, MessageSquare, Loader2 } from 'lucide-react';
import { User, LanguageCode } from '../types';
import { api } from '../api';

interface AIChatbotProps {
  user: User | null;
  language: LanguageCode;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({ user, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Namaste! 🙏 I am Kisan Mitra, your AI agricultural advisor powered by Gemini.\n\nAsk me anything! Whether it's crop diseases, organic fertilizers, live Mandi price trends, cold storage preservation, or how FarmiQ's ₹2/km direct delivery works, I'm here to help.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await api.sendChat(textToSend, { language }, user?.role);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.reply || "I am here to assist with all your farming and produce queries.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: "I experienced a temporary connection hiccup with the advisor service. Please try asking again in a moment.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "How to preserve tomatoes for 3 weeks without rotting?",
    "Should I sell my onion harvest today or wait in cold storage?",
    "Explain FarmiQ's ₹2 per km delivery calculation.",
    "Organic pesticide recipe for whiteflies and aphids"
  ];

  return (
    <>
      {/* Floating Small Icon at bottom right (Requested feature) */}
      {!isOpen && (
        <button
          id="btn-open-chatbot"
          onClick={() => setIsOpen(true)}
          title="Ask Kisan Mitra AI"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-tr from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all cursor-pointer group"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-bold font-['Outfit'] hidden sm:inline">
            Ask AI Advisor
          </span>
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[400px] h-[540px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden text-left animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white border border-emerald-500">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  Kisan Mitra AI
                  <span className="text-[10px] bg-emerald-600 px-1.5 py-0.2 rounded font-normal text-emerald-100">
                    Gemini 3.8
                  </span>
                </h3>
                <p className="text-[10px] text-emerald-100">
                  Ask ANY agricultural or marketplace question
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-black/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-emerald-700 text-white rounded-tr-xs'
                      : 'bg-white text-stone-800 border border-stone-200 shadow-2xs rounded-tl-xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-stone-400 mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-stone-500 text-xs bg-white p-3 rounded-2xl border border-stone-200 max-w-[80%]">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                <span>Kisan Mitra is researching advice...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (if few messages) */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-stone-100/70 border-t border-stone-200 flex overflow-x-auto gap-1.5 no-scrollbar">
              {samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sp)}
                  className="px-2.5 py-1 rounded-full bg-white border border-stone-200 text-[10px] font-semibold text-stone-700 hover:text-emerald-800 hover:border-emerald-300 whitespace-nowrap transition"
                >
                  {sp}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Ask anything (e.g. crop health, Mandi price, pest advice)..."
              className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl outline-none focus:border-emerald-600"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white disabled:bg-stone-300 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
