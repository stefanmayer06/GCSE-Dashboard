const numbers = (text) => [...text.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));

const label = (text, x, y) => ({ text: String(text), x, y });
const shape = (kind, labels, alt, extra = {}) => ({ type: 'shape', kind, labels, alt, ...extra });

function coordinateStimulus(topicId, v, q) {
  const text = q.text.replaceAll('−', '-');
  const pairs = [...text.matchAll(/\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/g)].map((m) => [Number(m[1]), Number(m[2])]);

  if (topicId === 'graphs') {
    const t = v % 8;
    if (t === 0 || t === 7) {
      const points = pairs.slice(0, 2).map(([x, y], i) => ({ x, y, label: `${i ? 'B' : 'A'} (${x}, ${y})` }));
      return {
        type: 'coordinate',
        points,
        segments: points.length === 2 ? [[points[0], points[1]]] : [],
        alt: `Coordinate grid showing ${points.map((p) => p.label).join(' and ')}.`,
      };
    }
  }

  if (topicId === 'transformations') {
    const t = v % 8;
    if (t === 6) return null;
    const source = pairs[0];
    if (!source) return null;
    const vector = (t === 0 || t === 7) ? pairs[1] : null;
    return {
      type: 'coordinate',
      points: [{ x: source[0], y: source[1], label: `Original (${source[0]}, ${source[1]})` }],
      vector: vector ? { x: vector[0], y: vector[1] } : undefined,
      emphasis: text.includes('x-axis') ? 'x' : text.includes('y-axis') ? 'y' : 'origin',
      operation: t === 1 || t === 2 || t === 7 ? 'reflection' : t === 3 || t === 4 ? 'rotation' : t === 5 ? 'enlargement' : 'translation',
      alt: `Coordinate grid with the original point at (${source[0]}, ${source[1]}); the image point is intentionally not shown.`,
    };
  }
  return null;
}

