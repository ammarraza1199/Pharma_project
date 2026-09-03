import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setInterStoreChatbotModalOpen, sendInterStoreChatMessage, setMultiStoreModalOpen } from '../store/posSlice';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Store,
  Building2,
  PackageCheck,
  ArrowRight,
  MessageSquare
} from 'lucide-react';

export const InterStoreChatbotModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.interStoreChatbotModal);
  const messages = useSelector((state: RootState) => state.pos.chatbotMessages);

  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (modal.isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, modal.isOpen]);

  if (!modal.isOpen) return null;

  const handleClose = () => {
    dispatch(setInterStoreChatbotModalOpen(false));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    dispatch(sendInterStoreChatMessage(input.trim()));
    setInput('');
  };

  const handleQuickPrompt = (promptText: string) => {
    dispatch(sendInterStoreChatMessage(promptText));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              PharmaConnect Bot
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Task #32
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Inter-Store Chatbot for branch stock & transfer queries
            </p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex gap-1.5 overflow-x-auto text-[11px]">
        <button
          onClick={() => handleQuickPrompt('Check stock for Augmentin in Jubilee Hills')}
          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-medium rounded-lg border border-slate-200 shrink-0 transition-colors cursor-pointer"
        >
          🔍 Augmentin in Jubilee Hills
        </button>
        <button
          onClick={() => handleQuickPrompt('Check Dolo 650 in Madhapur')}
          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-medium rounded-lg border border-slate-200 shrink-0 transition-colors cursor-pointer"
        >
          💊 Dolo 650 in Madhapur
        </button>
        <button
          onClick={() => handleQuickPrompt('Show pending borrowed stock')}
          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-medium rounded-lg border border-slate-200 shrink-0 transition-colors cursor-pointer"
        >
          📦 Borrowed Stock Status
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="p-4 h-80 overflow-y-auto space-y-3 bg-slate-100/50">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'PHARMACIST' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1 mb-1 text-[10px] text-slate-400 font-medium px-1">
              <span>{msg.senderName}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`p-3 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed ${
                msg.sender === 'PHARMACIST'
                  ? 'bg-emerald-600 text-white rounded-tr-none shadow-xs'
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-xs'
              }`}
            >
              <p>{msg.text}</p>

              {/* Action Button Payload inside chat bubble */}
              {msg.actionPayload && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {msg.actionPayload.availableBranch || 'Network Action'}
                  </span>
                  <button
                    onClick={() => {
                      dispatch(setInterStoreChatbotModalOpen(false));
                      dispatch(setMultiStoreModalOpen({ isOpen: true }));
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold text-white bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    <span>View Matrix</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Footer */}
      <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask AI bot about branch stock..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
export default InterStoreChatbotModal;
