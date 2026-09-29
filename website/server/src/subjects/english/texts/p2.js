/**
 * Paper 2 (8700/2) texts: Writers' Viewpoints and Perspectives.
 * Each pair combines a public-domain 19th-century non-fiction extract and
 * original 21st-century non-fiction written for practice. Either may be
 * Source A. Q1 uses Source A only; Q3 uses Source B only.
 * Q1 choose four true statements (4m) · Q2 summary (8m) · Q3 language (12m) ·
 * Q4 compare viewpoints (16m) · Q5 writing to argue/persuade (40m).
 */
const BASE_PAIRS = [
  {
    id: 'p2-schools',
    theme: 'Education and how we learn',
    sourceA: {
      title: 'Autobiography',
      kind: 'Literary non-fiction (account of the writer’s childhood education)',
      author: 'John Stuart Mill',
      year: '1873',
      century: '19th century',
      source: 'Public domain — abridged',
      gutenberg: 'https://www.gutenberg.org/ebooks/10378',
      text: `There was one cardinal point in this training, of which I have already given some indication, and which, more than anything else, was the cause of whatever good it effected. Most boys or youths who have had much knowledge drilled into them, have their mental capacities not strengthened, but overlaid by it. They are crammed with mere facts, and with the opinions or phrases of other people, and these are accepted as a substitute for the power to form opinions of their own; and thus the sons of eminent fathers, who have spared no pains in their education, so often grow up mere parroters of what they have learnt, incapable of using their minds except in the furrows traced for them.

Mine, however, was not an education of cram. My father never permitted anything which I learnt to degenerate into a mere exercise of memory. He strove to make the understanding not only go along with every step of the teaching, but, if possible, precede it. Anything which could be found out by thinking I never was told, until I had exhausted my efforts to find it out for myself. As far as I can trust my remembrance, I acquitted myself very lamely in this department; my recollection of such matters is almost wholly of failures, hardly ever of success. It is true the failures were often in things in which success, in so early a stage of my progress, was almost impossible.

I remember at some time in my thirteenth year, on my happening to use the word idea, he asked me what an idea was; and expressed some displeasure at my ineffectual efforts to define the word: I recollect also his indignation at my using the common expression that something was true in theory but required correction in practice; and how, after making me vainly strive to define the word theory, he explained its meaning, and showed the fallacy of the vulgar form of speech which I had used; leaving me fully persuaded that in being unable to give a correct definition of Theory, and in speaking of it as something which might be at variance with practice, I had shown unparalleled ignorance. In this he seems, and perhaps was, very unreasonable; but I think, only in being angry at my failure. A pupil from whom nothing is ever demanded which he cannot do, never does all he can.`,
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
      source: 'A',
      statements: [
        { t: 'Mill says that drilling boys with knowledge often weakens rather than strengthens their thinking.', a: true },
        { t: 'Mill says pupils always form their own opinions when they are taught many facts.', a: false },
        { t: 'Mill’s father allowed him to rely on memory instead of understanding.', a: false },
        { t: 'Mill’s father wanted him to try to work things out before being told the answer.', a: true },
        { t: 'Mill remembers succeeding at most of the tasks that required independent thought.', a: false },
        { t: 'When Mill was about thirteen, his father asked him to define the word “idea”.', a: true },
        { t: 'Mill says his father immediately explained the meaning of “theory” without asking him to try.', a: false },
        { t: 'Mill thinks that pupils can achieve more when they are sometimes asked to do difficult things.', a: true },
      ],
    },
    q2: {
      focus: 'You need to refer to Source A and Source B for this question.\nThe two writers describe different experiences of learning.\nUse details from both sources to write a summary of what you understand about the differences between these experiences.',
    },
    q3: {
      focus: 'Refer only to Source B, "Lessons We Won\u2019t Forget..."\nHow does the writer use language to describe the effects of the phone ban?',
    },
    q4: {
      focus: 'Compare how the writers convey their viewpoints on what helps young people learn.\nIn your answer, you could:\n• compare their different viewpoints on learning\n• compare the methods they use to convey their viewpoints\n• support your response with references to both texts.',
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
      title: 'Saunterings in and about London',
      kind: 'Literary non-fiction (travel account of London weather)',
      author: 'Max Schlesinger (translated by Otto Wenckstern)',
      year: '1853',
      century: '19th century',
      source: 'Public domain — excerpt from the 1853 English translation',
      gutenberg: 'https://www.gutenberg.org/ebooks/46571',
      text: `But whatever ill-natured remarks we and others may make on the London sun, they apply only to the winter months. May and September shame us into silence. In those months, the sun in London is as lovely, genial, and—I must go the length of a trope—sunny as anywhere in Germany; with this difference only, that it is not so glowing—not so consistent. In the country, too, it comes out in full, broad, and traditional glory. Its favourite spots are in the South of England—Bristol, Bath, Hastings, and the Isle of Wight. In those favored regions, the mild breeze of summer blows even late in the year; the hedges and trees stand resplendent with the freshness of their foliage; the meadows are green, and lovely to behold; the butterflies hover over the blossoms of the honeysuckle; the cedar from Lebanon grows there and thrives, and myrtles and fuchsias, Hortensias and roses, and passion-flowers, surround the charming villas on the sea-shore. Village churches are covered with ivy up to the very roof; gigantic fern moves in the sea-breeze; the birds sing in the branches of the wild laurel tree; cattle and sheep graze on the downs; and grown-up persons and children bathe in the open sea, while the German rivers are sending down their first shoals of ice, and dense fogs welter in the streets of London.

Here is one of the vulgar errors and popular delusions of the Continent. People confound the climate of London with the climate of England; they talk of the isles of mist in the West of Europe. A very poetical idea that, but as untrue as poetical. Many parts of these islands are as clear and sunny as any of the inland countries of the Continent.

The winter-fogs of London are, indeed, awful. They surpass all imagining; he who never saw them, can form no idea of what they are. He who knows how powerfully they affect the minds and tempers of men, can understand the prevalence of that national disease—the spleen. In a fog, the air is hardly fit for breathing; it is grey-yellow, of a deep orange, and even black; at the same time, it is moist, thick, full of bad smells, and choking. The fog appears, now and then, slowly, like a melodramatic ghost, and sometimes it sweeps over the town as the simoom over the desert. At times, it is spread with equal density over the whole of that ocean of houses on other occasions, it meets with some invisible obstacle, and rolls itself into intensely dense masses, from which the passengers come forth in the manner of the student who came out of the cloud to astonish Dr. Faust. It is hardly necessary to mention, that the fog is worst in those parts of the town which are near the Thames.`,
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
      source: 'A',
      statements: [
        { t: 'Schlesinger says the London sun is never pleasant, even in May and September.', a: false },
        { t: 'Schlesinger says a mild summer breeze can continue late in the year in southern England.', a: true },
        { t: 'Schlesinger says the climate of London is typical of all of England.', a: false },
        { t: 'Schlesinger says many parts of Britain are as sunny as inland places on the Continent.', a: true },
        { t: 'Schlesinger describes the air in a London winter fog as easy to breathe.', a: false },
        { t: 'Schlesinger says fog can arrive slowly or sweep over the town.', a: true },
        { t: 'Schlesinger says London fog is worst near the Thames.', a: true },
        { t: 'Schlesinger says fog is always spread evenly across the whole city.', a: false },
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
      title: 'The Condition of the Working-Class in England in 1844',
      kind: 'Non-fiction (first-hand social account of London)',
      author: 'Friedrich Engels (translated by Florence Kelley)',
      year: '1892',
      century: '19th century',
      source: 'Public domain — excerpt from the 1892 English translation; original published 1845',
      gutenberg: 'https://www.gutenberg.org/ebooks/17306',
      text: `A town, such as London, where a man may wander for hours together without reaching the beginning of the end, without meeting the slightest hint which could lead to the inference that there is open country within reach, is a strange thing. This colossal centralisation, this heaping together of two and a half millions of human beings at one point, has multiplied the power of this two and a half millions a hundredfold; has raised London to the commercial capital of the world, created the giant docks and assembled the thousand vessels that continually cover the Thames. I know nothing more imposing than the view which the Thames offers during the ascent from the sea to London Bridge. The masses of buildings, the wharves on both sides, especially from Woolwich upwards, the countless ships along both shores, crowding ever closer and closer together, until, at last, only a narrow passage remains in the middle of the river, a passage through which hundreds of steamers shoot by one another; all this is so vast, so impressive, that a man cannot collect himself, but is lost in the marvel of England's greatness before he sets foot upon English soil.

But the sacrifices which all this has cost become apparent later. After roaming the streets of the capital a day or two, making headway with difficulty through the human turmoil and the endless lines of vehicles, after visiting the slums of the metropolis, one realises for the first time that these Londoners have been forced to sacrifice the best qualities of their human nature, to bring to pass all the marvels of civilisation which crowd their city; that a hundred powers which slumbered within them have remained inactive, have been suppressed in order that a few might be developed more fully and multiply through union with those of others. The very turmoil of the streets has something repulsive, something against which human nature rebels. The hundreds of thousands of all classes and ranks crowding past each other, are they not all human beings with the same qualities and powers, and with the same interest in being happy? And have they not, in the end, to seek happiness in the same way, by the same means? And still they crowd by one another as though they had nothing in common, nothing to do with one another, and their only agreement is the tacit one, that each keep to his own side of the pavement, so as not to delay the opposing streams of the crowd, while it occurs to no man to honour another with so much as a glance. The brutal indifference, the unfeeling isolation of each in his private interest becomes the more repellant and offensive, the more these individuals are crowded together, within a limited space. And, however much one may be aware that this isolation of the individual, this narrow self-seeking is the fundamental principle of our society everywhere, it is nowhere so shamelessly barefaced, so self-conscious as just here in the crowding of the great city. The dissolution of mankind into monads, of which each one has a separate principle, the world of atoms, is here carried out to its utmost extreme.`,
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
      source: 'A',
      statements: [
        { t: 'Engels says someone could walk for hours in London without seeing signs of open country.', a: true },
        { t: 'Engels is unimpressed by the view of the Thames on the way into London.', a: false },
        { t: 'Engels describes thousands of vessels on the Thames.', a: true },
        { t: 'Engels says it is difficult to move through the streets because of crowds and vehicles.', a: true },
        { t: 'Engels notices the human cost of the city before walking through its streets.', a: false },
        { t: 'Engels says people in the crowds stop to greet one another.', a: false },
        { t: 'Engels says isolation becomes less noticeable as the crowds grow denser.', a: false },
        { t: 'Engels says the people passing one another share an interest in being happy.', a: true },
      ],
    },
    q2: {
      focus: 'You need to refer to Source A and Source B for this question.\nThe two writers describe very different places to live.\nUse details from both sources to write a summary of what you understand about the differences between city life and village life.',
    },
    q3: {
      focus: 'Refer only to Source B, "Why I Left the City for a Village of Forty-Three People".\nHow does the writer use language to describe her former life in the city?',
    },
    q4: {
      focus: 'Compare how the writers convey their viewpoints on life in a big city.\nIn your answer, you could:\n• compare their viewpoints on the city\n• compare the methods they use to convey their viewpoints\n• support your response with references to both texts.',
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
      title: 'London Labour and the London Poor',
      kind: 'Non-fiction (reported interview with a London street seller)',
      author: 'Henry Mayhew',
      year: '1851',
      century: '19th century',
      source: 'Public domain — abridged',
      gutenberg: 'https://www.gutenberg.org/ebooks/55998',
      text: `[Mayhew interviews a London street seller of cutlery about a week's earnings.]

“Now, just to show you what I done last week. Sunday, I laid a-bed all day and had no dinner. Monday, I went out in the morning without a morsel between my lips, and with only 8½d. for stock-money; with that I bought a knife and sold it for a shilling, and then I got another and another after that, and that was my day’s work—three times 3½d. or 10½d. in all, to keep the two of us. Tuesday, I sold a pair of small scissors and two little pearl-handled knives, at 6d. each article, and cleared 10½d. on the whole, and that is all I did. Wednesday, I sold a razor-strop for 6d., a four-bladed knife for a shilling, and a small hone for 6d.; by these I cleared 10d. altogether. Thursday, I sold a pair of razors for a shilling, clearing by the whole 11½d. Friday, I got rid of a pair of razors for 1s. 9d., and got 9d. clear.”

I added up the week’s profits and found they amounted to 4s. 3½d. “That’s about right,” said the man, “out of that I shall have to pay 1s. for my week’s rent; we’ve got a kitchen, so that I leave you to judge how we two can live out of what’s remaining.” I told him it would’nt average quite 6d. a day. “That’s about it,” he replied, “we have half a loaf of bread a day, and that thank God is only five farthings now. This lasts us the day, with two-penny-worth of bits of meat that my old woman buys at a ham-shop, where they pare the hams and puts the parings by on plates to sell to poor people; and when she can’t get that, she buys half a sheep’s head, one that’s three or four days old, for then they sells ’em to the poor for 1½d. the half; and these with ¾d. worth of tea, and ½d. worth of sugar, ¼d. for a candle, 1d. of coal—that’s seven pounds—and ¾d. worth of coke—that’s half a peck—makes up all we gets.” These items amount to 6½d. in all. “That’s how we do when we can get it, and when we can’t, why we lays in bed and goes without altogether.”`,
    },
    sourceB: {
      title: 'Counting Every Penny: A Week on Low Pay',
      kind: 'First-person newspaper feature',
      author: 'R. Adeyemi (written for this app)',
      year: '2024',
      century: '21st century',
      source: 'Original text written for practice',
      text: `By Thursday, I had become an expert in one thing only: mental arithmetic. Toast costs eleven pence a slice. The bus my agency sent me on costs more than I earned in the first forty minutes of my shift. A tin of tomatoes, a bag of pasta, and a bar of the cheap chocolate that tastes mainly of good intentions: £2.14. I ran these sums the way other people scroll their phones, on a loop, quietly, at the back of my skull.

The job itself was fine. I packed boxes. The people were kind. There was no single dramatic moment when a supervisor told me to go without. The harder part was quieter: the heating bill I would not open, the dentist I would not call, the flat that had no table because a table, however cheap, was a decision about what mattered, and I could not afford to get that decision wrong.

The strangest discovery of the week, though, was how the world organises itself around the assumption that you are not poor. The supermarket is full of 3-for-2 offers that save money only if you have it to spend. The mobile library of any high street — the phone — demands insurance, and the insurance demands a bank account, and the account demands an address, and the address demands a deposit.

We like to tell stories about pulling ourselves up by our bootstraps. It is a good phrase. It is also, I discovered, physically impossible: you cannot lift yourself by your own boots. Somebody, somewhere, always has to reach down a hand.`,
    },
    q1: {
      source: 'A',
      statements: [
        { t: 'The street seller says he spent Sunday in bed without dinner.', a: true },
        { t: 'On Monday, the seller had more than a shilling to buy his stock.', a: false },
        { t: 'The seller says he cleared 10½d. on Tuesday.', a: true },
        { t: 'Mayhew calculates that the seller made 4s. 3½d. profit that week.', a: true },
        { t: 'The seller says his weekly rent is greater than his weekly profit.', a: false },
        { t: 'Mayhew says the remaining money provides more than a shilling a day.', a: false },
        { t: 'The seller says he and his wife share half a loaf of bread a day.', a: true },
        { t: 'The seller says he and his wife always have enough to eat.', a: false },
      ],
    },
    q2: {
      focus: 'You need to refer to Source A and Source B for this question.\nThe two writers both write about poverty and survival.\nUse details from both sources to write a summary of what you understand about the differences between the two experiences of hardship.',
    },
    q3: {
      focus: 'Refer only to Source B, "Counting Every Penny: A Week on Low Pay".\nHow does the writer use language to make the experience of living on low pay memorable and moving?',
    },
    q4: {
      focus: 'Compare how the writers convey their viewpoints on living with too little money.\nIn your answer, you could:\n• compare their viewpoints on the people in their texts\n• compare the methods they use to convey their viewpoints\n• support your response with references to both texts.',
    },
    q5: {
      prompt: '\u201cWork should pay enough for everyone to live on, and if it does not, society has failed.\u201d\nWrite an article for a national newspaper in which you argue for or against this statement.',
    },
    skills: ['listing', 'summarising', 'language', 'comparing', 'argument-writing'],
  },
];

// The AQA specimen places the modern source first. This variation lets learners
// practise that ordering without duplicating the two full texts.
const cityPair = BASE_PAIRS.find(({ id }) => id === 'p2-city');
export const P2_PAIRS = [
  ...BASE_PAIRS,
  {
    ...cityPair,
    id: 'p2-city-modern-first',
    theme: 'Town and country life: modern source first',
    sourceA: cityPair.sourceB,
    sourceB: cityPair.sourceA,
    q1: {
      source: 'A',
      statements: [
        { t: 'The writer lived in the city for six years.', a: true },
        { t: 'The writer knew eleven people by name in the city.', a: true },
        { t: 'The writer learned a neighbour’s name by talking to him.', a: false },
        { t: 'Five of the people the writer knew were colleagues.', a: true },
        { t: 'The writer says the city had no company or other people.', a: false },
        { t: 'The writer says weekends always cured their exhaustion.', a: false },
        { t: 'The writer describes being on a bus that had not moved for twenty minutes.', a: true },
        { t: 'The city where the writer lived had forty-three residents.', a: false },
      ],
    },
    q3: {
      focus: 'Refer only to Source B, an extract from "The Condition of the Working-Class in England in 1844".\nHow does Engels use language to convey the isolation of people in a crowded city?',
    },
  },
];
