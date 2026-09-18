import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, BookOpen, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { DocumentItem, ChatMessage } from '../types';
import { TtsPlayer } from './TtsPlayer';

interface AiTutorProps {
  documents: DocumentItem[];
  activeDocument: DocumentItem | null;
  onSelectDoc: (doc: DocumentItem) => void;
  onJumpToExamAnswer?: (question: string) => void;
}

export const AiTutor: React.FC<AiTutorProps> = ({
  documents,
  activeDocument,
  onSelectDoc,
  onJumpToExamAnswer,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I'm your **EduAI Tutor**. I'm here to help you study from your notes and ace your college exams.

${
  activeDocument
    ? `I currently have **"${activeDocument.name}"** loaded. Ask me anything about this document, request simple or detailed explanations, or generate exam answers!`
    : `Please select or upload a study document above, or ask me any general university curriculum topic.`
}

Try one of the quick action buttons below or ask your own question!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'general',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string>('Standard');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPromptActions = [
    { label: 'Simple Explanation', icon: '🌱', mode: 'Simple Explanation', template: 'Explain this topic in simple language with an everyday analogy' },
    { label: 'Detailed Explanation', icon: '🔬', mode: 'Detailed Explanation', template: 'Provide a detailed academic explanation with architecture and key mechanisms' },
    { label: 'Give Example', icon: '💡', mode: 'Example', template: 'Give me a concrete, real-world example of this concept' },
    { label: 'Summarize', icon: '📑', mode: 'Summary', template: 'Summarize the core exam takeaways and key formulas from this' },
    { label: '5-Mark Answer', icon: '✍️', mode: '5-Mark Answer', template: 'Provide a structured 5-mark college examination answer' },
    { label: '10-Mark Answer', icon: '🏆', mode: '10-Mark Answer', template: 'Provide a comprehensive 10-mark college university answer with headings' },
  ];

  const suggestedQuestions = [
    'Explain TCP congestion control.',
    'Explain OSI model in simple language.',
    'What is the difference between Flow Control and Congestion Control?',
    'Summarize this chapter for revision.',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (overridePrompt?: string, overrideMode?: string) => {
    const textToSend = overridePrompt || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    const mode = overrideMode || selectedMode;

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modeTag: mode !== 'Standard' ? mode : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!overridePrompt) setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          documentText: activeDocument?.extractedText || '',
          docName: activeDocument?.name || '',
          mode: mode,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned status: ${response.status}`);
      }

      const data = await response.json();

      const aiMessage: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
        referencedDocName: data.docName,
        modeTag: mode !== 'Standard' ? mode : undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'ai',
        text: `⚠️ **Unable to connect to AI Tutor:** ${err.message || 'Network error'}. Please verify your connection or Gemini API Key.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: typeof quickPromptActions[0]) => {
    setSelectedMode(action.mode);
    if (inputPrompt.trim()) {
      handleSend(inputPrompt, action.mode);
    } else {
      handleSend(action.template, action.mode);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header with Active Document Selector */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              EduAI Tutor
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Exam Ready
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Answers grounded in your uploaded study material
            </p>
          </div>
        </div>

        {/* Document Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <select
            value={activeDocument?.id || ''}
            onChange={(e) => {
              const doc = documents.find((d) => d.id === e.target.value);
              if (doc) onSelectDoc(doc);
            }}
            className="text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {documents.length === 0 ? (
              <option value="">No documents uploaded</option>
            ) : (
              documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  📄 {doc.name.length > 30 ? doc.name.slice(0, 30) + '...' : doc.name}
                </option>
              ))
            )}
          </select>
          {messages.length > 1 && (
            <button
              onClick={() => setMessages([messages[0]])}
              title="Clear chat history"
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Action Mode Selector Bar */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/30 overflow-x-auto flex items-center space-x-2">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase shrink-0">
          Format:
        </span>
        {quickPromptActions.map((action) => (
          <button
            key={action.mode}
            onClick={() => handleQuickAction(action)}
            className={`shrink-0 px-2.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              selectedMode === action.mode
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
            }`}
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 md:p-5 text-sm ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700/80 shadow-sm'
              }`}
            >
              {/* Header inside AI bubble */}
              {msg.sender === 'ai' && (
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">EduAI</span>
                    {msg.source === 'document' && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">
                        Document Sourced
                      </span>
                    )}
                    {msg.modeTag && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[10px] font-medium border border-indigo-200 dark:border-indigo-800">
                        {msg.modeTag}
                      </span>
                    )}
                  </div>
                  {/* Text-To-Speech Button */}
                  <TtsPlayer text={msg.text} />
                </div>
              )}

              {/* Message Content */}
              <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                {msg.text}
              </div>

              {/* Action shortcuts for AI answers */}
              {msg.sender === 'ai' && msg.id !== 'welcome' && onJumpToExamAnswer && (
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => onJumpToExamAnswer(messages.filter((m) => m.sender === 'user').slice(-1)[0]?.text || 'Core concept')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Format into Exam Paper Answer
                  </button>
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center animate-pulse">
              <Bot className="w-5 h-5" />
            </div>
            <div className="p-4 rounded-2xl rounded-bl-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-2 font-medium">Consulting study material and generating college answer...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Pills */}
      {messages.length <= 3 && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center space-x-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 uppercase shrink-0">Try asking:</span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              "{q}"
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={
                activeDocument
                  ? `Ask EduAI about "${activeDocument.name.slice(0, 25)}..." or request an exam explanation`
                  : 'Ask EduAI any college syllabus topic or question...'
              }
              className="w-full pl-4 pr-10 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
