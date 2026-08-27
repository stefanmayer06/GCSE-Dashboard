import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RubricBands } from './Practice.jsx';
import { RewardSummary } from '../../../shared/rewards.jsx';

export default function Results() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem('englishmate-last-result');
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
    result.grade === null ? (result.incomplete ? 'ok' : 'u') : result.grade >= 6 ? 'great' : result.grade >= 4 ? 'ok' : 'bad';

  return (
    <div className="page results">
      <header className="page-head">
        <h1>Paper results</h1>
        <p className="sub">
          {result.paperCode} · {result.paperName}
          {result.type === 'full' ? ' · 80 marks' : ' · quick paper'}
          {mins ? ` · finished in ${mins}` : ''}
        </p>
      </header>

      <div className="result-hero">
        <div className={`grade-badge ${gradeColor}`}>
          <div className="grade-num">{result.incomplete ? '—' : result.gradeLabel}</div>
          <div className="grade-label">{result.incomplete ? 'pending self-mark' : 'predicted grade'}</div>
        </div>
        <div className="score-block">
          <div className="score-num">{result.correctMarks}<span className="score-total"> / {result.totalMarks}</span></div>
          <div className="score-pct">{result.percent != null ? `${result.percent}%` : '—'}</div>
          <div className="score-note">
            {result.incomplete
              ? 'The AI examiner was offline for some long answers — self-mark them below using the rubrics and model answers to unlock your grade.'
              : result.grade === null
                ? 'Below grade 1 this time — check the targets below and go again. You\u2019ve got this.'
                : result.nextBoundary
                  ? `Just ${result.nextBoundary.marksToGo} more mark${result.nextBoundary.marksToGo === 1 ? '' : 's'} to reach a grade ${result.nextBoundary.grade}.`
                  : 'Outstanding — right at the top of the boundaries. 🏆'}
          </div>
        </div>
        <div className="actions-col">
          <button className="btn btn-primary" onClick={() => navigate('/practice')}>Try another paper</button>
          <Link className="btn" to="/learn">Study my weak skills</Link>
          <Link className="btn" to="/practice#adhoc">Quick-fire round</Link>
        </div>
      </div>

      <RewardSummary reward={result.reward} progress={result.progress} label="Paper XP earned" />

      <section className="two-col">
        <div className="panel">
          <h2>Grade boundaries (per paper, /80)</h2>
          <table className="bound-table">
            <thead>
              <tr><th>Grade</th><th>Marks needed</th><th>You</th></tr>
            </thead>
            <tbody>
              {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((g) => {
                const boundary = { 9: 64, 8: 58, 7: 52, 6: 45, 5: 39, 4: 33, 3: 26, 2: 18, 1: 11 }[g];
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
            Averaged from published AQA 8700 boundaries (2018–2024) scaled to one 80-mark paper.
            English Language has no tiers — grades run 9 to 1.
          </p>
        </div>

        <div className="panel">
          <h2>Skills breakdown</h2>
          {result.skills.map((s) => (
            <div key={s.id} className="bar-row">
              <div className="bar-head">
                <span>{s.name}</span>
                <span>{s.got}/{s.max} · {s.percent}%</span>
              </div>
              <div className="bar">
                <div className="bar-fill" style={{ width: `${s.percent}%`, background: s.percent >= 60 ? 'var(--green)' : 'var(--amber)' }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {result.weakTopics.length > 0 && (
        <section className="panel">
          <h2>Fix these skills first 🎯</h2>
          <p className="sub">Your weakest skills this paper, with free revision resources for each.</p>
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
        {result.perQuestion.map((q) => {
          const fb = q.marking || {};
          const got = q.got;
          const correctish = got != null && got >= q.marks * 0.6;
          return (
            <div key={q.qid} className={`review ${got != null ? (correctish ? 'right' : 'wrong') : 'pending'}`}>
              <button className="review-head" onClick={() => setOpen((o) => ({ ...o, [q.qid]: !o[q.qid] }))}>
                <span className="review-status">{got == null ? '•' : correctish ? '✓' : '✗'}</span>
                <span className="review-title">Q{q.qn} · {q.title}</span>
                <span className="review-result">{got != null ? `${got}/${q.marks}` : '—'}</span>
                <span className="chev">{open[q.qid] ? '▾' : '▸'}</span>
              </button>
              {open[q.qid] && (
                <div className="review-body">
                  <div className="review-q">{q.text.split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>

                  {q.listResult && (
                    <div className="fb-box">
                      <div className="fb-head"><span className="fb-marks">{q.got}<span className="outof"> / 4</span></span></div>
                      {q.listResult.matched.map((m, j) => (
                        <div key={j} className="fb-text">✅ “{m.line}” — matches “{m.point}”.</div>
                      ))}
                      {q.listResult.missed.map((m, j) => (
                        <div key={`m${j}`} className="fb-text" style={{ color: 'var(--muted)' }}>· You could also have said: “{m}”</div>
                      ))}
                    </div>
                  )}

                  {q.tfResult && (
                    <div className="fb-box">
                      <div className="fb-head"><span className="fb-marks">{q.got}<span className="outof"> / 4</span></span></div>
                      {q.tfResult.map((r, j) => (
                        <div key={j} className="fb-text">
                          {r.right ? '✅' : '❌'} “{r.text}” → {r.answer ? 'TRUE' : 'FALSE'}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.marking && (
                    <div className="fb-box">
                      <div className="fb-head">
                        {q.marking.ai ? (
                          <>
                            <span className="fb-marks">{q.marking.marks}<span className="outof"> / {q.marking.marksTotal}</span></span>
                            {q.marking.level && <span className="fb-level">Level {q.marking.level}</span>}
                            <span className="mark-chip ai">AI-marked · {q.marking.name}</span>
                          </>
                        ) : (
                          <span className="mark-chip off">AI offline — self-mark using the rubric below</span>
                        )}
                      </div>
                      {q.marking.ai && q.marking.content != null && (
                        <div className="fb-text" style={{ fontSize: 13 }}>
                          AO5 content {q.marking.content}/{q.marking.rubric?.split?.content?.max ?? 24} · AO6 accuracy {q.marking.accuracy}/{q.marking.rubric?.split?.accuracy?.max ?? 16}
                        </div>
                      )}
                      {q.marking.strengths && (
                        <div className="fb-col">
                          <div className="fb-label">Strengths</div>
                          <div className="fb-text">{q.marking.strengths}</div>
                        </div>
                      )}
                      {q.marking.improvements && (
                        <div className="fb-col">
                          <div className="fb-label">Targets</div>
                          <div className="fb-text">{q.marking.improvements}</div>
                        </div>
                      )}
                      {q.marking.modelAnswer && (
                        <div>
                          <div className="fb-model">Model answer</div>
                          <div className="model-answer">{q.marking.modelAnswer.split('\n').map((l, j) => <p key={j}>{l}</p>)}</div>
                        </div>
                      )}
                      <RubricBands rubric={q.marking.rubric} level={q.marking.level} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
