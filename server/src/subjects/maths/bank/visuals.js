const numbers = (text) => [...text.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));

const label = (text, x, y) => ({ text: String(text), x, y });
const shape = (kind, labels, alt, extra = {}) => ({ type: 'shape', kind, labels, alt, ...extra });

function coordinateStimulus(topicId, variant, question) {
  const text = question.text.replaceAll('−', '-');
  const pairs = [...text.matchAll(/\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/g)]
    .map((match) => [Number(match[1]), Number(match[2])]);

  if (topicId === 'graphs') {
    const type = variant % 8;
    if (type === 0 || type === 7) {
      const points = pairs.slice(0, 2).map(([x, y], index) => ({ x, y, label: `${index ? 'B' : 'A'} (${x}, ${y})` }));
      return {
        type: 'coordinate',
        points,
        segments: points.length === 2 ? [[points[0], points[1]]] : [],
        alt: `Coordinate grid showing ${points.map((point) => point.label).join(' and ')}.`,
      };
    }
  }

  if (topicId === 'transformations') {
    const type = variant % 8;
    if (type === 6) return null;
    const source = pairs[0];
    if (!source) return null;
    const vector = type === 0 || type === 7 ? pairs[1] : null;
    return {
      type: 'coordinate',
      points: [{ x: source[0], y: source[1], label: `Original (${source[0]}, ${source[1]})` }],
      vector: vector ? { x: vector[0], y: vector[1] } : undefined,
      emphasis: text.includes('x-axis') ? 'x' : text.includes('y-axis') ? 'y' : 'origin',
      operation: type === 1 || type === 2 || type === 7 ? 'reflection' : type === 3 || type === 4 ? 'rotation' : type === 5 ? 'enlargement' : 'translation',
      alt: `Coordinate grid with the original point at (${source[0]}, ${source[1]}); the image point is intentionally not shown.`,
    };
  }
  return null;
}

