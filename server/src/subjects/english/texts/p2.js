/**
 * Paper 2 (8700/2) texts: Writers' Viewpoints and Perspectives.
 * Each pair = Source A (19th century, public domain, abridged) +
 * Source B (21st century, original text written for practice in the style
 * of modern AQA sources). Questions model the real exam:
 * Q1 true/false (4m) · Q2 summary (8m) · Q3 language (12m) ·
 * Q4 compare viewpoints (16m) · Q5 writing to argue/persuade (40m).
 */
export const P2_PAIRS = [
  {
    id: 'p2-schools',
    theme: 'Education and how we learn',
    sourceA: {
      title: 'Hard Times',
      kind: 'Fiction (extract from a novel about education)',
      author: 'Charles Dickens',
      year: '1854',
      century: '19th century',
      source: 'Public domain — abridged',
      gutenberg: 'https://www.gutenberg.org/ebooks/786',
      text: `"NOW, what I want is, Facts. Teach these boys and girls nothing but Facts. Facts alone are wanted in life. Plant nothing else, and root out everything else. You can only form the minds of reasoning animals upon Facts: nothing else will ever be of any service to them. This is the principle on which I bring up my own children, and this is the principle on which I bring up these children. Stick to Facts, sir!"

The scene was a plain, bare, monotonous vault of a school-room, and the speaker's square forefinger emphasized his observations by underscoring every sentence with a line on the schoolmaster's sleeve. The emphasis was helped by the speaker's square wall of a forehead, which had his eyebrows for its base, while his eyes found commodious cellarage in two dark caves, overshadowed by the wall.

The speaker, the schoolmaster, and the third grown person present, all backed a little, and swept with their eyes the inclined plane of little vessels then and there arranged in order, ready to have imperial gallons of facts poured into them until they were full to the brim.

"Girl number twenty," said Mr. Gradgrind, squarely pointing with his square forefinger, "I don't know that girl. Who is that girl?"

"Sissy Jupe, sir," explained number twenty, blushing, standing up, and curtseying.

"Sissy is not a name," said Mr. Gradgrind. "Don't call yourself Sissy. Call yourself Cecilia."

"It's father as calls me Sissy, sir," returned the young girl in a trembling voice, and with another curtsey.`,
    },
    sourceB: {
      title: 'Lessons We Won\u2019t Forget: What Happened When Our School Banned Phones',
      kind: 'Online news feature',
      author: 'J. Okafor (written for this app)',
      year: '2024',
      century: '21st century',
      source: 'Original text written for practice',
      text: `When I first heard that our school was banning phones during lesson time, I laughed — genuinely, out loud, in the middle of registration. The laughter lasted about a week. Then the phones went into a locked pouch at the school gates, and for the first time in years, I had to sit with my own thoughts, and I discovered something awkward: I didn\u2019t know how to do it any more.

Everyone predicted chaos. Instead, something odd happened: people\u2019s listening improved. Conversations in the dining hall ran long and got loud in the way they do when nobody is filming them. Girls who had never spoken in form time started arguing about football, exam nerves, and whether pineapple belongs on pizza. I am not saying the world changed. But the air in our building changed.

The teachers tell us it is about concentration, and maybe they are right. My grades drifted up by a couple of marks a test, though I\u2019d never admit that to Mr. Davies. But the honest truth is that I have started keeping a notebook, a real paper one, and writing things in it that nobody will ever like.

There are still days when my pocket feels too light and too empty. But when the bell goes now, my friends and I walk through the gates collecting our phones like pilots collecting passports, and we complain about it loudly, and then we keep talking all the way home. The phones have not gone anywhere. We have simply remembered that the world is bigger than the size of a screen.`,
    },
    q1: {
      statements: [
        { t: 'Mr. Gradgrind believes children should be taught nothing but Facts.', a: true },
        { t: 'Sissy Jupe calls herself Cecilia because she prefers the name.', a: false },
        { t: 'In his school, Mr. Gradgrind\u2019s ideas are applied to his own children and to the pupils.', a: true },
        { t: 'The writer of Source B was in favour of the phone ban from the very first day.', a: false },
        { t: 'In Source B, the phones are locked in a pouch at the school gates.', a: true },
        { t: 'The writer of Source B says conversations in the dining hall became quieter.', a: false },
        { t: 'The pupils in Source B collect their phones again as they leave.', a: true },
        { t: 'The writer of Source B has given up writing in a paper notebook.', a: false },
      ],
    },
    q2: {
      focus: 'You need to refer to Source A and Source B for this question.\nThe two writers give different impressions of schools and how children should learn.\nUse details from both sources to write a summary of what you understand about the differences between the two schools.',
    },
    q3: {
      focus: 'Refer only to Source B, "Lessons We Won\u2019t Forget..."\nHow does the writer use language to describe the effects of the phone ban?',
    },
    q4: {
      focus: 'Compare how the writers convey their different viewpoints on education and how children should be treated.\nIn your answer, you could:\n• compare their different viewpoints on education\n• compare the methods they use to convey their viewpoints\n• support your response with references to both texts.',
    },
    q5: {
      prompt: '\u201cMobile phones do more harm than good in schools.\u201d\nWrite an article for your school magazine in which you argue for or against this statement.',
    },
    skills: ['listing', 'summarising', 'language', 'comparing', 'argument-writing'],
  },
  {
    id: 'p2-weather',
    theme: 'Weather, city life and the environment',
    sourceA: {
      title: 'Bleak House',
      kind: 'Fiction (fog and weather in London)',
      author: 'Charles Dickens',
      year: '1853',
      century: '19th century',
      source: 'Public domain — abridged',
      gutenberg: 'https://www.gutenberg.org/ebooks/1023',
      text: `Fog everywhere. Fog up the river, where it flows among green aits and meadows; fog down the river, where it rolls defiled among the tiers of shipping and the waterside pollutions of a great (and dirty) city. Fog on the Essex marshes, fog on the Kentish heights. Fog creeping into the cabooses of collier-brigs; fog lying out on the yards and hovering in the rigging of great ships; fog drooping on the gunwales of barges and small boats. Fog in the eyes and throats of ancient Greenwich pensioners, wheezing by the firesides of their wards; fog in the stem and bowl of the afternoon pipe of the wrathful skipper, down in his close cabin; fog cruelly pinching the toes and fingers of his shivering little \u2019prentice boy on deck. Chance people on the bridges peeping over the parapets into a nether sky of fog, with fog all round them, as if they were up in a balloon and hanging in the misty clouds.

Gas looming through the fog in divers places in the streets, much as the sun may, from the spongy fields, be seen to loom by husbandman and ploughboy. Smoke lowering down from chimney-pots, making a soft black drizzle, with flakes of soot in it as big as full-grown snow-flakes — gone into mourning, one might imagine, for the death of the sun.

Dogs, undistinguishable in mire. Horses, scarcely better; splashed to their very blinkers. Foot passengers, jostling one another\u2019s umbrellas in a general infection of ill-temper, and losing their foot-hold at street-corners, where tens of thousands of other foot passengers have been slipping and sliding since the day broke.`,
    },
    sourceB: {
      title: 'Forty Degrees: A Week We Will All Remember',
      kind: 'Online opinion article',
      author: 'L. Hart (written for this app)',
      year: '2024',
      century: '21st century',
      source: 'Original text written for practice',
      text: `On the hottest day of the year, my street went quiet. Not the comfortable quiet of a Sunday morning, but the strange, tight silence of a street holding its breath. The tarmac at the kerb had gone soft; my trainers left damp prints in it like footprints on a beach. Inside, the curtains stayed shut like eyelids, and the fan churned the same warm air around and around, pretending to be helpful.

In the afternoon I walked to the shop for ice, and the heat was a physical thing, a hand pressing on the back of my neck. An old man sat on a plastic chair in the shade of a bus shelter, holding a damp newspaper to his face like a flannel. "Thirty-nine, they say," he said, as if the nine mattered more than anything had in years. It did, somehow.

That night nobody could sleep. You could hear it: windows open, radios low, a baby crying at midnight, and an aeroplane dragging its lonely noise from one end of the sky to the other, the same sky the whole city had been staring at all day.

Here is the uncomfortable part, though. We spent a week complaining about the heat, and my family still drove two separate cars to the same supermarket, six minutes apart. A heatwave is a loud event — it interrupts us. Climate change is quiet. It does not shout; it simply turns the dial, one notch per summer, until the unbelievable becomes Wednesday. If a week of forty degrees cannot change how we behave, what can?`,
    },
    q1: {
      statements: [
        { t: 'In Source A, fog covers the river, the marshes and the Kentish heights.', a: true },
        { t: 'In Source A, the horses are clean and clearly visible.', a: false },
        { t: 'In Source B, the tarmac was so soft it showed the writer\u2019s footprints.', a: true },
        { t: 'In Source B, the writer\u2019s family cycled to the supermarket together.', a: false },
        { t: 'The old man in Source B described the temperature as "thirty-nine".', a: true },
        { t: 'In Source B, the street was loud and busy on the hottest day.', a: false },
        { t: 'In Source A, people lost their footing at street corners.', a: true },
        { t: 'The writer of Source B thinks climate change is a loud event that shouts.', a: false },
      ],
    },
    q2: {
      focus: 'You need to refer to Source A and Source B for this question.\nThe two writers both describe extreme weather in a city.\nUse details from both sources to write a summary of what you understand about the differences between the two experiences.',
    },
    q3: {
      focus: 'Refer only to Source B, "Forty Degrees: A Week We Will All Remember".\nHow does the writer use language to describe the heat and its effect on people?',
    },
    q4: {
      focus: 'Compare how the writers convey their different viewpoints and feelings about weather in the city.\nIn your answer, you could:\n• compare their different viewpoints on the weather\n• compare the methods they use to convey their viewpoints\n• support your response with references to both texts.',
    },
    q5: {
      prompt: '\u201cIndividual choices make no real difference to the climate crisis.\u201d\nWrite a speech for a school assembly in which you argue for or against this statement.',
    },
    skills: ['listing', 'summarising', 'language', 'comparing', 'argument-writing'],
  },
  {
    id: 'p2-city',
    theme: 'Town and country life',
    sourceA: {
      title: 'North and South',
      kind: 'Fiction (industrial city of Milton-Northern)',
      author: 'Elizabeth Gaskell',
      year: '1855',
      century: '19th century',
      source: 'Public domain — abridged',
      gutenberg: 'https://www.gutenberg.org/ebooks/4276',
      text: `For several miles before they reached Milton, they saw a deep lead-coloured cloud hanging over the horizon in the direction in which it lay. It was all the darker from contrast with the pale grey-blue of the wintry sky; for in Heston there had been the earliest signs of frost. Here and there a dark chimney, scattered like needles upon a brown, stubbly plain, sent up its thin puff of smoke; but the cloud hung thick and heavy over the city itself.

Nearer to the town, the air had a faint taste and smell of smoke; perhaps, after all, more a loss of the fragrance of grass and herbage than anything else. Every van, every waggon and truck, bore cotton, either in the raw shape of great, heavy bales, or in the perfect form of new-made cloth. The streets were long and straight, the houses small, uniform, and unpicturesque; streets and houses built so precisely alike that you could lose yourself in the town and never find your way again.

They were within the narrow, crowded streetways of the great city, where everything seemed monotonous and fixed; a pitiless wind whipped the cold dust in their faces, and out of the factory windows the never-ending rattle of the looms came tapping and hammering and clashing through the dirty air. The people who passed had the same look: quick, sharp, and unaccustomed to rest — men with hollow cheeks and unpaid rest behind their eyes, women with shawls pulled tight about them, and children running barefoot through the noise as if it were the only music they knew.`,
    },
    sourceB: {
      title: 'Why I Left the City for a Village of Forty-Three People',
      kind: 'Online blog post',
      author: 'M. Whitfield (written for this app)',
      year: '2024',
      century: '21st century',
      source: 'Original text written for practice',
      text: `The leaving was easy, because I never really arrived. For six years I lived in a city of nine million people and I knew eleven of them by name: five colleagues, four flatmates, a barista called Grace, and a man in my building whose name I only learned because it was printed on his post. I was not lonely — that is the strange part. The city was full of company. What I was, was exhausted; tired in a way that no weekend fixed, from the noise, the rent, the escalators that moved slower than my own legs, and the particular flavour of despair you only taste at 11:40pm on a bus that has not moved for twenty minutes.

The village has forty-three people, two roads, a shop that closes at noon for reasons nobody can explain, and a silence at night so complete that at first I could hear my own blinking.

People warned me I would be bored. They were half right. On Tuesday nights the most exciting event in the village is the arrival of the mobile library, which is a van containing a retired teacher named Frank and several thousand books that smell of every kitchen they have ever visited. I am embarrassed to admit that I queue at half past six.

I am not pretending the country is magic. The internet is terrible and the nearest hospital is forty minutes away. But here is the difference: here, I sleep. And in the mornings the light comes down the valley like a poured drink, slow and golden, and — perhaps for the first time in my life — I have time to watch it.`,
    },
    q1: {
      statements: [
        { t: 'In Source A, a deep lead-coloured cloud hung over Milton.', a: true },
        { t: 'In Source A, the streets of Milton were ornate and picturesque.', a: false },
        { t: 'The writer of Source B lived in a city of nine million people for six years.', a: true },
        { t: 'The writer of Source B knew hundreds of people by name in the city.', a: false },
        { t: 'The village shop in Source B closes at noon.', a: true },
        { t: 'The mobile library van in Source B is driven by a retired teacher called Frank.', a: true },
        { t: 'In Source A, the workers in the streets looked relaxed and rested.', a: false },
        { t: 'The writer of Source B found the silence of the village easy from the first night.', a: false },
      ],
    },
    q2: {
      focus: 'You need to refer to Source A and Source B for this question.\nThe two writers describe very different places to live.\nUse details from both sources to write a summary of what you understand about the differences between city life and village life.',
    },
    q3: {
      focus: 'Refer only to Source B, "Why I Left the City for a Village of Forty-Three People".\nHow does the writer use language to describe her former life in the city?',
    },
    q4: {
      focus: 'Compare how the writers convey their different viewpoints on city life.\nIn your answer, you could:\n• compare their different viewpoints on the city\n• compare the methods they use to convey their viewpoints\n• support your response with references to both texts.',
    },
    q5: {
      prompt: '\u201cLiving in a big city is bad for your health and happiness.\u201d\nWrite a letter to a friend in which you argue for or against this statement, using your own experiences.',
    },
    skills: ['listing', 'summarising', 'language', 'comparing', 'argument-writing'],
  },
  {
    id: 'p2-work',
    theme: 'Work, poverty and how we live',
    sourceA: {
      title: 'Oliver Twist',
      kind: 'Fiction (workhouse life)',
      author: 'Charles Dickens',
      year: '1838',
      century: '19th century',
      source: 'Public domain — abridged',
      gutenberg: 'https://www.gutenberg.org/ebooks/730',
      text: `The room in which the boys were fed, was a large stone hall, with a copper at one end: out of which the master, dressed in an apron for the occasion, and assisted by one or two women, ladled the gruel at meal-times. Of this festive composition each boy had one porringer, and no more — except on occasions of great public rejoicing, when he had two ounces and a quarter of bread besides. The bowls never wanted washing. The boys polished them with their spoons till they shone again; and when they had performed this operation (which never took very long, the spoons being nearly as large as the bowls), they would sit staring at the copper, with such eager eyes, as if they could have devoured the very bricks of which it was composed.

Child as he was, he was desperate with hunger, and reckless with misery. He rose from the table; and advancing to the master, basin and spoon in hand, said: somewhat alarmed at his own temerity:

"Please, sir, I want some more."

The master was a fat, healthy man; but he turned very pale. He gazed in stupified astonishment on the small rebel for some seconds, and then clung for support to the copper. The assistants were paralysed with wonder; the boys with fear.

"For MORE!" said Mr. Limbkins. "Compose yourself, Mr. Bumble, and answer me distinctly. Do I understand that he asked for more, after he had eaten the supper allotted by the dietary?"

"He did, sir," replied Bumble.

"That boy will be hung," said the gentleman in the white waistcoat. "I know that boy will be hung."

Nobody in the room doubted it.`,
    },
    sourceB: {
      title: 'Six Pounds: A Week Living on the Minimum Wage',
      kind: 'First-person newspaper feature',
      author: 'R. Adeyemi (written for this app)',
      year: '2024',
      century: '21st century',
      source: 'Original text written for practice',
      text: `By Thursday, I had become an expert in one thing only: mental arithmetic. Toast costs eleven pence a slice. The bus my agency sent me on costs more than I earned in the first forty minutes of my shift. A tin of tomatoes, a bag of pasta, and a bar of the cheap chocolate that tastes mainly of good intentions: £2.14. I ran these sums the way other people scroll their phones, on a loop, quietly, at the back of my skull.

The job itself was fine. I packed boxes. The people were kind. It is not poverty of the kind you see in black-and-white films — nobody asked for "more", and nobody was refused. But there is a modern version of that same bowl: it is the heating bill you will not open, the dentist you will not call, the flat that has no table because a table, however cheap, is a decision about what matters, and you cannot afford to get that decision wrong.

The strangest discovery of the week, though, was how the world organises itself around the assumption that you are not poor. The supermarket is full of 3-for-2 offers that save money only if you have it to spend. The mobile library of any high street — the phone — demands insurance, and the insurance demands a bank account, and the account demands an address, and the address demands a deposit.

We like to tell stories about pulling ourselves up by our bootstraps. It is a good phrase. It is also, I discovered, physically impossible: you cannot lift yourself by your own boots. Somebody, somewhere, always has to reach down a hand.`,
    },
    q1: {
      statements: [
        { t: 'In Source A, each boy receives one bowl of gruel and usually nothing more.', a: true },
        { t: 'In Source A, the master of the workhouse is thin and weak.', a: false },
        { t: 'Oliver asks for more food because he is desperate with hunger.', a: true },
        { t: 'In Source B, the writer works stacking shelves in a supermarket.', a: false },
        { t: 'In Source B, the writer earns more from his first forty minutes of work than his bus fare costs.', a: false },
        { t: 'In Source B, the writer describes poverty as something from black-and-white films.', a: false },
        { t: 'In Source B, the writer says the flat has no table.', a: true },
        { t: 'The writer of Source B thinks anyone can pull themselves up entirely by themselves.', a: false },
      ],
    },
    q2: {
      focus: 'You need to refer to Source A and Source B for this question.\nThe two writers both write about poverty and survival.\nUse details from both sources to write a summary of what you understand about the differences between the two experiences of hardship.',
    },
    q3: {
      focus: 'Refer only to Source B, "Six Pounds: A Week Living on the Minimum Wage".\nHow does the writer use language to make the experience of living on the minimum wage memorable and moving?',
    },
    q4: {
      focus: 'Compare how the writers convey their different viewpoints on poverty.\nIn your answer, you could:\n• compare their different viewpoints on the people in their texts\n• compare the methods they use to convey their viewpoints\n• support your response with references to both texts.',
    },
    q5: {
      prompt: '\u201cWork should pay enough for everyone to live on, and if it does not, society has failed.\u201d\nWrite an article for a national newspaper in which you argue for or against this statement.',
    },
    skills: ['listing', 'summarising', 'language', 'comparing', 'argument-writing'],
  },
];