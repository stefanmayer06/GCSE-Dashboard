import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

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

export default function Chat({ health }) {
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
                "Hey! I'm your English Language tutor, tuned for AQA GCSE (8700).\n\nAsk me to explain any question type, build you a framework, or feedback on a paragraph — I'll coach you rather than just giving model answers. ✍️",
            },
          ]);
        }
        setLoaded(true);
      })
      .catch(() => {
        setMessages([{ role: 'assistant', content: 'Hey! Ask me anything about the 8700 papers.' }]);
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
    setMessages([{ role: 'assistant', content: 'Fresh start! What shall we work on?' }]);
  }

  const modelName = health?.model || 'deepseek/deepseek-v4-flash-0731';

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
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <div className="msg-avatar">{m.role === 'user' ? '🧑' : '🤖'}</div>
              <div className="msg-body">
                <div className="msg-text">{m.content.split('\n').map((l, j) => <p key={j}>{l}</p>)}</div>
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