function geometryStimulus(topicId, variant, question) {
  const values = numbers(question.text);
  if (topicId === 'transformations' && variant % 8 === 6) {
    const name = question.text.match(/does (?:an? )?(.+?) have\?/)?.[1] || 'shape';
    if (name.includes('parallelogram')) return shape('parallelogram', [], 'A parallelogram that is not a rectangle or rhombus, shown without symmetry lines.');
    if (name.includes('rectangle')) return shape('rectangle', [], 'A non-square rectangle, shown without symmetry lines.');
    if (name.includes('isosceles')) return shape('isosceles', [], 'An isosceles triangle, shown without symmetry lines.');
    const sideCounts = { square: 4, 'equilateral triangle': 3, 'regular hexagon': 6, 'regular octagon': 8, 'regular pentagon': 5 };
    return shape('polygon', [], `A ${name}, shown without symmetry lines.`, { sides: sideCounts[name] || 4 });
  }
  if (topicId === 'angles') {
    const type = variant % 9;
    if (type === 0) return shape('straight-angle', [label(`${values[0]}°`, 155, 118), label('?°', 260, 118)], 'Two adjacent angles on a straight line.');
    if (type === 1) return shape('around-point', [label(`${values[0]}°`, 145, 92), label(`${values[1]}°`, 260, 95), label('?°', 210, 180)], 'Three angles meeting at one point.');
    if (type === 2) return shape('triangle', [label(`${values[0]}°`, 100, 215), label(`${values[1]}°`, 315, 215), label('?°', 210, 75)], 'Triangle with two known angles and one unknown angle.');
    if (type === 3) return shape('quadrilateral', [label(`${values[0]}°`, 105, 190), label(`${values[1]}°`, 305, 190), label(`${values[2]}°`, 285, 80), label('?°', 125, 80)], 'Quadrilateral with three known angles and one unknown angle.');
    if (type === 4 || type === 5) return shape('parallel-lines', [label(`${values[0]}°`, 155, 104), label('?°', type === 4 ? 265 : 165, 170)], 'Two parallel lines crossed by a transversal, with one known and one unknown angle.', { relation: type === 4 ? 'alternate' : 'co-interior' });
    if (type === 6) return shape('polygon', [], 'A regular polygon named in the question.', { sides: [5, 6, 8, 7, 9, 10, 12, 4][Math.floor(variant / 9) % 8] });
    if (type === 7) return shape('polygon', [], `A polygon with ${values[0]} sides.`, { sides: values[0] });
    return shape('isosceles', [label(`${values[0]}°`, 210, 75), label('?°', 105, 215)], 'Isosceles triangle with equal-side marks, a known apex angle and an unknown base angle.');
  }

  if (topicId === 'area-perimeter') {
    const type = variant % 8;
    if (type <= 1) return shape('rectangle', [label(`${values[0]} ${type ? 'm' : 'cm'}`, 210, 225), label(`${values[1]} ${type ? 'm' : 'cm'}`, 330, 140)], 'Rectangle labelled with its length and width.');
    if (type === 2) return shape('triangle-height', [label(`${values[0]} cm`, 210, 225), label(`${values[1]} cm`, 223, 135)], 'Triangle with labelled base and perpendicular height.');
    if (type === 3) return shape('parallelogram', [label(`${values[0]} cm`, 220, 225), label(`${values[1]} cm`, 145, 135)], 'Parallelogram with labelled base and perpendicular height.');
    if (type === 4) return shape('trapezium', [label(`${values[0]} cm`, 210, 65), label(`${values[1]} cm`, 210, 225), label(`${values[2]} cm`, 125, 140)], 'Trapezium with both parallel sides and its perpendicular height labelled.');
    if (type === 5) return shape('joined-rectangles', [label(`${values[0]} × ${values[1]} cm`, 155, 120), label(`${values[2]} × ${values[3]} cm`, 285, 185)], 'Two joined rectangles with their dimensions labelled.');
    if (type === 6) return shape('rectangle', [label(`${values[1]} cm`, 210, 225), label('? cm', 330, 140), label(`perimeter ${values[0]} cm`, 210, 52)], 'Rectangle with a known perimeter and length, and unknown width.');
    return shape('frame', [label(`${values[0]} × ${values[1]} cm photo`, 210, 145), label(`${values[2]} cm frame`, 320, 70)], 'Rectangular photograph surrounded by an even-width frame.');
  }

  if (topicId === 'circles') {
    const type = variant % 8;
    const value = values[0];
    const measure = type === 1 || type === 2 || type === 5 ? 'radius' : type === 6 ? 'circumference' : 'diameter';
    return shape(type === 4 ? 'semicircle' : type === 7 ? 'wheel' : 'circle', [label(measure === 'radius' ? `r = ${value} cm` : measure === 'circumference' ? `C = ${value} cm` : type === 7 ? `d = ${value} m` : `d = ${value} cm`, 210, 142)], type === 4 ? 'Semicircle with its diameter labelled.' : 'Circle with the supplied measurement labelled.', { measure });
  }

  if (topicId === 'pythagoras') {
    const type = variant % 6;
    if (type === 3) {
      const sides = values.slice(0, 3);
      return shape('scalene', [label(`${sides[0]} cm`, 125, 185), label(`${sides[1]} cm`, 290, 185), label(`${sides[2]} cm`, 215, 225)], 'Not-to-scale triangle with all three side lengths labelled; no right-angle mark is shown.');
    }
    if (type === 4) return shape('ladder', [label(`${values[0]} m`, 255, 120), label(`${values[1]} m`, 250, 225), label('? m', 125, 135)], 'Ladder leaning against a vertical wall, forming a right-angled triangle.');
    if (type === 5) return shape('rectangle-diagonal', [label(`${values[0]} cm`, 210, 225), label(`${values[1]} cm`, 330, 140), label('? cm', 220, 125)], 'Rectangle with its dimensions labelled and diagonal marked unknown.');
    const labels = type === 2
      ? [label(`${values[0]} cm`, 255, 120), label(`${values[1]} cm`, 210, 225), label('? cm', 120, 135)]
      : [label(`${values[0]} cm`, 120, 140), label(`${values[1]} cm`, 210, 225), label('? cm', 260, 120)];
    return shape('right-triangle', labels, 'Right-angled triangle with known sides labelled and the required side marked unknown.');
  }

  if (topicId === 'trigonometry') {
    const type = variant % 6;
    if (type === 3) return null;
    if (type === 4) return shape('ladder', [label(`${values[0]} m`, 255, 120), label(`${values[1]}°`, 275, 205), label('? m', 125, 135)], 'Ladder against a wall with its length and angle to the ground labelled.');
    const sideName = type === 0 || type === 1 ? 'hypotenuse' : 'adjacent';
    const side = type === 2 || type === 5 ? values[1] : values[0];
    const angle = type === 2 || type === 5 ? values[0] : values[1];
    const unknownPosition = type === 1 ? [220, 225] : type === 5 ? [270, 120] : [120, 135];
    return shape('right-triangle', [label(`${side} cm ${sideName}`, sideName === 'hypotenuse' ? 270 : 220, sideName === 'hypotenuse' ? 120 : 225), label(`${angle}°`, 285, 202), label('? cm', unknownPosition[0], unknownPosition[1])], 'Right-angled triangle with the supplied side and angle labelled and the required side marked unknown.');
  }

  if (topicId === 'volume-surface') {
    const type = variant % 6;
    if (type === 4) return null;
    if (type === 1) return shape('cuboid', [label(`${values[0]} cm`, 285, 218)], 'Cube with its side length labelled.');
    if (type === 3) return shape('triangular-prism', [label(`${values[0]} cm`, 102, 200), label(`${values[1]} cm`, 132, 140), label(`${values[2]} cm`, 300, 195)], 'Triangular prism with cross-section base, perpendicular height and prism length labelled.');
    return shape('cuboid', [label(`${values[0]} cm`, 270, 220), label(`${values[1]} cm`, 345, 170), label(`${values[2]} cm`, 115, 130)], 'Cuboid with length, width and height labelled.');
  }
  return null;
}

