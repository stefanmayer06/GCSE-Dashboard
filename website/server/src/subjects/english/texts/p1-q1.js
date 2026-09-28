// Original Paper 1 Q1 retrieval questions, following AQA's 2026 four-part
// multiple-choice format. Each item has three choices and one correct answer.
// Keep the correct index on the server; clients receive only prompt and choices.
export const P1_Q1_ITEMS = {
  // The fourth field is the supporting source phrase, retained only server-side.
  'p1-last-crossing': [
    ['When does the footbridge close?', ['At six', 'At seven', 'At eight'], 1, 'the footbridge closed at seven'],
    ['What has Nia come to collect?', ['A shopping bag', 'A pair of binoculars', 'A field recorder'], 2, 'collect the field recorder'],
    ['What colour is the man’s jacket?', ['Orange', 'Green', 'Blue'], 0, 'a man in an orange jacket'],
    ['What is the man holding above his head?', ['A key', 'A pair of binoculars', 'A camera'], 1, 'He held a pair of binoculars above his head.'],
  ],
  'p1-signal-on-the-moor': [
    ['Where have Leena and Owen planned to walk?', ['To the weather station', 'To a village shop', 'To the top of a tower'], 0, 'up to the weather station and back before lunch'],
    ['Who carries the old camera?', ['Their dad', 'Leena', 'Owen'], 2, 'Owen carried their dad\'s old camera'],
    ['What does Leena carry?', ['A toolbox', 'A map', 'A memory card'], 1, 'She carried the map.'],
    ['How many lights flash on the box?', ['One', 'Two', 'Three'], 2, 'Three lights flashed along its side'],
  ],
  'p1-the-spare-room': [
    ['When does Asha arrive at the hotel?', ['At nine twenty', 'At nine forty', 'At ten twenty'], 0, 'Asha arrived at the hotel at nine twenty'],
    ['What number is on her key?', ['Six', 'Eight', 'Ten'], 1, 'a brass key with the number eight on it'],
    ['What instrument does Asha carry?', ['A flute', 'A guitar', 'A violin'], 2, 'carried her borrowed violin up the stairs'],
    ['What has her dad packed for her?', ['A cheese sandwich', 'An apple', 'A packet of biscuits'], 0, 'Her dad had packed a cheese sandwich'],
  ],
  'p1-captain-for-a-morning': [
    ['When is Hari waiting at the harbour?', ['At seven', 'At eight', 'At nine'], 1, 'at eight o\'clock'],
    ['What has his aunt insisted he bring?', ['A flask', 'A woollen hat', 'A life jacket'], 2, 'the life jacket his aunt had insisted he bring'],
    ['Where is Captain Mags taking the boat?', ['To the next harbour', 'To an island', 'Back to its owner’s house'], 0, 'deliver it to the next harbour'],
    ['What kind of biscuits does Mags bring?', ['Chocolate', 'Ginger', 'Shortbread'], 1, 'a packet of ginger biscuits'],
  ],
  'p1-the-road-home': [
    ['Where does Milo get off the bus?', ['At the correct stop', 'One stop too late', 'One stop too early'], 2, 'Milo got off the bus one stop too early.'],
    ['How much battery does his phone show?', ['One per cent', 'Ten per cent', 'Twenty per cent'], 0, 'the screen of his phone showed one per cent'],
    ['Where is his grandad’s address written?', ['On a map', 'On a postcard', 'On a bus ticket'], 1, 'a postcard from his grandad, with the address written'],
    ['What colour gate should Milo look for?', ['Green', 'Blue', 'Yellow'], 2, 'The driver had told him to look for a yellow gate.'],
  ],
  'p1-the-test-run': [
    ['When does Sana reach the hall?', ['At six', 'At half past six', 'At seven'], 0, 'Sana reached the community hall at six o\'clock'],
    ['What does she carry the model in?', ['A wooden box', 'A cardboard tray', 'A shopping bag'], 1, 'carrying the model city in a cardboard tray'],
    ['What does Theo bring?', ['A lantern', 'A sign', 'A toolbox'], 2, 'Her brother Theo followed with a toolbox.'],
    ['Where is Sana’s table?', ['Nearest the stage', 'Beside the doors', 'Under the windows'], 0, 'the table nearest the stage'],
  ],
  // Archived classic passages still need their original choices for saved sessions.
  'p1-great-expectations': [
    ['What is on the stranger’s leg?', ['A rope', 'A great iron', 'A bandage'], 1],
    ['What does the stranger wear on his head?', ['A wide hat', 'A cloth cap', 'An old rag'], 2],
    ['How does the stranger move?', ['He limps', 'He runs', 'He crawls'], 0],
    ['What does the stranger seize?', ['Pip’s arm', 'Pip’s chin', 'Pip’s coat'], 1],
  ],
  'p1-war-of-the-worlds': [
    ['What was watching the world?', ['Creatures from the sea', 'Greater intelligences', 'People with microscopes'], 1],
    ['How did people go about their affairs?', ['With infinite complacency', 'With growing fear', 'With careful suspicion'], 0],
    ['How are the minds across space described?', ['Warm and sympathetic', 'Small and confused', 'Vast and cool'], 2],
    ['How did those minds view Earth?', ['With envious eyes', 'With indifference', 'With relief'], 0],
  ],
  'p1-jane-eyre': [
    ['Why was another walk out of the question?', ['Jane had lost her shoes', 'The wind and rain had arrived', 'Mrs Reed had forbidden it'], 1],
    ['How did Jane feel about long walks?', ['She never liked them', 'She looked forward to them', 'She found them easy'], 0],
    ['Who had been chiding Jane?', ['Georgiana', 'Mrs Reed', 'Bessie the nurse'], 2],
    ['How did Jane compare herself with the Reed children?', ['She felt physically inferior', 'She felt much older', 'She felt stronger'], 0],
  ],
  'p1-treasure-island': [
    ['What followed the man to the inn?', ['A horse', 'His sea-chest', 'A fishing boat'], 1],
    ['What mark did the man have on his cheek?', ['A sabre cut', 'A burn', 'A tattoo'], 0],
    ['How did his singing voice sound?', ['Clear and youthful', 'Soft and musical', 'High and old'], 2],
    ['What did he call for when the father appeared?', ['A glass of rum', 'A bowl of soup', 'A room for the night'], 0],
  ],
  'p1-dracula': [
    ['How had the narrator slept?', ['Very well', 'Not well', 'Not at all'], 1],
    ['Where were they in the morning?', ['At the edge of the Borgo Pass', 'At a ruined castle', 'Beside the sea'], 0],
    ['What was the driver doing beside the carriage?', ['Lighting a fire', 'Reading a map', 'Adjusting the horses’ bridles'], 2],
    ['How did the weather change as evening fell?', ['It became very cold', 'It became warmer', 'It began to snow'], 0],
  ],
  'p1-frankenstein': [
    ['In which month did the moment of creation take place?', ['October', 'November', 'December'], 1],
    ['What time was it?', ['One in the morning', 'Midday', 'Early evening'], 0],
    ['What was happening outside?', ['Thunder was shaking the house', 'Snow was falling', 'Rain was pattering against the panes'], 2],
    ['What first opened on the creature?', ['Its mouth', 'A dull yellow eye', 'Its hand'], 1],
  ],
};
