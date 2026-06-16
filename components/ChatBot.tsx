import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { createChatSession } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const chat = createChatSession();
      setChatSession(chat);
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: 'سلام! من دستیار هوشمند HR هستم. چطور می‌توانم در طراحی ماتریس شایستگی به شما کمک کنم؟'
      }]);
    } catch (e) { console.error("Failed to init chat", e); }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const aiMsgId = crypto.randomUUID();
      setMessages(prev => [...prev, { id: aiMsgId, role: 'model', text: '' }]);
      const result = await chatSession.sendMessageStream({ message: userMsg.text });
      let fullText = '';
      for await (const chunk of result) {
         const c = chunk as GenerateContentResponse;
         fullText += c.text || '';
         setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m));
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: 'خطایی رخ داد.' }]);
    } finally { setIsLoading(false); }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-6 left-6 z-50 bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 group border-2 border-white dark:border-slate-800">
          <Bot size={28} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 left-6 z-50 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300" style={{ maxHeight: '600px', height: '80vh' }}>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white cursor-pointer" onClick={() => setIsOpen(false)}>
             <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <div>
                    <h3 className="font-bold text-sm">دستیار هوشمند HR</h3>
                    <p className="text-[10px] text-blue-100 opacity-90">مبتنی بر Gemini 3 Pro</p>
                </div>
             </div>
             <Minimize2 size={18} />
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950 space-y-4">
             {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'bg-blue-600 text-white'}`}>
                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm max-w-[80%] leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 dark:bg-blue-700 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'
                    }`}>
                        {msg.text}
                    </div>
                </div>
             ))}
             <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 items-end">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyPress} placeholder="پیام خود را بنویسید..." className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none dark:text-slate-100" rows={1} />
            <button onClick={handleSend} disabled={!input.trim() || isLoading} className="bg-blue-600 dark:bg-blue-700 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-md">
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="rtl:rotate-180" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
};