function dataStimulus(topicId, variant, question) {
  const values = numbers(question.text);
  if (topicId === 'averages' && (variant % 8 === 4 || variant % 8 === 5)) {
    const rows = [...question.text.matchAll(/(\d+):\s*(\d+)/g)].map((match) => [Number(match[1]), Number(match[2])]);
    return { type: 'table', headings: ['Number of pets', 'Frequency'], rows, alt: 'Frequency table showing numbers of pets owned by students.' };
  }

  if (topicId === 'sequences' && variant % 8 === 7) {
    return { type: 'dot-pattern', patterns: [1, 2, 3], alt: 'The first three growing dot patterns, containing five, nine and thirteen dots.' };
  }

  if (topicId === 'charts') {
    const type = variant % 6;
    if (type === 0) return { type: 'pie', angle: null, alt: 'Blank pie-chart template ready for the calculated sector.', prompt: `${values[1]} of ${values[0]}` };
    if (type === 1) return { type: 'pie', angle: values[1], alt: `Pie chart with a train sector of ${values[1]} degrees.`, prompt: `${values[0]} people` };
    if (type === 2) {
      const match = question.text.match(/\n(.+): (\d+)\.\s+(.+): (\d+)\./);
      return { type: 'bar', data: match ? [{ label: match[1], value: +match[2] }, { label: match[3], value: +match[4] }] : [], alt: 'Bar chart comparing the two categories in the question.' };
    }
    if (type === 3) return { type: 'table', headings: ['', 'Girls', 'Boys', 'Total'], rows: [['Walk', values[0], values[1], '?'], ['All pupils', '', '', values[2]]], alt: 'Part-completed two-way table of travel to school.' };
    if (type === 4) return { type: 'tally', count: question.answer, alt: `A tally showing ${question.answer} items.` };
    const symbol = question.text.includes('✿') ? '✿' : question.text.includes('☆') ? '☆' : '○';
    return { type: 'pictogram', symbol, value: values[0], count: values[1], alt: `Pictogram with ${values[1]} symbols; each symbol represents ${values[0]}.` };
  }

  if (topicId === 'scatter') {
    const type = variant % 4;
    if (type === 0) {
      const direction = question.answerText.startsWith('positive') ? 1 : question.answerText.startsWith('negative') ? -1 : 0;
      const axes = question.text.match(/plots (.+) against (.+)\./);
      const base = [[1, 2], [2, 3.4], [3, 2.8], [4, 5.1], [5, 4.6], [6, 6.5], [7, 6.1]];
      const points = base.map(([x, y], index) => ({ x, y: direction === 1 ? y : direction === -1 ? 8 - y : [4, 1.8, 6.6, 3, 6.1, 2.4, 4.8][index] }));
      return { type: 'scatter', points, xLabel: axes?.[1], yLabel: axes?.[2], alt: 'Scatter graph to classify by its overall trend.' };
    }
    if (type === 1) {
      const points = [...question.text.matchAll(/\((\d+),\s*(\d+)\)/g)].map((match) => ({ x: +match[1], y: +match[2] }));
      return { type: 'scatter', points: [], line: points.slice(0, 2), queryX: values.at(-1), alt: 'Line of best fit on coordinate axes; use it to estimate the requested value.' };
    }
    if (type === 2) {
      const points = [...question.text.matchAll(/\((\d+),\s*(\d+)\)/g)].map((match) => ({ x: +match[1], y: +match[2] }));
      return { type: 'scatter', points, alt: 'Scatter graph containing a cluster and one point that does not fit the pattern.' };
    }
    return { type: 'range', min: values[0], max: values[1], alt: `Observed data range from ${values[0]} to ${values[1]}; values outside are extrapolations.` };
  }

  if (topicId === 'probability-basic') {
    const type = variant % 8;
    if (type <= 1) return { type: 'counters', groups: [{ label: 'Red', count: values[0], color: 'var(--negative)' }, { label: 'Blue', count: values[1], color: 'var(--info)' }], alt: `Bag containing ${values[0]} red and ${values[1]} blue counters.` };
    if (type === 3) return { type: 'dice', alt: 'The six equally likely outcomes on a fair die.' };
    if (type === 4) return { type: 'venn', events: [{ label: 'Rain', value: values[0] }, { label: 'Snow', value: values[1] }], disjoint: true, alt: 'Two mutually exclusive events shown as separate regions.' };
    if (type === 5) return { type: 'bar', data: [{ label: 'Boys', value: values[0] }, { label: 'Girls', value: values[1] }], alt: 'Bar chart of boys and girls in the year group.' };
    if (type === 6) return { type: 'probability-scale', alt: 'Probability scale from impossible at 0 to certain at 1.' };
    return { type: 'bar', data: [{ label: 'Red', value: values[1] }, { label: 'Not red', value: values[0] - values[1] }], alt: 'Relative-frequency results for red and not red.' };
  }

  if (topicId === 'probability-combined') {
    const type = variant % 6;
    if (type === 1) return { type: 'sample-space', size: 6, alt: 'A six-by-six sample-space grid for two fair dice.' };
    if (type === 3) return { type: 'venn', events: [{ label: 'Goldfish', value: values[0] }, { label: 'Teddy', value: values[1] }], disjoint: true, alt: 'Two mutually exclusive prize events.' };
    if (type === 0) return { type: 'tree', stages: [['H  1/2', 'T  1/2'], ['H  1/2', 'T  1/2']], alt: 'Two-stage probability tree for two fair coin flips.' };
    if (type === 2 || type === 5) return { type: 'tree', stages: [[`Red  ${values[0]}`, `Blue  ${values[1]}`], ['Second draw', type === 2 ? 'replaced' : 'not replaced']], alt: `Two-stage probability tree for ${type === 2 ? 'sampling with replacement' : 'sampling without replacement'}.` };
    return { type: 'tree', stages: [[question.text.match(/P\(([^)]+)\) = ([^ ]+)/)?.slice(1).join('  ') || 'Event A', 'Event B'], [`${values.at(-1)} trials`, 'both events']], alt: 'Two-stage tree for independent events.' };
  }
  return null;
}

