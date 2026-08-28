import React, { useState } from 'react';
import { LanguageCode, MedicalDocument } from '../types';
import { askCopilot } from '../api/medpilot';
import { Send, Sparkles, MessageSquare, Bot, User, HelpCircle, ShieldCheck } from 'lucide-react';

interface CopilotChatProps {
  document: MedicalDocument;
  language: LanguageCode;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const CopilotChat: React.FC<CopilotChatProps> = ({ document, language }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Hello! I'm your Medora Copilot for "${document.title}". You can ask me any plain-language question about doses, dietary instructions, lab values, or questions to prepare for your doctor.`,
      timestamp: 'Just now',
    },
  ]);

  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const quickQuestions = [
    'Should I take these with meals?',
    'Why is my lab test marked high?',
    'What should I ask my pharmacist about doses?',
  ];

  const handleSend = async (questionText?: string) => {
    const query = questionText || input.trim();
    if (!query) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setIsTyping(true);

    try {
      const botResponse = await askCopilot(document.id, query, language);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        sender: 'bot',
        text: error instanceof Error ? error.message : 'The assistant could not respond right now.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      id="medora-copilot-chat"
      className="bg-[#120d28]/90 backdrop-blur-xs rounded-2xl border border-[#2d2259] overflow-hidden shadow-xl shadow-purple-950/20 flex flex-col h-[460px]"
    >
      {/* Chat Header */}
      <div className="p-3.5 sm:p-4 bg-[#181135] border-b border-[#261d4a] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-linear-to-r from-[#8b5cf6] to-[#ec4899] flex items-center justify-center text-white shadow-xs shadow-purple-500/50">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
              <span>Medora AI Copilot</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[11px] text-purple-300">Contextual Assistant for {document.title}</p>
          </div>
        </div>

        <span className="text-[10px] uppercase font-bold text-purple-300 bg-[#241a4a] px-2.5 py-1 rounded-full border border-purple-800/50 font-mono">
          Interactive Q&A
        </span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#0e0922]/70">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                msg.sender === 'user'
                  ? 'bg-linear-to-r from-[#8b5cf6] to-[#ec4899] text-white'
                  : 'bg-[#241a4a] text-purple-300 border border-purple-800/40'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-linear-to-r from-[#7c3aed] to-[#9333ea] text-white rounded-tr-xs shadow-md shadow-purple-900/30'
                  : 'bg-[#181135] text-neutral-200 border border-[#2d2259] rounded-tl-xs shadow-xs whitespace-pre-line'
              }`}
            >
              {msg.text}
              <div
                className={`text-[9px] mt-1 ${
                  msg.sender === 'user' ? 'text-purple-200 text-right' : 'text-neutral-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-purple-300 italic p-2 bg-[#181135] rounded-xl w-fit border border-[#2d2259]">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-[#c084fc]" />
            <span>Consulting clinical context...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-[#140e2e] border-t border-[#261d4a] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold text-neutral-400 uppercase shrink-0">Quick Ask:</span>
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-[#1e1545] hover:bg-[#2a1b5c] text-purple-200 border border-[#2d2259] whitespace-nowrap transition-colors cursor-pointer shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-[#181135] border-t border-[#261d4a] flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your prescription or lab results..."
          className="flex-1 bg-[#0f0a24] border border-[#2d2259] focus:border-[#8b5cf6] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2.5 rounded-xl bg-linear-to-r from-[#8b5cf6] to-[#ec4899] hover:from-[#7c3aed] hover:to-[#db2777] text-white disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-purple-950/40"
          aria-label="Send query"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
