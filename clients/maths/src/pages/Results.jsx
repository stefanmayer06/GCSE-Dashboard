import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import MathsVisual from '../components/MathsVisual.jsx';
import { RewardSummary } from '../../../shared/rewards.jsx';

export default function Results() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState({});

  useEffect(() => {
    try {
      const key = window.location.pathname.startsWith('/maths-higher') ? 'mathsmate-higher-last-result' : 'mathsmate-last-result';
      const raw = localStorage.getItem(key);
      if (raw) setResult(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  if (!result) {
    return (
      <div className="page">
        <div className="panel">
          <h2>No result yet</h2>
          <p className="sub">Complete a practice paper to see your predicted grade.</p>
          <button className="btn btn-primary" onClick={() => navigate('/practice')}>Start a paper</button>
        </div>
      </div>
    );
  }

  const mins = result.durationSec ? `${Math.floor(result.durationSec / 60)}m ${result.durationSec % 60}s` : null;
  const gradeColor =
    result.grade === null ? 'u' : result.grade >= 4 ? 'great' : result.grade === 3 ? 'ok' : 'bad';
  const boundaries = result.boundaries || [
    { grade: 5, boundary: 55 }, { grade: 4, boundary: 42 }, { grade: 3, boundary: 28 },
    { grade: 2, boundary: 18 }, { grade: 1, boundary: 10 },
  ];
  const higherTier = result.tier === 'higher';

  return (
    <div className="page results">
      <header className="page-head">
        <h1>Paper results</h1>
        <p className="sub">
          {result.paperCode ? `${result.paperCode} · ${result.paperName}${result.calculator === false ? ' · non-calculator' : ' · calculator'} · ` : ''}
          {result.type === 'full' ? '80 marks' : '40 marks'}
          {mins ? ` · finished in ${mins}` : ''}
        </p>
      </header>

      <div className="result-hero">
        <div className={`grade-badge ${gradeColor}`}>
          <div className="grade-num">{result.gradeLabel}</div>
          <div className="grade-label">predicted grade</div>
        </div>
        <div className="score-block">
          <div className="score-num">{result.correctMarks}<span className="score-total"> / {result.totalMarks}</span></div>
          <div className="score-pct">{result.percent}%</div>
          <div className="score-note">
            {result.grade === null
              ? 'Below grade 1 this time — head to the topic fixes below and go again. You\u2019ve got this.'
              : result.nextBoundary
                ? `Just ${result.nextBoundary.marksToGo} more mark${result.nextBoundary.marksToGo === 1 ? '' : 's'} to reach a grade ${result.nextBoundary.grade}.`
                : higherTier ? 'Top of the predicted Higher range on this paper. 🏆' : 'Top of foundation tier — you can\u2019t do better than a 5 on this paper. 🏆'}
          </div>
        </div>
        <div className="actions-col">
          <button className="btn btn-primary" onClick={() => navigate('/practice')}>Try another paper</button>
          <Link className="btn" to="/learn">Study my weak topics</Link>
          <Link className="btn" to="/practice#adhoc">Quick ad-hoc round</Link>
        </div>
      </div>

      <RewardSummary reward={result.reward} progress={result.progress} label="Paper XP earned" />

      <section className="two-col">
        <div className="panel">
          <h2>Grade boundaries (per paper)</h2>
          <table className="bound-table">
            <thead>
              <tr><th>Grade</th><th>Marks needed (/80)</th><th>You</th></tr>
            </thead>
            <tbody>
              {boundaries.map(({ grade: g, boundary }) => {
                const scaled = Math.round((result.correctMarks / result.totalMarks) * 80);
                return (
                  <tr key={g} className={result.grade === g ? 'me' : ''}>
                    <td>{g}</td>
                    <td>{boundary}</td>
                    <td>{result.grade === g ? '← you' : scaled >= boundary ? '✓' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="sub small">
            Rounded predicted boundaries for AQA 8300{higherTier ? 'H' : 'F'} practice. Real boundaries move each
            exam series — this is a prediction, not a promise.
          </p>
        </div>

        <div className="panel">
          <h2>Performance by strand</h2>
          {result.strandAnalysis.map((s) => (
            <div key={s.name} className="bar-row">
              <div className="bar-head">
                <span>{s.name}</span>
                <span>{s.got}/{s.marks} · {s.percent}%</span>
              </div>
              <div className="bar">
                <div className="bar-fill" style={{ width: `${s.percent}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {result.weakTopics.length > 0 && (
        <section className="panel">
          <h2>Fix these first 🎯</h2>
          <p className="sub">Your weakest topics this paper, with free revision resources for each.</p>
          <div className="weak-grid">
            {result.weakTopics.map((t) => (
              <div key={t.id} className="weak-card">
                <div className="weak-head">
                  <span className="weak-name">{t.name}</span>
                  <span className="weak-pct">{t.percent}%</span>
                </div>
                <div className="weak-links">
                  <Link to={t.internal} className="weak-link internal">📚 Lesson & practice (in app)</Link>
                  {t.resources.map((res) => (
                    <a key={res.label} href={res.url} target="_blank" rel="noreferrer" className="weak-link">
                      🔗 {res.label} — {res.why}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <h2>Full review — every question</h2>
        {result.perQuestion.map((q) => (
          <div key={q.qid} className={`review ${q.correct ? 'right' : 'wrong'}`}>
            <button className="review-head" onClick={() => setOpen((o) => ({ ...o, [q.qid]: !o[q.qid] }))}>
              <span className="review-status">{q.correct ? '✓' : '✗'}</span>
              <span className="review-title">Q{q.qn} · {q.topic} · {q.marks} mark{q.marks > 1 ? 's' : ''}{q.stretch ? ' ⚡' : ''}</span>
              <span className="review-result">
                {q.correct ? `${q.marks}/${q.marks}` : `0/${q.marks}`}
              </span>
              <span className="chev">{open[q.qid] ? '▾' : '▸'}</span>
            </button>
            {open[q.qid] && (
              <div className="review-body">
                <div className="review-q">{q.text.split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>
                <MathsVisual stimulus={q.stimulus} />
                {!q.correct && (
                  <>
                    <div className="review-you">Your answer: <b>{q.value ?? '(blank)'}</b></div>
                    <div className="review-answer">Correct answer: <b>{q.answerText}</b></div>
                    <div className="review-sol">
                      <div className="review-sol-title">Worked solution</div>
                      {q.solution.map((s, i) => <div key={i} className="sol-step">{s}</div>)}
                    </div>
                  </>
                )}
                {q.correct && <div className="review-answer">Correct answer: <b>{q.answerText}</b></div>}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
