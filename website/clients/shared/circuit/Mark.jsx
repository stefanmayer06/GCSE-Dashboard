import Icon from './Icon.jsx';

// Inline right/wrong mark used in feedback lists — replaces emoji ticks so
// every state reads the same across devices (and never by colour alone:
// the glyph differs and the label is announced).
export default function Mark({ ok = false, label = null }) {
  return (
    <span className={`c-mark ${ok ? 'ok' : 'no'}`} role="img" aria-label={label || (ok ? 'Correct' : 'Incorrect')}>
      <Icon name={ok ? 'check' : 'cross'} size={13} strokeWidth={3} />
    </span>
  );
}
