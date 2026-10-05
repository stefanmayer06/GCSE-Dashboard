import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { setResourceValue, useResource } from './resource-cache.js';
import MarkdownMessage from './MarkdownMessage.jsx';
import Sheet from './Sheet.jsx';
import Pip from './circuit/Pip.jsx';
import Icon from './circuit/Icon.jsx';

// Ask Pip: the AI tutor as a conversation you can open from anywhere. On a
// lesson, question or retry it opens as a sheet over the work (so a
// half-finished set is never lost) and carries the question as context.
// Pip guides towards the method; the server prompt keeps it from simply
// handing over answers.

const SUBJECT_COPY = {
  maths: {
    name: 'Maths',
    greeting: 'Hi, I’m Pip, your Maths tutor for AQA GCSE Foundation.\n\nSend me a question or tell me the topic you’re stuck on. I can help you find the method, check your working or give you a hint.',
    fallback: 'Hi. Send me a Maths question or tell me which topic you need help with.',
    suggestions: [
      'Explain how to add fractions with different denominators',
      'What is BIDMAS? Show me an example',
      'Help me with percentage increase and decrease',
      'How do I solve equations with brackets?',
    ],
  },
  'maths-higher': {
    name: 'Maths',
    greeting: 'Hi, I’m Pip, your Maths tutor for AQA GCSE Higher.\n\nSend me a question or tell me the topic you’re stuck on. I can help you find the method, check your working or give you a hint.',
    fallback: 'Hi. Send me a Maths question or tell me which topic you need help with.',
    suggestions: [
      'How do I rationalise a surd denominator?',
      'Explain completing the square step by step',
      'Help me with conditional probability',
      'How do I find the equation of a tangent to a circle?',
    ],
  },
  english: {
    name: 'English',
    greeting: 'Hi, I’m Pip, your English Language tutor for AQA GCSE (8700).\n\nSend me a question or a paragraph you’re working on. I can explain the task, help you plan an answer or give you feedback.',
    fallback: 'Hi. What would you like help with in English Language?',
    suggestions: [
      'How should I structure my Paper 1 Q5 story?',
      'Explain how to analyse language in Q2, step by step',
      'What is the difference between Q2 and Q3 on Paper 1?',
      'Give me a framework for the Paper 2 Q4 comparison',
    ],
  },
};

function copyFor(subject) {
  return SUBJECT_COPY[subject] || SUBJECT_COPY.maths;
}

function toMessages(response, subject) {
  const history = (response?.messages || [])
    .map((message) => ({ role: message.role, content: message.content }))
    .filter((message) => message.role !== 'assistant' || String(message.content || '').trim());
  return history.length ? history : [{ role: 'assistant', content: copyFor(subject).greeting }];
}

const CONTEXT_REQUESTS = [
  { id: 'hint', label: 'Give me a hint', text: 'Can you give me a hint for the next step, without telling me the answer?' },
  { id: 'method', label: 'Explain the method', text: 'Can you explain the method step by step? Let me try each step before you show the next one.' },
  { id: 'wrong', label: 'Why was I wrong?', text: 'Why is my answer wrong? Help me spot the mistake without just giving me the right answer.' },
];

// Shared with the /chat page preload so the sheet and the page read one cache.
export const chatKey = (subject, userId) => (userId ? `chat:${subject}:${userId}` : null);
export const loadChatHistory = (api, subject) => api.chatHistory().then((response) => toMessages(response, subject));

export function contextMessage(context, request) {
  const lines = [`I'm working on this ${context.kind || 'question'}${context.label ? ` (${context.label})` : ''}:`];
  if (context.question) lines.push(`"${String(context.question).trim()}"`);
  if (context.answer != null && String(context.answer).trim() !== '') lines.push(`My answer: ${String(context.answer).trim()}`);
  lines.push(request);
  return lines.join('\n\n');
}

