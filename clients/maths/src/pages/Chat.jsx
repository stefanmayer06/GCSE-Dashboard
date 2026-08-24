import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
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

export default function Chat({ health }) {
  const higherTier = window.location.pathname.startsWith('/maths-higher');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    api
      .chatHistory()
      .then((r) => {
        if (r.messages.length) {
          setMessages(r.messages.map((m) => ({ role: m.role, content: m.content })));
        } else {
          setMessages([
            {
              role: 'assistant',
              content:
                "Hey! I'm your AI maths tutor, tuned for AQA GCSE Foundation.\n\nAsk me to explain any topic, walk you through a question, or check your method — I'll guide you step by step without just giving answers away. 💪",
            },
          ]);
          if (higherTier) setMessages((current) => current.map((message) => ({ ...message, content: message.content.replace('Foundation', 'Higher') })));
        }
        setLoaded(true);
      })
      .catch(() => {
        setMessages([
          {
            role: 'assistant',
            content: 'Hey! Ask me any maths question — I\u2019m here to help you revise.',
          },
        ]);
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput('');
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setBusy(true);
    try {
      const out = await api.chat(next);
      setMessages((m) => [...m, { role: 'assistant', content: out.reply, model: out.model }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `Sorry — something broke: ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    await api.clearChat();
    setMessages([
      { role: 'assistant', content: 'Fresh start! What shall we work on?' },
    ]);
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
          {messages.map((m, i) => (
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