function geometryStimulus(topicId, v, q) {
  const n = numbers(q.text);
  if (topicId === 'transformations' && v % 8 === 6) {
    const name = q.text.match(/does (?:an? )?(.+?) have\?/)?.[1] || 'shape';
    if (name === 'circle') return shape('circle', [], 'A circle, shown without symmetry lines.');
    if (name.includes('parallelogram')) return shape('parallelogram', [], 'A parallelogram that is not a rectangle or rhombus, shown without symmetry lines.');
    if (name.includes('rectangle')) return shape('rectangle', [], 'A non-square rectangle, shown without symmetry lines.');
    if (name.includes('isosceles')) return shape('isosceles', [], 'An isosceles triangle, shown without symmetry lines.');
    const sideCounts = { square: 4, 'equilateral triangle': 3, 'regular hexagon': 6, 'regular pentagon': 5 };
    return shape('polygon', [], `A ${name}, shown without symmetry lines.`, { sides: sideCounts[name] || 4 });
  }
  if (topicId === 'angles') {
    const t = v % 9;
    if (t === 0) return shape('straight-angle', [label(`${n[0]}°`, 155, 118), label('?°', 260, 118)], 'Two adjacent angles on a straight line.');
    if (t === 1) return shape('around-point', [label(`${n[0]}°`, 145, 92), label(`${n[1]}°`, 260, 95), label('?°', 210, 180)], 'Three angles meeting at one point.');
    if (t === 2) return shape('triangle', [label(`${n[0]}°`, 100, 215), label(`${n[1]}°`, 315, 215), label('?°', 210, 75)], 'Triangle with two known angles and one unknown angle.');
    if (t === 3) return shape('quadrilateral', [label(`${n[0]}°`, 105, 190), label(`${n[1]}°`, 305, 190), label(`${n[2]}°`, 285, 80), label('?°', 125, 80)], 'Quadrilateral with three known angles and one unknown angle.');
    if (t === 4 || t === 5) return shape('parallel-lines', [label(`${n[0]}°`, 155, 104), label('?°', t === 4 ? 265 : 165, 170)], 'Two parallel lines crossed by a transversal, with one known and one unknown angle.', { relation: t === 4 ? 'alternate' : 'co-interior' });
    if (t === 6) return shape('polygon', [], `A regular polygon named in the question.`, { sides: [5, 6, 8, 7, 9, 10, 12, 4][Math.floor(v / 9) % 8] });
    if (t === 7) return shape('polygon', [], `A polygon with ${n[0]} sides.`, { sides: n[0] });
    return shape('isosceles', [label(`${n[0]}°`, 210, 75), label('?°', 105, 215)], 'Isosceles triangle with equal-side marks, a known apex angle and an unknown base angle.');
  }

  if (topicId === 'area-perimeter') {
    const t = v % 8;
    if (t <= 1) return shape('rectangle', [label(`${n[0]} ${t ? 'm' : 'cm'}`, 210, 225), label(`${n[1]} ${t ? 'm' : 'cm'}`, 330, 140)], 'Rectangle labelled with its length and width.');
    if (t === 2) return shape('triangle-height', [label(`${n[0]} cm`, 210, 225), label(`${n[1]} cm`, 223, 135)], 'Triangle with labelled base and perpendicular height.');
    if (t === 3) return shape('parallelogram', [label(`${n[0]} cm`, 220, 225), label(`${n[1]} cm`, 145, 135)], 'Parallelogram with labelled base and perpendicular height.');
    if (t === 4) return shape('trapezium', [label(`${n[0]} cm`, 210, 65), label(`${n[1]} cm`, 210, 225), label(`${n[2]} cm`, 125, 140)], 'Trapezium with both parallel sides and its perpendicular height labelled.');
    if (t === 5) return shape('joined-rectangles', [label(`${n[0]} × ${n[1]} cm`, 155, 120), label(`${n[2]} × ${n[3]} cm`, 285, 185)], 'Two joined rectangles with their dimensions labelled.');
    if (t === 6) return shape('rectangle', [label(`${n[1]} cm`, 210, 225), label('? cm', 330, 140), label(`perimeter ${n[0]} cm`, 210, 52)], 'Rectangle with a known perimeter and length, and unknown width.');
    return shape('frame', [label(`${n[0]} × ${n[1]} cm photo`, 210, 145), label(`${n[2]} cm frame`, 320, 70)], 'Rectangular photograph surrounded by an even-width frame.');
  }

  if (topicId === 'circles') {
    const t = v % 8;
    const value = t === 6 ? n[0] : n[0];
    const measure = t === 1 || t === 2 || t === 5 ? 'radius' : t === 6 ? 'circumference' : 'diameter';
    return shape(t === 4 ? 'semicircle' : t === 7 ? 'wheel' : 'circle', [label(measure === 'radius' ? `r = ${value} cm` : measure === 'circumference' ? `C = ${value} cm` : t === 7 ? `d = ${value} m` : `d = ${value} cm`, 210, 142)], t === 4 ? 'Semicircle with its diameter labelled.' : 'Circle with the supplied measurement labelled.', { measure });
  }

  if (topicId === 'pythagoras') {
    const t = v % 6;
    if (t === 3) {
      const sides = n.slice(0, 3);
      return shape('scalene', [label(`${sides[0]} cm`, 125, 185), label(`${sides[1]} cm`, 290, 185), label(`${sides[2]} cm`, 215, 225)], 'Not-to-scale triangle with all three side lengths labelled; no right-angle mark is shown.');
    }
    if (t === 4) return shape('ladder', [label(`${n[0]} m`, 255, 120), label(`${n[1]} m`, 250, 225), label('? m', 125, 135)], 'Ladder leaning against a vertical wall, forming a right-angled triangle.');
    if (t === 5) return shape('rectangle-diagonal', [label(`${n[0]} cm`, 210, 225), label(`${n[1]} cm`, 330, 140), label('? cm', 220, 125)], 'Rectangle with its dimensions labelled and diagonal marked unknown.');
    const labels = t === 2
      ? [label(`${n[0]} cm`, 255, 120), label(`${n[1]} cm`, 210, 225), label('? cm', 120, 135)]
      : [label(`${n[0]} cm`, 120, 140), label(`${n[1]} cm`, 210, 225), label('? cm', 260, 120)];
    return shape('right-triangle', labels, 'Right-angled triangle with known sides labelled and the required side marked unknown.');
  }

  if (topicId === 'trigonometry') {
    const t = v % 6;
    if (t === 3) return null;
    if (t === 4) return shape('ladder', [label(`${n[0]} m`, 255, 120), label(`${n[1]}°`, 275, 205), label('? m', 125, 135)], 'Ladder against a wall with its length and angle to the ground labelled.');
    const sideName = t === 0 || t === 1 ? 'hypotenuse' : 'adjacent';
    const side = t === 2 ? n[1] : t === 5 ? n[1] : n[0];
    const angle = t === 2 ? n[0] : t === 5 ? n[0] : n[1];
    const unknownPosition = t === 1 ? [220, 225] : t === 5 ? [270, 120] : [120, 135];
    return shape('right-triangle', [label(`${side} cm ${sideName}`, sideName === 'hypotenuse' ? 270 : 220, sideName === 'hypotenuse' ? 120 : 225), label(`${angle}°`, 285, 202), label('? cm', unknownPosition[0], unknownPosition[1])], 'Right-angled triangle with the supplied side and angle labelled and the required side marked unknown.');
  }

  if (topicId === 'volume-surface') {
    const t = v % 6;
    if (t === 4) return null;
    if (t === 1) return shape('cuboid', [label(`${n[0]} cm`, 285, 218)], 'Cube with its side length labelled.');
    if (t === 3) return shape('triangular-prism', [label(`${n[0]} cm`, 102, 200), label(`${n[1]} cm`, 132, 140), label(`${n[2]} cm`, 300, 195)], 'Triangular prism with cross-section base, perpendicular height and prism length labelled.');
    return shape('cuboid', [label(`${n[0]} cm`, 270, 220), label(`${n[1]} cm`, 345, 170), label(`${n[2]} cm`, 115, 130)], 'Cuboid with length, width and height labelled.');
  }
  return null;
}

