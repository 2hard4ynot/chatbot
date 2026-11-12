import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw,
  User,
  Bot,
  AlertCircle,
  Send,
  GraduationCap
} from 'lucide-react';

export default function CampusChatbot() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const sendingRef = useRef(false);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: 'Hello! Ask me about the reference PDF. I will answer using that document.',
      isWelcome: true
    }
  ]);

  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'Summarize the PDF in 5 points',
    'What are the main policies?',
    'What questions can this PDF answer?'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (customText) => {
    const question = (customText ?? input).trim();
    if (!question || sendingRef.current) return;

    sendingRef.current = true;
    setError(null);
    setIsLoading(true);

    // Do not send the synthetic greeting as chat history.
    const history = messages
      .filter((message) => !message.isWelcome)
      .slice(-10)
      .map(({ role, text }) => ({ role, text }));

    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }
      if (!data.reply || typeof data.reply !== 'string') {
        throw new Error('The AI returned an empty response.');
      }
      setMessages((prev) => [...prev, { role: 'model', text: data.reply }]);
    } catch (err) {
      setError(err.message || 'Unable to connect to the chatbot.');
      setMessages((prev) => prev.slice(0, -1));
      setInput(question);
    } finally {
      sendingRef.current = false;
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    if (sendingRef.current) return;
    setMessages([
      {
        role: 'model',
        text: 'Hello! Ask me about the reference PDF. I will answer using that document.',
        isWelcome: true,
      },
    ]);
    setInput('');
    setError(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-indigo-600" />
          <h1 className="text-base font-semibold text-indigo-600">CampusGuide AI</h1>
        </div>

        <button
          type="button"
          onClick={resetChat}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          New Chat
        </button>
      </header>

      {/* Main Chat Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
            <p className="font-semibold">PDF-powered assistant</p>
            <p className="mt-1 text-xs text-indigo-700">
              Answers are generated from the PDF configured in the backend. Please verify important details against the document.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isUser
                        ? 'bg-indigo-600 text-white'
                        : 'bg-emerald-600 text-white shadow-xs'
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'rounded-tr-none bg-indigo-600 text-white'
                        : 'rounded-tl-none border border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-slate-200 bg-white px-4 py-3 shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce"></span>
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-2 text-xs font-medium text-slate-400">
                    Generating a response...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </main>

      {/* Suggested Queries Chips */}
      <div className="bg-slate-50 px-6 py-2">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Try asking:</span>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={isLoading}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <footer className="border-t border-slate-200 bg-white p-4">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask a question about the PDF..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          Responses are generated from the sample campus information provided.
        </p>
      </footer>
    </div>
  );
}