import MathsVisual from './MathsVisual.jsx';

// One Maths question with its answer control: multiple choice or a typed
// answer (Enter checks it). Shared by lesson practice, mixed rounds and
// notebook retries; papers keep their own runner.
export default function MathsQuestion({ q, value, onChange, onSubmit = null, disabled = false, index = 0 }) {
  return (
    <>
      <div className="quiz-q-text">{q.text.split('\n').map((line, j) => <p key={j}>{line}</p>)}</div>
      <MathsVisual key={q.id} stimulus={q.stimulus} />
      {q.input.type === 'mcq' ? (
        <div className="choices" role="group" aria-label={`Answer to question ${index + 1}`}>
          {q.input.choices.map((choice) => (
            <button
              key={choice.label}
              type="button"
              disabled={disabled}
              className={`choice ${value === choice.label ? 'selected' : ''}`}
              aria-pressed={value === choice.label}
              onClick={() => onChange(choice.label)}
            >
              <span className="choice-letter">{choice.label}</span>
              <span>{choice.text}</span>
            </button>
          ))}
        </div>
      ) : (
        <form
          className="answer-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (!disabled && value != null && value !== '') onSubmit?.();
          }}
        >
          <input
            className="answer-input"
            aria-label={`Answer to question ${index + 1}`}
            type="text"
            inputMode={q.input.type === 'number' ? 'decimal' : 'text'}
            autoComplete="off"
            disabled={disabled}
            placeholder={q.input.placeholder || 'Your answer'}
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
          />
        </form>
      )}
    </>
  );
}
