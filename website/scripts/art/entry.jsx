// Art export entry — renders Circuit graphics to static SVG markup for the
// dependency-free public pages (selector/). Run: npm run art:export
import { renderToStaticMarkup } from 'react-dom/server';
import { CircuitHero, StrandScene, SubjectScene } from '../../clients/shared/circuit/Scenes.jsx';
import Emblem from '../../clients/shared/circuit/Emblem.jsx';
import IsoTile from '../../clients/shared/circuit/IsoTile.jsx';
import Pip from '../../clients/shared/circuit/Pip.jsx';
import Icon from '../../clients/shared/circuit/Icon.jsx';

let n = 0;
const render = (element) => renderToStaticMarkup(element, { identifierPrefix: `art${(n += 1)}-` });

export const ART = {
  hero: render(<CircuitHero />),
  foundation: render(<SubjectScene subject="maths" />),
  higher: render(<SubjectScene subject="maths-higher" />),
  english: render(<SubjectScene subject="english" />),
  'strand-number': render(<StrandScene strand="number" />),
  'strand-algebra': render(<StrandScene strand="algebra" />),
  'strand-geometry': render(<StrandScene strand="geometry" />),
  'strand-statistics': render(<StrandScene strand="statistics" />),
  'strand-probability': render(<StrandScene strand="probability" />),
  'strand-ratio': render(<StrandScene strand="ratio" />),
  'strand-reading': render(<StrandScene strand="reading" />),
  'strand-writing': render(<StrandScene strand="writing" />),
  'mark-foundation': render(<Emblem topicId="subject:MathsMate" strand="number" layers={3} ring={false} size={40} />),
  'mark-higher': render(<Emblem topicId="subject:Higher Maths" strand="algebra" layers={3} ring={false} size={40} />),
  'mark-english': render(<Emblem topicId="subject:EnglishMate" strand="reading" layers={3} ring={false} size={40} />),
  'mark-brand': render(<Emblem topicId="brand:study-desk" strand="probability" layers={4} ring={false} size={34} />),
  'tile-watch': render(<IsoTile topicId="watch" hue="blue" state="done" glyph="play" size={96} />),
  'tile-learn': render(<IsoTile topicId="fractions" strand="number" hue="purple" state="started" stage="secure" size={96} />),
  'tile-practise': render(<IsoTile topicId="practise" hue="tangerine" state="current" stage="developing" size={96} />),
  'tile-retry': render(<IsoTile topicId="retry" hue="volt" state="mastered" stage="mastered" size={96} />),
  'pip-happy': render(<Pip mood="happy" size={72} />),
  'pip-cheer': render(<Pip mood="cheer" size={72} />),
  'pip-think': render(<Pip mood="think" size={72} />),
  'icon-arrow': render(<Icon name="arrowRight" size={18} />),
  'icon-sun': render(<Icon name="sun" size={18} />),
  'icon-moon': render(<Icon name="moon" size={18} />),
  'icon-grid': render(<Icon name="grid" size={18} />),
  'icon-play': render(<Icon name="play" size={16} />),
  'icon-check': render(<Icon name="check" size={16} />),
};
