import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { setResourceValue, useResource } from '../../../shared/resource-cache.js';
import MarkdownMessage from '../../../shared/MarkdownMessage.jsx';

const SUGGESTIONS = [
  'Explain how to add fractions with different denominators',
  'What is BIDMAS? Show me an example',
  'Help me with percentage increase and decrease',
  'How do I solve equations with brackets?',
  'Explain nth term of a sequence',
  'What formulas do I need for circles?',
  'How does Pythagoras work?',
  'Tips for probability questions',
];

function toMessages(r, higherTier) {
  const base = r.messages.length
    ? r.messages.map((m) => ({ role: m.role, content: m.content }))
    : [
        {
          role: 'assistant',
          content:
            "Hey! I'm your AI maths tutor, tuned for AQA GCSE Foundation.\n\nAsk me to explain any topic, walk you through a question, or check your method — I'll guide you step by step without just giving answers away. 💪",
        },
      ];
  return higherTier
    ? base.map((message) => ({ ...message, content: message.content.replace('Foundation', 'Higher') }))
    : base;
}

export default function Chat({ health, userId }) {
  const higherTier = window.location.pathname.startsWith('/maths-higher');
  const chatKey = userId ? `chat:${userId}` : null;
  const { data: history, error } = useResource(chatKey, () =>
    api.chatHistory().then((r) => toMessages(r, higherTier)),
  );
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
      setMessagesState([{ role: 'assistant', content: 'Hey! Ask me any maths question — I\u2019m here to help you revise.' }]);
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
            Patient, step-by-step help powered by{' '}
            <span className="model-chip">{modelName}</span>
            {!health?.chatReady && ' — running in offline mode (set OPENROUTER_API_KEY to unlock the AI)'}
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
            placeholder="Ask about any topic, question or method…"
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