export function PipChat({ api, subject, userId, health = null, context = null, variant = 'page', onBack = null }) {
  const copy = copyFor(subject);
  const key = chatKey(subject, userId);
  const { data: history, error } = useResource(key, () => loadChatHistory(api, subject));
  const [messages, setMessagesState] = useState(null);
  const [applied, setApplied] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [contextUsed, setContextUsed] = useState(false);
  const endRef = useRef(null);
  const chatKeyRef = useRef(key);
  const requestRef = useRef(0);
  chatKeyRef.current = key;

  useEffect(() => {
    requestRef.current += 1;
    setMessagesState(null);
    setApplied(false);
    setInput('');
    setBusy(false);
  }, [key]);

  useEffect(() => {
    if (applied || messages != null) return;
    if (history != null) {
      setMessagesState(history);
      setApplied(true);
    } else if (error) {
      setMessagesState([{ role: 'assistant', content: copy.fallback }]);
      setApplied(true);
    }
  }, [applied, history, error, messages, copy.fallback]);
  const loaded = messages != null;

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    endRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'end' });
  }, [messages, busy]);

  // Every transcript change is written through to the shared cache so the
  // page and the sheet always show the same conversation.
  function setMessages(next) {
    setMessagesState(next);
    setResourceValue(key, next);
  }

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || busy || !loaded) return;
    const requestId = ++requestRef.current;
    const requestKey = key;
    setInput('');
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setBusy(true);
    try {
      const out = await api.chat(next);
      if (requestRef.current !== requestId || chatKeyRef.current !== requestKey) return;
      setMessages([...next, { role: 'assistant', content: out.reply, model: out.model }]);
    } catch (cause) {
      if (requestRef.current !== requestId || chatKeyRef.current !== requestKey) return;
      setMessages([...next, { role: 'assistant', content: `I couldn’t send that. Please try again. ${cause.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    const requestId = ++requestRef.current;
    const requestKey = key;
    await api.clearChat();
    if (requestRef.current !== requestId || chatKeyRef.current !== requestKey) return;
    setMessages([{ role: 'assistant', content: 'Fresh start! What shall we work on?' }]);
  }

  // The first message carries the question; after that it is a normal chat.
  function sendWithContext(text) {
    if (context && !contextUsed) {
      setContextUsed(true);
      return send(contextMessage(context, text));
    }
    return send(text);
  }

  const hasUserMessage = (messages || []).some((message) => message.role === 'user');
  const quickReplies = context && !contextUsed
    ? CONTEXT_REQUESTS.filter((request) => request.id !== 'wrong' || context.wrong)
    : !hasUserMessage
      ? copy.suggestions.map((text) => ({ id: text, label: text, text }))
      : [];
  const aiOff = health && health.chatReady === false;

  return (
    <div className={`pip-chat pip-chat-${variant}`}>
      {variant === 'page' ? (
        <header className="pip-chat-head">
          {onBack ? (
            <button type="button" className="icon-btn" onClick={onBack} aria-label="Back">
              <Icon name="chevronLeft" size={22} />
            </button>
          ) : null}
          <Pip mood="happy" size={44} />
          <div className="pip-chat-title">
            <h1>Ask Pip</h1>
            <p className="sub">{copy.name} tutor · helps you find the method{aiOff ? ' · AI help is unavailable right now' : ''}</p>
          </div>
          <button type="button" className="btn small" onClick={reset}>Clear chat</button>
        </header>
      ) : (
        <div className="pip-chat-mini">
          <Pip mood="happy" size={36} />
          <span><b>Pip</b> · {copy.name} tutor</span>
        </div>
      )}

      {context ? (
        <p className="pip-context">
          <Icon name="notebook" size={16} />
          <span>About: {context.label || 'this question'}</span>
        </p>
      ) : null}

      <div className="chat-box">
        <div className="chat-scroll" role="log" aria-live="polite" aria-label="Conversation with Pip">
          {(messages ?? []).map((message, index) => (
            <div key={index} className={`msg ${message.role}`}>
              {message.role === 'assistant' ? (
                <div className="msg-avatar" aria-hidden="true"><Pip mood="happy" size={30} /></div>
              ) : null}
              <div className="msg-body">
                <div className="msg-text"><MarkdownMessage content={message.content} /></div>
              </div>
            </div>
          ))}
          {busy ? (
            <div className="msg assistant">
              <div className="msg-avatar" aria-hidden="true"><Pip mood="think" size={30} /></div>
              <div className="msg-body typing" aria-label="Pip is typing">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        {quickReplies.length ? (
          <div className="chat-suggest" role="group" aria-label="Quick replies">
            {quickReplies.map((reply) => (
              <button key={reply.id} type="button" className="suggest-chip" onClick={() => sendWithContext(reply.text)} disabled={busy || !loaded}>
                {reply.label}
              </button>
            ))}
          </div>
        ) : null}

        <p className="pip-note">Pip helps you find the method. It won’t just hand over the answer.</p>
        <form
          className="chat-input-row"
          onSubmit={(event) => {
            event.preventDefault();
            sendWithContext(input);
          }}
        >
          <label className="sr-only" htmlFor={`pip-input-${variant}`}>Message Pip</label>
          <input
            id={`pip-input-${variant}`}
            className="chat-input"
            placeholder="Message Pip"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={!loaded}
            autoComplete="off"
          />
          <button type="submit" className="chat-send" disabled={busy || !input.trim()} aria-label="Send">
            <Icon name="arrowRight" size={22} strokeWidth={2.6} />
          </button>
        </form>
      </div>
    </div>
  );
}

const PipContext = createContext({ openPip: () => {}, available: false });

export function PipProvider({ api, subject, userId, health = null, children }) {
  const [open, setOpen] = useState(null);
  const openPip = useCallback((context = null) => setOpen({ context, key: Date.now() }), []);
  const value = useMemo(() => ({ openPip, available: Boolean(api?.chat) }), [openPip, api]);
  return (
    <PipContext.Provider value={value}>
      {children}
      {open ? (
        <Sheet title="Ask Pip" size="tall" className="pip-sheet" onClose={() => setOpen(null)} showTitle={false}>
          <PipChat key={open.key} api={api} subject={subject} userId={userId} health={health} context={open.context} variant="sheet" />
        </Sheet>
      ) : null}
    </PipContext.Provider>
  );
}

export function usePip() {
  return useContext(PipContext);
}

// The Pip button for lessons, questions, feedback and retries. Never shown
// in timed papers: exam conditions mean no tutor.
export function AskPipButton({ context = null, label = 'Ask Pip', className = 'btn', iconOnly = false, mood = 'think' }) {
  const { openPip, available } = usePip();
  if (!available) return null;
  return (
    <button
      type="button"
      className={`ask-pip ${iconOnly ? 'ask-pip-icon ' : ''}${className}`.trim()}
      onClick={() => openPip(context)}
      aria-label={iconOnly ? 'Ask Pip for help' : undefined}
    >
      <Pip mood={mood} size={iconOnly ? 32 : 26} />
      {iconOnly ? null : <span>{label}</span>}
    </button>
  );
}