function scaleStimulus(variant, question) {
  const type = variant % 6;
  const values = numbers(question.text);
  if (type <= 2) return shape(type === 2 ? 'plan' : 'map', [label(type === 0 ? `${values.at(-1)} cm` : type === 1 ? `${values.at(-1)} km real distance` : `${values.at(-1)} m room`, 210, 170), label(type === 2 ? 'scale 1 : 100' : 'scale 1 : 25 000', 210, 62)], 'Not-to-scale plan or map segment with the supplied distance and scale.');
  if (type === 3) return shape('similar-triangles', [label(`${values[0]} cm`, 105, 220), label(`scale factor ${values[1]}`, 210, 60), label('? cm', 315, 220)], 'A triangle and its enlargement, drawn not to scale.');
  if (type === 4) return shape('similar-triangles', [label(`${values[0]} cm`, 105, 220), label(`${values[1]} cm`, 315, 220), label(`${values[2]} cm`, 80, 130), label('? cm', 340, 130)], 'Two similar triangles with matching sides labelled, drawn not to scale.');
  return shape('bearing', [], `Compass bearing diagram with a ray pointing ${question.text.match(/sails (.+)\./)?.[1] || ''}.`, { bearing: question.answer });
}

function inequalityStimulus(variant, question) {
  const type = variant % 5;
  const values = numbers(question.text);
  if (type === 2) return { type: 'number-line', min: values[0] - 2, max: values[1] + 2, lower: values[0], upper: values[1], lowerClosed: false, upperClosed: true, alt: `Number line showing values greater than ${values[0]} and up to ${values[1]}.` };
  if (type !== 4) return null;
  const closed = question.text.includes('closed');
  const right = question.text.includes('right');
  return { type: 'number-line', min: values[0] - 4, max: values[0] + 4, lower: right ? values[0] : undefined, upper: right ? undefined : values[0], lowerClosed: closed, upperClosed: closed, alt: `Number line with a ${closed ? 'closed' : 'open'} endpoint at ${values[0]} and an arrow to the ${right ? 'right' : 'left'}.` };
}

/** Build answer-safe visual data from the exact values already present in a generated question. */
export function buildStimulus(topicId, variant, question) {
  return coordinateStimulus(topicId, variant, question)
    || geometryStimulus(topicId, variant, question)
    || dataStimulus(topicId, variant, question)
    || (topicId === 'scale' ? scaleStimulus(variant, question) : null)
    || (topicId === 'inequalities' ? inequalityStimulus(variant, question) : null);
}
