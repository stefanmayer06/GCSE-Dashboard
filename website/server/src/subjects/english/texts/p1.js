/**
 * Original contemporary fiction for independent AQA-style Paper 1 practice.
 * These are practice passages, not published literature or official exam sources.
 * New IDs keep archived classic texts and their saved sessions intact.
 * Q1: four three-option choices; Q3: a specified structural effect;
 * Q4: evaluation of a specified later part; Q5: description or story opening.
 */
function originalText(entry) {
  return {
    kind: 'Original fiction',
    author: 'Written for GCSE Study Desk',
    year: '2026',
    century: '21st century',
    source: 'Original fiction written for practice',
    skills: ['listing', 'language', 'structure', 'evaluation', 'creative-writing'],
    ...entry,
  };
}

export const P1_TEXTS = [
  originalText({
    id: 'p1-last-crossing',
    title: 'The Last Crossing',
    text: `Nia reached the marsh gate at twenty minutes to seven. A notice said that the footbridge closed at seven, when the tide began to cover the lower path. She had come to collect the field recorder her brother had left in the bird hide. In her pocket were the hide key and a folded shopping bag; neither seemed particularly useful against the weather.

Beyond the bridge, a man in an orange jacket stood beside the path. He held a pair of binoculars above his head. Nia thought he was waving until she saw his other hand clutching a fence post. There were plenty of ways to lose your footing out here. Apparently he had found one.

Water threaded the grass in silver stitches. Each channel looked narrow enough to step over, but beneath its polished surface the mud was deep and greedy. The path ahead lay like a fraying ribbon, its edges disappearing into the reeds. Somewhere behind them a bird gave a thin, irritated cry, and the wind carried it away before the sound was finished.

Nia tested the first board of the bridge. It bent with a damp complaint. Through the gaps she could see the water sliding underneath, smooth as glass, concealing everything it touched. She had crossed this bridge in summer, when children ran over it with ice creams. Now the rail was slick against her palm and the far bank seemed to be moving away.

"Don't come off the boards," the man called. His voice was steady, but the words arrived in pieces. "My boot's stuck. I've called the warden."

Nia looked back at the gate. She could leave the recorder until tomorrow. She could tell someone at the car park. She could do several sensible things which would put a fence and a locked gate between her and this stranger. The man shifted his weight, and the post tilted.

She stayed on the bridge. At its far end hung a rescue line in a white box, exactly where her brother had said it would be. Her fingers struggled with the catch. She had to press it twice before she could lift the lid.

"I can't reach you," she said. It came out louder than she expected. "But there's a line."

She threw. The loop landed short, a bright coil on the dark mud. For a moment neither of them moved. Then she pulled it back, gathered the rope more carefully and tried again. This time he caught it. He secured the end to the post and stopped shifting about.

From the gate came the clatter of boots: the warden, carrying a long pole. Nia stepped aside. Only then did she notice that her knees were shaking hard enough to knock against the rail.

"You stayed," the man said as the warden reached him.

Nia looked at the white box, at the shopping bag still folded in her pocket, at the recorder she had completely forgotten. "I nearly didn't."

The warden's radio crackled. Seven o'clock. Nia held the gate open while the others came through, and kept holding it until both of them were safely on the road.`,
    q1: {
      range: { start: 'Nia reached the marsh gate', end: 'Apparently he had found one.' },
      focus: 'Read from the beginning to "Apparently he had found one."',
    },
    q2: {
      range: { start: 'Water threaded the grass', end: 'the far bank seemed to be moving away.' },
      focus: 'Use the part from "Water threaded the grass" to "the far bank seemed to be moving away."\nHow does the writer use language to make the marsh seem unsafe?',
    },
    q3: {
      focus: 'Read the whole extract, the opening of an original short story.\nHow has the writer organised the extract to build tension? You could consider the order of events, changes in focus and what the ending leaves unresolved.',
    },
    q4: {
      range: { start: 'Nia looked back at the gate.', end: 'both of them were safely on the road.' },
      statement: '"Nia is brave because she acts despite her fear."',
      focus: 'Use only the later part, from "Nia looked back at the gate." to the end.\nTo what extent do you agree? Develop your judgement, examine the writer’s choices and support your views with evidence from this part.',
    },
    q5a: 'For a school creative-writing magazine, describe a stretch of coast in changing weather. Use your imagination; you may use the picture for ideas.',
    q5b: 'For the same magazine, write the opening of a story in which someone must decide whether to turn back. Develop the setting and the moment of hesitation.',
    q5Image: {
      file: 'Low tide off the Graveney Marshes - geograph.org.uk - 3300392.jpg',
      alt: 'Salt marsh at low tide, with winding water channels beneath a grey sky.',
      credit: 'Wikimedia Commons · geograph.org.uk',
    },
  }),
  originalText({
    id: 'p1-signal-on-the-moor',
    title: 'A Signal on the Moor',
    text: `Leena had promised her brother a short walk: up to the weather station and back before lunch. Owen carried their dad's old camera, although he had forgotten its memory card. She carried the map. At the last gate her phone lost its signal, and she put it away rather than admit that she had been using it instead.

The weather station should have been beside a stone wall, with a green fence round it. There was the wall. There was the fence. In the middle stood a blue metal box which neither of them remembered. Three lights flashed along its side, one after another, as evenly as the ticking of a clock.

"New battery," Leena said. She had no idea what the box was, but it felt better to give it a name.

The moor had gone strangely quiet. Mist pooled in the hollows, whitening the grass until the ground seemed to end a few metres from their boots. The box had no handle, no label, not even a scratch. Its blue surface swallowed the weak daylight. A low hum rested against Leena's teeth; she could feel it when she shut her mouth. The lights kept their patient rhythm. They did not illuminate the mist. They seemed to make small holes in it.

Owen raised the useless camera. "Might as well look."

He stepped towards the fence. The box clicked. A second click followed, and then a soft crunch, exactly like a boot pressing into wet gravel. Leena glanced behind her. The path was empty. Owen took another step. Crunch. This time the sound came before his foot touched the ground.

"Stay there," she said.

He froze, one hand on the fence. In the silence the box made two more footsteps. Then it stopped. Leena's neat explanation began to come apart. A battery did not predict where you were going.

Owen was watching her now. He always did this when he wanted her to make something ordinary again. She could invent another explanation: a speaker, a sensor, a game left by people who had too much time. She could hear how confident she would sound. Instead she took the map out and unfolded it with both hands, slowly, because they would not stay still.

The first voice from the box was hers.

"Stay there," it said.

Owen backed away. "That's what you just—"

His own voice interrupted him, thin and hurried: "Don't open it."

Neither of them had said that.

Under the row of lights, a small screen woke. Leena could make out a date and a time. Twelve fifteen. Tomorrow. The camera slipped against Owen's jacket, and its little plastic buckle struck the fence. A moment earlier, from somewhere inside the blue box, Leena had heard the same small knock.

She folded the map along the wrong crease. "We go back together," she said, and waited for the box to answer.`,
    q1: {
      range: { start: 'Leena had promised her brother', end: 'as evenly as the ticking of a clock.' },
      focus: 'Read from the beginning to "as evenly as the ticking of a clock."',
    },
    q2: {
      range: { start: 'The moor had gone strangely quiet.', end: 'They seemed to make small holes in it.' },
      focus: 'Use the paragraph from "The moor had gone strangely quiet." to "They seemed to make small holes in it."\nHow does the writer use language to make the box and its surroundings seem unfamiliar?',
    },
    q3: {
      focus: 'Read the whole extract, the opening of an original short story.\nHow has the writer organised it to increase suspense? You could consider how information is revealed, shifts in attention and the final moment.',
    },
    q4: {
      range: { start: 'He froze, one hand on the fence.', end: 'waited for the box to answer.' },
      statement: '"Leena loses confidence, yet still tries to protect her brother."',
      focus: 'Use only the later part, from "He froze, one hand on the fence." to the end.\nTo what extent do you agree? Evaluate the portrayal of Leena, the writer’s choices and the evidence in this part.',
    },
    q5a: 'For a school creative-writing magazine, describe an unfamiliar object in an open landscape. Use your imagination; the picture may give you ideas for the setting.',
    q5b: 'For the same magazine, write the opening of a story about a discovery that is difficult to explain. Let the reader share the character’s uncertainty.',
    q5Image: {
      file: 'A misty day on the moors - geograph.org.uk - 2758115.jpg',
      alt: 'Mist across open moorland, with a distant track and low hills.',
      credit: 'Wikimedia Commons · geograph.org.uk',
    },
  }),
  originalText({
    id: 'p1-the-spare-room',
    title: 'The Spare Room',
    text: `Asha arrived at the hotel at nine twenty, forty minutes before her audition. The receptionist gave her a brass key with the number eight on it. There were no practice rooms downstairs, he explained, so she could use a spare bedroom. She thanked him twice and carried her borrowed violin up the stairs, keeping the case away from the polished wall.

Her dad had packed a cheese sandwich in the outside pocket. She could feel it pressing against the case whenever she changed hands. At the top of the stairs she checked the number, checked the key and wiped her shoes on a mat that looked cleaner than anything she had ever worn.

The room opened around her in pale gold. Curtains fell in heavy folds from a height that made her neck ache; a chandelier held a hundred tiny copies of the morning sun. The bed stood in the centre, plump and untouched, as though nobody had ever needed to sleep in it. Even the chair had silk-covered arms. It did not welcome her. It displayed her.

She set the violin case on the carpet. Beside the enormous wardrobe it looked like a small animal pretending not to be seen. In the mirror she noticed a loose thread on her cuff, then another. She tucked both inside her sleeve. The silence here seemed expensive. She was afraid of putting a sound into it.

Downstairs, someone played a scale perfectly. Asha could hear the last note settle without a wobble. She drew the bow from its case, tightened it and set it on the bed. Then she moved it to the chair. Then she picked it up again.

A knock came at the door.

The woman outside wore a housekeeping apron and carried a stack of towels. "Not interrupting?"

"I'm meant to practise," Asha said, which was not quite an answer.

The woman looked at the violin. "Go on, then. This room's heard worse."

She placed the towels beside the basin and reached up to open the window. The handle stuck. She frowned, gripped it with both hands and gave it an unceremonious shove. Traffic rushed into the room, followed by the argument of two pigeons on the ledge. Asha laughed before she could stop herself.

"There," the woman said. "A bit of air."

In the brighter, untidy noise, Asha opened her music. The first page had a coffee stain in one corner and her teacher's pencilled reminder across the top: breathe. She put the violin under her chin. Her bow caught the string too hard, and the first note scratched.

She stopped. The woman was still at the door, shifting the towels that remained on her arm.

"Another go?" she asked.

Asha nodded. The next note was steadier. She played past the difficult bar, then past the coffee stain, until she was no longer listening for the perfect scale downstairs. When she lowered the violin, the chair was simply a chair. She sat on it and ate her sandwich.`,
    q1: {
      range: { start: 'Asha arrived at the hotel', end: 'cleaner than anything she had ever worn.' },
      focus: 'Read from the beginning to "cleaner than anything she had ever worn."',
    },
    q2: {
      range: { start: 'The room opened around her', end: 'She was afraid of putting a sound into it.' },
      focus: 'Use the part from "The room opened around her" to "She was afraid of putting a sound into it."\nHow does the writer use language to make the room seem intimidating to Asha?',
    },
    q3: {
      focus: 'Read the whole extract, the opening of an original short story.\nHow has the writer organised it to show Asha becoming more at ease? You could consider contrasts, changes in focus and the return to an earlier detail.',
    },
    q4: {
      range: { start: 'The woman looked at the violin.', end: 'She sat on it and ate her sandwich.' },
      statement: '"The woman’s ordinary actions make a powerful difference to Asha."',
      focus: 'Use only the later part, from "The woman looked at the violin." to the end.\nTo what extent do you agree? Develop a judgement about the woman’s impact and evaluate how the writer presents it, using evidence from this part.',
    },
    q5a: 'For a school creative-writing magazine, describe a room that makes a strong impression on its visitor. Use your imagination; you may use the picture for ideas.',
    q5b: 'For the same magazine, write the opening of a story about someone preparing for an important performance. Focus on what the character notices and feels.',
    q5Image: {
      file: 'Harewood House The State Bedroom (218306803).jpeg',
      alt: 'A grand bedroom with tall windows, drapes and a canopied bed.',
      credit: 'Wikimedia Commons',
    },
  }),
  originalText({
    id: 'p1-captain-for-a-morning',
    title: 'Captain for a Morning',
    text: `Hari was waiting beside the harbour steps at eight o'clock, wearing the life jacket his aunt had insisted he bring. He had been promised a morning on a sailing boat, helping Captain Mags deliver it to the next harbour. The boat was called Daring. Beneath its fresh white letters, where the paint had peeled, he could make out the older name: Nearly There.

Mags arrived carrying a flask and a packet of ginger biscuits. She put both on the wall, shook Hari's hand and inspected the knot he had tied in the boat's loose rope. "Very decorative," she said. "We'll give it a job in a minute."

Her yellow coat had three buttons, none of them the same. A pencil protruded from her woollen hat at an angle which suggested a minor collision. When she smiled, one eyebrow stayed serious, as if it had been appointed to supervise the rest of her face. Hari watched her lower the biscuits into the boat with more care than she had given the flask. This was not how captains looked in the books he had read.

She retied his knot without a word, then tapped the little brass compass. "Knows the way. Terrible company."

Hari laughed politely. He was beginning to think the morning might be very long.

Beyond the harbour mouth, the wind changed. A loose sail slapped the mast, a sharp sound that made him flinch. The boat leaned. For a moment the water was much closer to his elbow than it ought to have been.

Mags put the flask down. Her voice lost its wandering, conversational shape.

"Stay seated, Hari. I've got it."

She moved once, quickly, and the sail filled. The noise stopped. The boat settled into the wind, lifting over a wave instead of striking through it. Hari looked at her hands. He had not noticed them before: broad, scarred, working without any wasted movement. She watched the water beyond him, measuring something he could not see.

"There we are," she said. "Daring's remembered what she's for."

He wanted to ask how she had known what to do, but the question seemed too large. He asked whether the biscuits were safe instead.

"Safer than we are. Waterproof tin."

She saw his expression and softened her voice. "You're doing fine. Being quiet doesn't mean being useless. Tell me when you see the red buoy."

Hari watched the water. He found the buoy, lost it behind a wave, found it again and pointed. Mags nodded. It was a small job, but she had given it to him as though it mattered.

The harbour fell away behind them. Mags passed him a biscuit, keeping her eyes on the sea. This time, when she made a joke about the compass, Hari laughed because it was funny. On the side of the boat, just above the water, the old letters vanished and appeared with each rise of the waves.`,
    q1: {
      range: { start: 'Hari was waiting beside', end: 'We\'ll give it a job in a minute."' },
      focus: 'Read from the beginning to "We\'ll give it a job in a minute."',
    },
    q2: {
      range: { start: 'Her yellow coat had three buttons', end: 'Terrible company."' },
      focus: 'Use the part from "Her yellow coat had three buttons" to "Terrible company."\nHow does the writer use language to make Mags seem unusual and amusing?',
    },
    q3: {
      focus: 'Read the whole extract, the opening of an original short story.\nHow has the writer organised it to change Hari’s impression of Mags? You could consider shifts in tone, the placement of the difficult moment and the ending.',
    },
    q4: {
      range: { start: 'Mags put the flask down.', end: 'with each rise of the waves.' },
      statement: '"Mags earns Hari’s trust through her skill and her kindness."',
      focus: 'Use only the later part, from "Mags put the flask down." to the end.\nTo what extent do you agree? Evaluate the portrayal of Mags and support your judgement with references to this part.',
    },
    q5a: 'For a school creative-writing magazine, describe a harbour or a boat at sea. Use your imagination; you may use the picture for ideas.',
    q5b: 'For the same magazine, write the opening of a story in which someone’s first impression proves misleading. Establish the characters before revealing everything.',
    q5Image: {
      file: 'Tall ship sailing from Poole Harbour, passing Old Harry rocks - geograph.org.uk - 2746399.jpg',
      alt: 'A sailing ship passing white chalk sea stacks beneath a wide sky.',
      credit: 'Wikimedia Commons · geograph.org.uk',
    },
  }),
  originalText({
    id: 'p1-the-road-home',
    title: 'The Road Home',
    text: `Milo got off the bus one stop too early. He realised this only after its red lights had disappeared round the bend. The village shop was closed, and the screen of his phone showed one per cent. In his rucksack was a postcard from his grandad, with the address written in careful capitals: 5 BEECH LANE. He had been invited to stay for the last week of the summer holidays.

The driver had told him to look for a yellow gate. Milo could see three gates from the bus stop. All of them looked grey in the falling light. He took out the postcard, held it close to his face and chose the road that climbed between the hedges.

The hedges rose on either side like the walls of a narrowing corridor. Water dripped from their leaves in slow, separate taps. Each tap seemed to start another in the darkness ahead. The last light lay in a thin strip along the road; beyond it, the tarmac dissolved into a black pool. Milo's trainers made a dry scraping sound which followed him too closely. He stopped. The sound stopped too.

He almost laughed at himself. Then something moved in the hedge. He began walking again, more quickly, and tried not to imagine how he would describe this to his mum if he ever found enough signal to call her.

At the fork there was no sign. Milo checked his phone once more. The screen went black before he could open the map. He pressed the button, as if the phone might reconsider. It did not.

He stood between the two roads with the postcard in his hand. His grandad had written about the shed, the tomatoes, the things they could mend together. He had not mentioned how to get there in the dark.

A light appeared beyond the left-hand hedge. It swayed, vanished, then returned. Milo took a step backwards.

"Milo?"

He knew the voice. Even so, he waited until the light had reached the fork and he could see the old green coat behind it.

"Thought you might have got the wrong stop," his grandad said. "I do it myself."

The torch was wrapped with tape. In its yellow circle the road looked ordinary again: a drain, a flattened leaf, Milo's dusty shoes. The movement in the hedge became a blackbird hopping away from them, offended by the light.

His grandad did not ask why he had gone up the hill. He took the heavier bag and walked at Milo's pace, pointing out the turning and the gate, which really was yellow. "We'll put a better sign there tomorrow."

Inside the house, a lamp shone on two mugs and a plate of toast. Milo had expected to spend the first evening being shown things: the spare room, the bathroom, the rules. Instead his grandad asked him to hold a cupboard door while he tightened a screw. Milo put his hand against the wood. It was a small, useful thing to do.

Later, at the back door, he set his trainers beside the muddy green boots. There was already room for them.`,
    q1: {
      range: { start: 'Milo got off the bus', end: 'the road that climbed between the hedges.' },
      focus: 'Read from the beginning to "the road that climbed between the hedges."',
    },
    q2: {
      range: { start: 'The hedges rose on either side', end: 'The sound stopped too.' },
      focus: 'Use the paragraph from "The hedges rose on either side" to "The sound stopped too."\nHow does the writer use language to make the road feel threatening to Milo?',
    },
    q3: {
      focus: 'Read the whole extract, the opening of an original short story.\nHow has the writer organised it to move from anxiety to reassurance? You could consider the sequence of discoveries, changes in focus and the closing detail.',
    },
    q4: {
      range: { start: 'A light appeared beyond the left-hand hedge.', end: 'There was already room for them.' },
      statement: '"Milo’s grandad makes him feel welcome without making him feel foolish."',
      focus: 'Use only the later part, from "A light appeared beyond the left-hand hedge." to the end.\nTo what extent do you agree? Examine how the writer presents the welcome and support your judgement with evidence from this part.',
    },
    q5a: 'For a school creative-writing magazine, describe a road as daylight fades. Use your imagination; you may use the picture for ideas.',
    q5b: 'For the same magazine, write the opening of a story about arriving somewhere for the first time. Use the surroundings to reveal the character’s feelings.',
    q5Image: {
      file: 'Lane from White House Farm - geograph.org.uk - 414113.jpg',
      alt: 'A narrow country lane bordered by hedges and fields.',
      credit: 'Wikimedia Commons · geograph.org.uk',
    },
  }),
  originalText({
    id: 'p1-the-test-run',
    title: 'The Test Run',
    text: `Sana reached the community hall at six o'clock, carrying the model city in a cardboard tray. Her brother Theo followed with a toolbox. The doors opened to visitors at half past six, and she had been given the table nearest the stage. For three weeks she had promised that every window in the model would light up when she turned a single handle.

The hall smelled of floor polish and warm dust. Rain tapped against the high windows. Sana set the tray down, unwrapped the handle and told Theo that they had plenty of time. He put the toolbox underneath the table without answering.

From the front, the city looked magnificent. Towers of clear plastic caught the ceiling lights and broke them into bright fragments. Tiny silver roads threaded between the houses; a miniature river curled towards a bridge no longer than Sana's thumb. At the back, where nobody was supposed to look, wires sprawled in a tangled nest. A strip of tape held them down. One loose end twitched whenever she moved the tray, like something trying to escape.

She had made a little sign: ONE HANDLE. ONE HUNDRED LIGHTS. She straightened it, stepped back and imagined people stopping to read it. The rain grew louder. Somewhere outside, thunder rolled along the roofs of the shops.

Theo pointed at the wires. "Did you check that connection?"

"It worked yesterday."

"That's not what I asked."

She turned the handle. Three windows glowed. Another flickered. Then the bridge went dark. Sana turned faster, pressing her thumb against the metal until it hurt. The small motor made a dry, exhausted sound. Theo reached for the toolbox.

"Leave it," she said. "I can do it."

The lights in the hall went out.

For a moment Sana thought she had broken those too. Then she heard rain, chairs scraping, a laugh from somewhere near the doors. A phone torch cut across the room. Another followed. In their moving light the perfect city looked flat and flimsy, a collection of packaging that should have been put in the recycling.

Theo was beside her. "It's the storm."

She nodded, but she could not make herself look at him. Under the table his toolbox was still closed. She remembered all the evenings he had held a wire or fetched a screw while she explained the project as if she had made it alone.

The organiser came over with a lantern. "Can we show it like this? People are coming in."

Sana looked at her sign. One hundred lights. Behind it, three uncertain windows shone whenever her hand moved.

"It isn't ready," she said. "I said it was, but it isn't."

The organiser waited. Theo opened the toolbox and placed a screwdriver on the table, within her reach. He did not say anything.

Sana turned the sign face down. "Can we have ten minutes?" She moved her chair so there was space beside her, then pushed the lantern between them. The rain kept striking the windows. Outside, people were hurrying towards the hall; inside, she and Theo bent over the same small pool of light.`,
    q1: {
      range: { start: 'Sana reached the community hall', end: 'underneath the table without answering.' },
      focus: 'Read from the beginning to "underneath the table without answering."',
    },
    q2: {
      range: { start: 'From the front, the city looked magnificent.', end: 'like something trying to escape.' },
      focus: 'Use the paragraph from "From the front, the city looked magnificent." to "like something trying to escape."\nHow does the writer use language to contrast the model’s impressive appearance with its weakness?',
    },
    q3: {
      focus: 'Read the whole extract, the opening of an original short story.\nHow has the writer organised it to show Sana’s confidence turning into doubt? You could consider contrasts, turning points and the focus of the ending.',
    },
    q4: {
      range: { start: 'For a moment Sana thought', end: 'bent over the same small pool of light.' },
      statement: '"Sana begins to take responsibility instead of protecting her pride."',
      focus: 'Use only the later part, from "For a moment Sana thought" to the end.\nTo what extent do you agree? Evaluate Sana’s response and how the writer presents it, supporting your judgement with evidence from this part.',
    },
    q5a: 'For a school creative-writing magazine, describe a town or city during a storm. Use your imagination; you may use the picture for ideas.',
    q5b: 'For the same magazine, write the opening of a story in which a carefully prepared plan goes wrong. Build the character’s expectations before the first setback.',
    q5Image: {
      file: 'Thunderstorm Over the City.jpg',
      alt: 'Lightning above city rooftops under dark storm clouds.',
      credit: 'Wikimedia Commons',
    },
  }),
];
