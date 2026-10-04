import Sheet from './Sheet.jsx';
import Emblem from './circuit/Emblem.jsx';
import Icon from './circuit/Icon.jsx';

// Subject switcher. Each subject is its own bundle, so switching loads the
// other one, but you stay signed in and land on the same tab.
export const SUBJECTS = [
  { id: 'maths', base: '/maths', name: 'Maths Foundation', short: 'Maths', tier: 'Foundation', detail: 'AQA 8300 · grades 1 to 5', strand: 'number' },
  { id: 'maths-higher', base: '/maths-higher', name: 'Maths Higher', short: 'Maths', tier: 'Higher', detail: 'AQA 8300H · grades 4 to 9', strand: 'algebra' },
  { id: 'english', base: '/english', name: 'English Language', short: 'English', tier: 'Language', detail: 'AQA 8700 · both papers', strand: 'reading' },
];

export function subjectInfo(id) {
  return SUBJECTS.find((subject) => subject.id === id) || SUBJECTS[0];
}

// The tab a learner is on, so a switch keeps them in the same place.
export function tabPathFor(pathname = '/') {
  const first = `/${String(pathname).split('/').filter(Boolean)[0] || ''}`;
  if (['/learn', '/texts'].includes(first)) return '/learn';
  if (['/practice', '/results', '/notebook'].includes(first)) return '/practice';
  if (first === '/creatures') return '/creatures';
  if (['/me', '/summary'].includes(first)) return '/me';
  return '/';
}

export function SubjectEmblem({ subject, size = 32 }) {
  const info = subjectInfo(subject);
  return <Emblem topicId={`subject:${info.name}`} strand={info.strand} layers={3} ring={false} size={size} />;
}

export default function SubjectSheet({ current, status = '', pathname = '/', onClose }) {
  const tab = tabPathFor(pathname);
  return (
    <Sheet title="Your subjects" onClose={onClose} className="subject-sheet">
      <ul className="subject-list">
        {SUBJECTS.map((subject) => {
          const isCurrent = subject.id === current;
          const href = `${subject.base}${tab === '/' ? '/' : tab}`;
          return (
            <li key={subject.id}>
              <a
                href={href}
                className={`subject-option subject-${subject.id}${isCurrent ? ' current' : ''}`}
                aria-current={isCurrent ? 'true' : undefined}
                onClick={(event) => {
                  if (isCurrent) {
                    event.preventDefault();
                    onClose();
                  }
                }}
              >
                <SubjectEmblem subject={subject.id} size={44} />
                <span className="subject-option-copy">
                  <span className="subject-option-name">{subject.name}</span>
                  <span className="subject-option-detail">{isCurrent && status ? status : subject.detail}</span>
                </span>
                {isCurrent ? (
                  <span className="subject-option-check" aria-hidden="true"><Icon name="check" size={16} strokeWidth={3.2} /></span>
                ) : (
                  <Icon name="chevronRight" size={20} />
                )}
              </a>
            </li>
          );
        })}
      </ul>
      <p className="sheet-note">You stay signed in, and you’ll land on the same tab.</p>
    </Sheet>
  );
}