function dataStimulus(topicId, v, q) {
  const n = numbers(q.text);
  if (topicId === 'averages' && (v % 8 === 4 || v % 8 === 5)) {
    const rows = [...q.text.matchAll(/(\d+):\s*(\d+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    return { type: 'table', headings: ['Number of pets', 'Frequency'], rows, alt: 'Frequency table showing numbers of pets owned by students.' };
  }

  if (topicId === 'sequences' && v % 8 === 7) {
    return { type: 'dot-pattern', patterns: [1, 2, 3], alt: 'The first three growing dot patterns, containing five, nine and thirteen dots.' };
  }

  if (topicId === 'charts') {
    const t = v % 6;
    if (t === 0) return { type: 'pie', angle: null, alt: 'Blank pie-chart template ready for the calculated sector.', prompt: `${n[1]} of ${n[0]}` };
    if (t === 1) return { type: 'pie', angle: n[1], alt: `Pie chart with a train sector of ${n[1]} degrees.`, prompt: `${n[0]} people` };
    if (t === 2) {
      const match = q.text.match(/\n(.+): (\d+)\.\s+(.+): (\d+)\./);
      return { type: 'bar', data: match ? [{ label: match[1], value: +match[2] }, { label: match[3], value: +match[4] }] : [], alt: 'Bar chart comparing the two categories in the question.' };
    }
    if (t === 3) return { type: 'table', headings: ['', 'Girls', 'Boys', 'Total'], rows: [['Walk', n[0], n[1], '?'], ['All pupils', '', '', n[2]]], alt: 'Part-completed two-way table of travel to school.' };
    if (t === 4) return { type: 'tally', count: q.answer, alt: `A tally showing ${q.answer} items.` };
    const symbol = q.text.includes('✿') ? '✿' : q.text.includes('☆') ? '☆' : '○';
    return { type: 'pictogram', symbol, value: n[0], count: n[1], alt: `Pictogram with ${n[1]} symbols; each symbol represents ${n[0]}.` };
  }

  if (topicId === 'scatter') {
    const t = v % 4;
    if (t === 0) {
      const direction = q.answerText.startsWith('positive') ? 1 : q.answerText.startsWith('negative') ? -1 : 0;
      const axes = q.text.match(/plots (.+) against (.+)\./);
      const base = [[1, 2], [2, 3.4], [3, 2.8], [4, 5.1], [5, 4.6], [6, 6.5], [7, 6.1]];
      const points = base.map(([x, y], i) => ({ x, y: direction === 1 ? y : direction === -1 ? 8 - y : [4, 1.8, 6.6, 3, 6.1, 2.4, 4.8][i] }));
      return { type: 'scatter', points, xLabel: axes?.[1], yLabel: axes?.[2], alt: 'Scatter graph to classify by its overall trend.' };
    }
    if (t === 1) {
      const pts = [...q.text.matchAll(/\((\d+),\s*(\d+)\)/g)].map((m) => ({ x: +m[1], y: +m[2] }));
      return { type: 'scatter', points: [], line: pts.slice(0, 2), queryX: n.at(-1), alt: 'Line of best fit on coordinate axes; use it to estimate the requested value.' };
    }
    if (t === 2) {
      const pts = [...q.text.matchAll(/\((\d+),\s*(\d+)\)/g)].map((m) => ({ x: +m[1], y: +m[2] }));
      return { type: 'scatter', points: pts, alt: 'Scatter graph containing a cluster and one point that does not fit the pattern.' };
    }
    return { type: 'range', min: n[0], max: n[1], alt: `Observed data range from ${n[0]} to ${n[1]}; values outside are extrapolations.` };
  }

  if (topicId === 'probability-basic') {
    const t = v % 8;
    if (t <= 1) return { type: 'counters', groups: [{ label: 'Red', count: n[0], color: '#ff5c5c' }, { label: 'Blue', count: n[1], color: '#35a7ff' }], alt: `Bag containing ${n[0]} red and ${n[1]} blue counters.` };
    if (t === 3) return { type: 'dice', alt: 'The six equally likely outcomes on a fair die.' };
    if (t === 4) return { type: 'venn', events: [{ label: 'Rain', value: n[0] }, { label: 'Snow', value: n[1] }], disjoint: true, alt: 'Two mutually exclusive events shown as separate regions.' };
    if (t === 5) return { type: 'bar', data: [{ label: 'Boys', value: n[0] }, { label: 'Girls', value: n[1] }], alt: 'Bar chart of boys and girls in the year group.' };
    if (t === 6) return { type: 'probability-scale', alt: 'Probability scale from impossible at 0 to certain at 1.' };
    return { type: 'bar', data: [{ label: 'Red', value: n[1] }, { label: 'Not red', value: n[0] - n[1] }], alt: 'Relative-frequency results for red and not red.' };
  }

  if (topicId === 'probability-combined') {
    const t = v % 6;
    if (t === 1) return { type: 'sample-space', size: 6, alt: 'A six-by-six sample-space grid for two fair dice.' };
    if (t === 3) return { type: 'venn', events: [{ label: 'Goldfish', value: n[0] }, { label: 'Teddy', value: n[1] }], disjoint: true, alt: 'Two mutually exclusive prize events.' };
    if (t === 0) return { type: 'tree', stages: [['H  1/2', 'T  1/2'], ['H  1/2', 'T  1/2']], alt: 'Two-stage probability tree for two fair coin flips.' };
    if (t === 2 || t === 5) return { type: 'tree', stages: [[`Red  ${n[0]}`, `Blue  ${n[1]}`], ['Second draw', t === 2 ? 'replaced' : 'not replaced']], alt: `Two-stage probability tree for ${t === 2 ? 'sampling with replacement' : 'sampling without replacement'}.` };
    return { type: 'tree', stages: [[q.text.match(/P\(([^)]+)\) = ([^ ]+)/)?.slice(1).join('  ') || 'Event A', 'Event B'], [`${n.at(-1)} trials`, 'both events']], alt: 'Two-stage tree for independent events.' };
  }
  return null;
}

function scaleStimulus(v, q) {
  const t = v % 6;
  const n = numbers(q.text);
  if (t <= 2) return shape(t === 2 ? 'plan' : 'map', [label(t === 0 ? `${n.at(-1)} cm` : t === 1 ? `${n.at(-1)} km real distance` : `${n.at(-1)} m room`, 210, 170), label(t === 2 ? 'scale 1 : 100' : 'scale 1 : 25 000', 210, 62)], 'Not-to-scale plan or map segment with the supplied distance and scale.');
  if (t === 3) return shape('similar-triangles', [label(`${n[0]} cm`, 105, 220), label(`scale factor ${n[1]}`, 210, 60), label('? cm', 315, 220)], 'A triangle and its enlargement, drawn not to scale.');
  if (t === 4) return shape('similar-triangles', [label(`${n[0]} cm`, 105, 220), label(`${n[1]} cm`, 315, 220), label(`${n[2]} cm`, 80, 130), label('? cm', 340, 130)], 'Two similar triangles with matching sides labelled, drawn not to scale.');
  const bearing = q.answer;
  return shape('bearing', [], `Compass bearing diagram with a ray pointing ${q.text.match(/sails (.+)\./)?.[1] || ''}.`, { bearing });
}

function inequalityStimulus(v, q) {
  const t = v % 5;
  const n = numbers(q.text);
  if (t === 2) return { type: 'number-line', min: n[0] - 2, max: n[1] + 2, lower: n[0], upper: n[1], lowerClosed: false, upperClosed: true, alt: `Number line showing values greater than ${n[0]} and up to ${n[1]}.` };
  if (t !== 4) return null;
  const closed = q.text.includes('closed');
  const right = q.text.includes('right');
  return { type: 'number-line', min: n[0] - 4, max: n[0] + 4, lower: right ? n[0] : undefined, upper: right ? undefined : n[0], lowerClosed: closed, upperClosed: closed, alt: `Number line with a ${closed ? 'closed' : 'open'} endpoint at ${n[0]} and an arrow to the ${right ? 'right' : 'left'}.` };
}

/** Build answer-safe visual data from the exact values already present in a generated question. */
export function buildStimulus(topicId, variant, question) {
  return coordinateStimulus(topicId, variant, question)
    || geometryStimulus(topicId, variant, question)
    || dataStimulus(topicId, variant, question)
    || (topicId === 'scale' ? scaleStimulus(variant, question) : null)
    || (topicId === 'inequalities' ? inequalityStimulus(variant, question) : null);
}
