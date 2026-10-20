import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, MessageSquare, Bot, User, Loader2 } from 'lucide-react';
import { aiService } from '../services/aiService';
import toast from 'react-hot-toast';

const suggestedPrompts = [
  'Plan a 5-day honeymoon in Goa under ₹60,000',
  'Best solo backpacking trip in India for ₹30,000',
  'What should I pack for a Himalayan trek?',
  'Suggest hidden gems near Jaipur',
  'Budget breakdown for a family trip to Kerala',
  'Best time to visit Ladakh?',
];

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-primary-600' : 'bg-gradient-to-br from-accent to-teal-600'}`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-dark-700 text-slate-200 rounded-tl-sm border border-dark-600'}`}>
        {message.content}
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "👋 Hi! I'm VoyageAI, your personal travel assistant. I can help you plan trips, find hotels, create packing lists, estimate budgets, and suggest amazing destinations. What's your next adventure?" }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { data: historyData } = useQuery({
    queryKey: ['chatHistory'],
    queryFn: () => aiService.getChatHistory().then((r) => r.data.data.sessions),
  });

  const chatMutation = useMutation({
    mutationFn: (message) => aiService.chat({ message, sessionId }),
    onSuccess: (res) => {
      const { reply } = res.data.data;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      queryClient.invalidateQueries(['chatHistory']);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to get response.';
      toast.error(msg);
      setMessages((prev) => prev.slice(0, -1)); // Remove pending message
    },
  });

  const handleSend = (text) => {
    const message = text || input.trim();
    if (!message || chatMutation.isPending) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    chatMutation.mutate(message);
  };

  const handleNewChat = () => {
    setSessionId(crypto.randomUUID());
    setMessages([{ role: 'assistant', content: "👋 Starting fresh! How can I help you plan your next adventure?" }]);
  };

  const loadSession = async (sid) => {
    try {
      const res = await aiService.getChatSession(sid);
      const chat = res.data.data.chat;
      setSessionId(sid);
      setMessages(chat.messages);
    } catch {
      toast.error('Failed to load chat session.');
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Sidebar - Chat History */}
      <div className="hidden lg:flex flex-col w-64 glass-dark rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-dark-700">
          <button onClick={handleNewChat} className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
            <Plus size={16} />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {historyData?.length > 0 ? (
            historyData.map((session) => (
              <button
                key={session.sessionId}
                onClick={() => loadSession(session.sessionId)}
                className={`w-full text-left p-3 rounded-xl hover:bg-dark-700 transition-colors group ${session.sessionId === sessionId ? 'bg-dark-700' : ''}`}
              >
                <div className="text-slate-300 text-sm font-medium truncate">{session.title}</div>
                <div className="text-slate-500 text-xs truncate mt-0.5">{session.lastMessage}</div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">No previous chats</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col glass-dark rounded-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-dark-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-teal-600 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-semibold">VoyageAI Assistant</div>
            <div className="text-slate-400 text-xs flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              Online • AI-powered travel expert
            </div>
          </div>
          <button onClick={handleNewChat} className="ml-auto btn-ghost text-sm flex items-center gap-1 text-slate-400">
            <Plus size={14} /> New
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
          {chatMutation.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-teal-600 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-dark-700 border border-dark-600 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="w-2 h-2 bg-slate-400 rounded-full" animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }} />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {suggestedPrompts.map((p) => (
                <button key={p} onClick={() => handleSend(p)} className="flex-shrink-0 text-xs bg-dark-700 hover:bg-dark-600 text-slate-300 hover:text-white border border-dark-600 hover:border-primary-500/40 px-3 py-2 rounded-xl transition-all">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-dark-700">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask me anything about travel... (Enter to send, Shift+Enter for new line)"
              rows={1}
              className="input-field flex-1 resize-none min-h-[44px] max-h-32 py-3"
              style={{ height: 'auto' }}
              onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'; }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || chatMutation.isPending}
              className="btn-primary p-3 flex-shrink-0 rounded-xl disabled:opacity-50"
            >
              {chatMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <p className="text-slate-600 text-xs mt-2 text-center">Requires Gemini API key in server/.env</p>
        </div>
      </div>
    </div>
  );
}
