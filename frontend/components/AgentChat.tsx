import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, SparklesIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';
import { ChatBubbleLeftRightIcon, BeakerIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import { api, FunctionCall } from '../services/api';
import { ChatMessage, ToolId } from '../types';

const AgentChat: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Initial welcome message is marked as a system message (not sent to API)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'welcome', 
      role: 'model', 
      text: "Hello! I'm your UniBio research assistant powered by AI. I can help you:\n\n• Design PCR primers\n• Find restriction sites\n• Plan Gibson assemblies\n• Search NCBI databases\n\nWhat would you like to work on today?",
      isToolCall: false // This is a UI-only message
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { setActiveTool, updateToolData, setIsAgentProcessing } = useApp();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsThinking(true);
    setIsAgentProcessing(true);

    try {
      // Prepare history for the API (exclude welcome message and tool calls)
      const historyForApi = updatedMessages
        .filter(m => !m.isToolCall && m.id !== 'welcome')
        .map(m => ({ role: m.role, text: m.text }));
      
      // Call the backend /chat endpoint with history
      const response = await api.chat(input, historyForApi);
      
      if (response.success) {
        // Handle any function calls made by the agent
        if (response.function_calls && response.function_calls.length > 0) {
          for (const fc of response.function_calls) {
            setMessages(prev => [...prev, { 
              id: Date.now().toString() + '_tool_' + fc.function, 
              role: 'model', 
              text: `🔧 Called: ${fc.function}`,
              isToolCall: true,
              toolName: fc.function
            }]);
          }
        }

        // Add the AI response
        if (response.response) {
          setMessages(prev => [...prev, { 
            id: Date.now().toString() + '_response', 
            role: 'model', 
            text: response.response 
          }]);
        }
      } else {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'model', 
          text: `Sorry, I encountered an error: ${response.error || 'Unknown error'}` 
        }]);
      }

    } catch (error: any) {
      console.error(error);
      let errorMessage = "Sorry, I encountered an error processing that request.";
      
      if (error.message?.includes('Cannot connect to server')) {
        errorMessage = "Cannot connect to the backend server. Please make sure it's running on localhost:8000.";
      }
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: errorMessage 
      }]);
    } finally {
      setIsThinking(false);
      setIsAgentProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  // Collapsed sidebar - just a thin strip with expand button
  if (isCollapsed) {
    return (
      <div className="w-12 bg-slate-900 border-l border-slate-800 flex flex-col items-center py-4 h-full">
        <button 
          onClick={() => setIsCollapsed(false)}
          className="w-10 h-10 bg-brand-600 hover:bg-brand-500 text-white rounded-lg flex items-center justify-center transition-colors group"
          title="Expand AI Assistant"
        >
          <ChevronLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
        <div className="mt-4 flex flex-col items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-brand-400" />
          <span className="text-xs text-slate-500 writing-mode-vertical transform rotate-180" style={{ writingMode: 'vertical-rl' }}>
            AI Assistant
          </span>
        </div>
      </div>
    );
  }

  // Expanded sidebar
  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center justify-between text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-brand-400" />
          <h3 className="font-semibold text-sm">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={clearChat}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Clear chat"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsCollapsed(true)} 
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Collapse sidebar"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[90%] rounded-2xl px-4 py-3 text-sm
              ${msg.role === 'user' 
                ? 'bg-brand-600 text-white rounded-br-none' 
                : msg.isToolCall 
                  ? 'bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
              }
            `}>
              {msg.isToolCall ? (
                <div className="flex items-center gap-2">
                  <BeakerIcon className="w-4 h-4 text-amber-600" />
                  {msg.text}
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{msg.text}</div>
              )}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-xs text-slate-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-slate-100 bg-white flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button 
            onClick={() => setInput("Design primers for this sequence:")}
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full whitespace-nowrap transition-colors"
          >
            Design Primers
          </button>
          <button 
            onClick={() => setInput("Find restriction sites in:")}
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full whitespace-nowrap transition-colors"
          >
            Find RE Sites
          </button>
          <button 
            onClick={() => setInput("Search NCBI for")}
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full whitespace-nowrap transition-colors"
          >
            Search NCBI
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
        <div className="relative">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about primers, cloning, sequences..."
            rows={2}
            className="w-full bg-slate-100 text-slate-900 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 placeholder:text-slate-400 resize-none"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isThinking}
            className="absolute right-2 bottom-2 p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Powered by Gemini AI
        </p>
      </div>
    </div>
  );
};

export default AgentChat;
