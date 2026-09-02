import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { setResourceValue, useResource } from '../../../shared/resource-cache.js';
import MarkdownMessage from '../../../shared/MarkdownMessage.jsx';

const SUGGESTIONS = [
  'How should I structure my Paper 1 Q5 story?',
  'Explain how to analyse language in Q2, step by step',
  'What is the difference between Q2 and Q3 on Paper 1?',
  'Give me a framework for the Paper 2 Q4 comparison',
  'How do I write a good opening to an article?',
  'How many marks is SPAG worth and how do I improve it?',
  'Help me decode a 19th-century text',
  'What makes a grade 7 answer different from a grade 5?',
];

function toMessages(r) {
  if (!r.messages.length) {
    return [
      {
        role: 'assistant',
        content:
          "Hey! I'm your English Language tutor, tuned for AQA GCSE (8700).\n\nAsk me to explain any question type, build you a framework, or feedback on a paragraph — I'll coach you rather than just giving model answers. ✍️",
      },
    ];
  }
  const history = r.messages
    .map((m) => ({ role: m.role, content: m.content }))
    .filter((m) => m.role !== 'assistant' || String(m.content || '').trim());
  return history.length ? history : [{ role: 'assistant', content: "Hey! I'm your English Language tutor, tuned for AQA GCSE (8700)." }];
}

export default function Chat({ health, userId }) {
  const chatKey = userId ? `chat:${userId}` : null;
  const { data: history, error } = useResource(chatKey, () => api.chatHistory().then(toMessages));
  const [messages, setMessagesState] = useState(null);
  const [applied, setApplied] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (applied || messages != null) return;
    if (history != null) {
      setMessagesState(history);
      setApplied(true);
    } else if (error) {
      setMessagesState([{ role: 'assistant', content: 'Hey! Ask me anything about the 8700 papers.' }]);
      setApplied(true);
    }
  }, [applied, history, error, messages]);
  const loaded = messages != null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  // Every transcript change is written through to the shared cache so the
  // next visit to this page renders the conversation instantly.
  function setMessages(next) {
    setMessagesState(next);
    setResourceValue(chatKey, next);
  }

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || busy || !loaded) return;
    setInput('');
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setBusy(true);
    try {
      const out = await api.chat(next);
      setMessages([...next, { role: 'assistant', content: out.reply, model: out.model }]);
    } catch (e) {
      setMessages([...next, { role: 'assistant', content: `Sorry — something broke: ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    await api.clearChat();
    setMessages([{ role: 'assistant', content: 'Fresh start! What shall we work on?' }]);
  }

  const modelName = health?.model || 'qwen/qwen3.7-flash';

  return (
    <div className="page chat-page">
      <header className="page-head">
        <div>
          <h1>AI Tutor</h1>
          <p className="sub">
            Exam-savvy English coaching powered by <span className="model-chip">{modelName}</span>
            {!health?.chatReady && ' — offline mode right now (set OPENROUTER_API_KEY to unlock)'}
          </p>
        </div>
        <button className="btn" onClick={reset}>Clear chat</button>
      </header>

      <div className="chat-box">
        <div className="chat-scroll">
          {(messages ?? []).map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <div className="msg-avatar">{m.role === 'user' ? '🧑' : '🤖'}</div>
              <div className="msg-body">
                <div className="msg-text"><MarkdownMessage content={m.content} /></div>
                {m.role === 'assistant' && m.model && <div className="msg-model">{m.model}</div>}
              </div>
            </div>
          ))}
          {busy && (
            <div className="msg assistant">
              <div className="msg-avatar">🤖</div>
              <div className="msg-body typing">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="chat-suggest">
          {SUGGESTIONS.slice(0, 4).map((s) => (
            <button key={s} className="suggest-chip" onClick={() => send(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>

        <div className="chat-input-row">
          <input
            className="chat-input"
            placeholder="Ask about any question type, skill or technique…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            disabled={!loaded}
          />
          <button className="btn btn-primary" onClick={() => send()} disabled={busy || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
