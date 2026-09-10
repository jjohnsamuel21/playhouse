/**
 * Content for the 3 new games (Trivia Night, Most Likely To, Story Builder) —
 * 5 themes each, hand-authored, fun/interactive, safe for a general public
 * audience. Consumed by scripts/seedNewGames.ts.
 */

export interface NewTriviaTheme {
  name: string;
  description: string;
  tags: string[];
  questions: { question: string; options: string[]; correctIndex: number }[];
}

export interface NewMostLikelyToTheme {
  name: string;
  description: string;
  tags: string[];
  prompts: string[];
}

export interface NewStoryBuilderTheme {
  name: string;
  description: string;
  tags: string[];
  starter: string;
}

// ── Trivia Night (5 themes) ─────────────────────────────────────────────────────

export const triviaThemes: NewTriviaTheme[] = [
  {
    name: 'Pop Culture',
    description: 'Music, movies, and celebrity trivia.',
    tags: ['pop-culture'],
    questions: [
      { question: "Which artist released the album '1989'?", options: ['Taylor Swift', 'Ariana Grande', 'Katy Perry', 'Adele'], correctIndex: 0 },
      { question: 'What streaming platform produced "Stranger Things"?', options: ['Hulu', 'Netflix', 'Disney+', 'Amazon Prime'], correctIndex: 1 },
      { question: 'Who played Iron Man in the Marvel Cinematic Universe?', options: ['Chris Evans', 'Chris Hemsworth', 'Robert Downey Jr.', 'Mark Ruffalo'], correctIndex: 2 },
      { question: 'Which social media app is known for short dance videos?', options: ['TikTok', 'LinkedIn', 'Pinterest', 'Reddit'], correctIndex: 0 },
      { question: "What is Beyoncé's daughter's name?", options: ['Blue Ivy', 'North', 'Stormi', 'True'], correctIndex: 0 },
      { question: 'Which band performs "Bohemian Rhapsody"?', options: ['The Beatles', 'Queen', 'Led Zeppelin', 'Pink Floyd'], correctIndex: 1 },
      { question: 'What is the name of the coffee shop in "Friends"?', options: ["Central Perk", "The Grind", "Java Joe's", 'Common Grounds'], correctIndex: 0 },
      { question: 'Who is known as the "King of Pop"?', options: ['Elvis Presley', 'Prince', 'Michael Jackson', 'James Brown'], correctIndex: 2 },
      { question: 'Which movie features the song "Let It Go"?', options: ['Moana', 'Frozen', 'Tangled', 'Encanto'], correctIndex: 1 },
      { question: 'What is the highest-grossing film of all time (unadjusted)?', options: ['Titanic', 'Avatar', 'Avengers: Endgame', 'Star Wars'], correctIndex: 1 },
      { question: 'Which reality show features contestants finding love while engaged sight unseen?', options: ['The Bachelor', 'Love Island', 'Love is Blind', 'Married at First Sight'], correctIndex: 2 },
      { question: 'Who directed "Barbie" (2023)?', options: ['Greta Gerwig', 'Sofia Coppola', 'Patty Jenkins', 'Olivia Wilde'], correctIndex: 0 },
    ],
  },
  {
    name: 'General Knowledge',
    description: 'Everyday facts everyone half-remembers.',
    tags: ['general'],
    questions: [
      { question: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correctIndex: 2 },
      { question: 'How many continents are there?', options: ['5', '6', '7', '8'], correctIndex: 2 },
      { question: 'What is the largest planet in our solar system?', options: ['Saturn', 'Jupiter', 'Neptune', 'Earth'], correctIndex: 1 },
      { question: 'What gas do plants primarily absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], correctIndex: 2 },
      { question: 'How many strings does a standard guitar have?', options: ['4', '5', '6', '7'], correctIndex: 2 },
      { question: 'What is the currency of Japan?', options: ['Won', 'Yuan', 'Yen', 'Ringgit'], correctIndex: 2 },
      { question: 'Which ocean is the largest?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctIndex: 3 },
      { question: 'How many bones are in the adult human body?', options: ['186', '206', '226', '246'], correctIndex: 1 },
      { question: 'What is the smallest prime number?', options: ['0', '1', '2', '3'], correctIndex: 2 },
      { question: 'Which language has the most native speakers worldwide?', options: ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'], correctIndex: 2 },
      { question: 'What is the boiling point of water at sea level in Celsius?', options: ['90', '95', '100', '110'], correctIndex: 2 },
      { question: 'Which country is both in Europe and Asia?', options: ['Turkey', 'Egypt', 'Morocco', 'Greece'], correctIndex: 0 },
    ],
  },
  {
    name: 'Movie Trivia',
    description: 'For film buffs and casual watchers alike.',
    tags: ['movies'],
    questions: [
      { question: 'Which movie won Best Picture at the 2020 Oscars?', options: ['1917', 'Joker', 'Parasite', 'Ford v Ferrari'], correctIndex: 2 },
      { question: "Who directed 'Jaws' and 'E.T.'?", options: ['George Lucas', 'Steven Spielberg', 'Martin Scorsese', 'James Cameron'], correctIndex: 1 },
      { question: "In 'The Wizard of Oz', what color are Dorothy's slippers?", options: ['Silver', 'Gold', 'Ruby', 'Emerald'], correctIndex: 2 },
      { question: 'Which actor played Jack in "Titanic"?', options: ['Brad Pitt', 'Leonardo DiCaprio', 'Matt Damon', 'Tom Cruise'], correctIndex: 1 },
      { question: "What is the name of the fictional African nation in 'Black Panther'?", options: ['Zamunda', 'Wakanda', 'Genovia', 'Sokovia'], correctIndex: 1 },
      { question: 'Which Pixar movie is about emotions inside a girl\'s mind?', options: ['Inside Out', 'Soul', 'Up', 'Coco'], correctIndex: 0 },
      { question: "Who played the Joker in 'The Dark Knight'?", options: ['Jared Leto', 'Joaquin Phoenix', 'Heath Ledger', 'Jack Nicholson'], correctIndex: 2 },
      { question: "What year did the first 'Star Wars' film release?", options: ['1975', '1977', '1980', '1983'], correctIndex: 1 },
      { question: 'Which studio produced "Shrek"?', options: ['Pixar', 'DreamWorks', 'Illumination', 'Blue Sky'], correctIndex: 1 },
      { question: "In 'The Matrix', what color pill does Neo take?", options: ['Blue', 'Red', 'Green', 'Yellow'], correctIndex: 1 },
      { question: "Who composed the score for 'Jurassic Park'?", options: ['Hans Zimmer', 'John Williams', 'James Horner', 'Danny Elfman'], correctIndex: 1 },
      { question: "What is the highest-grossing animated film of all time?", options: ['Frozen II', 'The Lion King (2019)', 'Frozen', 'Incredibles 2'], correctIndex: 1 },
    ],
  },
  {
    name: 'Food & Drink',
    description: 'Culinary trivia to spice up game night.',
    tags: ['food'],
    questions: [
      { question: 'What is the main ingredient in guacamole?', options: ['Tomato', 'Avocado', 'Lime', 'Onion'], correctIndex: 1 },
      { question: 'Which country is credited with inventing pizza as we know it?', options: ['France', 'Greece', 'Italy', 'Spain'], correctIndex: 2 },
      { question: 'What type of pastry is used to make croissants?', options: ['Shortcrust', 'Puff', 'Laminated dough', 'Choux'], correctIndex: 2 },
      { question: 'What is sushi rice seasoned with?', options: ['Soy sauce', 'Rice vinegar', 'Sesame oil', 'Mirin only'], correctIndex: 1 },
      { question: 'Which fruit is used to make wine?', options: ['Apples', 'Grapes', 'Berries', 'Plums'], correctIndex: 1 },
      { question: 'What is the primary flavor in traditional hummus?', options: ['Chickpeas', 'Lentils', 'Black beans', 'Peanuts'], correctIndex: 0 },
      { question: 'What spice is derived from the Crocus flower?', options: ['Paprika', 'Turmeric', 'Saffron', 'Cumin'], correctIndex: 2 },
      { question: 'Which country is the origin of the croissant, despite being French-associated?', options: ['France', 'Austria', 'Belgium', 'Switzerland'], correctIndex: 1 },
      { question: 'What is the main alcohol in a classic Mojito?', options: ['Vodka', 'Gin', 'Rum', 'Tequila'], correctIndex: 2 },
      { question: 'Which cheese is traditionally used on a Margherita pizza?', options: ['Cheddar', 'Mozzarella', 'Gouda', 'Feta'], correctIndex: 1 },
      { question: 'What does "al dente" describe in cooking?', options: ['Very soft pasta', 'Slightly firm pasta', 'Overcooked rice', 'Raw vegetables'], correctIndex: 1 },
      { question: 'Which beverage is made from fermented tea?', options: ['Matcha', 'Kombucha', 'Chai', 'Boba'], correctIndex: 1 },
    ],
  },
  {
    name: 'History Lite',
    description: 'Easygoing history questions, no PhD required.',
    tags: ['history'],
    questions: [
      { question: 'Who was the first President of the United States?', options: ['Thomas Jefferson', 'George Washington', 'John Adams', 'Abraham Lincoln'], correctIndex: 1 },
      { question: 'In which year did World War II end?', options: ['1943', '1945', '1947', '1950'], correctIndex: 1 },
      { question: 'Which ancient civilization built the pyramids of Giza?', options: ['Romans', 'Greeks', 'Egyptians', 'Mayans'], correctIndex: 2 },
      { question: 'Who wrote the Declaration of Independence?', options: ['Benjamin Franklin', 'Thomas Jefferson', 'James Madison', 'John Hancock'], correctIndex: 1 },
      { question: 'The Great Wall of China was built primarily to defend against what?', options: ['Floods', 'Invasions', 'Earthquakes', 'Famine'], correctIndex: 1 },
      { question: 'Which empire was ruled by Julius Caesar?', options: ['Greek', 'Roman', 'Persian', 'Ottoman'], correctIndex: 1 },
      { question: 'What wall divided a city from 1961 to 1989?', options: ['Berlin Wall', 'Great Wall', 'Hadrian\'s Wall', 'Western Wall'], correctIndex: 0 },
      { question: 'Who was known as the "Maid of Orléans"?', options: ['Marie Antoinette', 'Joan of Arc', 'Catherine the Great', 'Cleopatra'], correctIndex: 1 },
      { question: 'Which country gifted the Statue of Liberty to the US?', options: ['England', 'Spain', 'France', 'Italy'], correctIndex: 2 },
      { question: 'The Renaissance began in which country?', options: ['France', 'Italy', 'Germany', 'Spain'], correctIndex: 1 },
      { question: 'Who was the first man to walk on the Moon?', options: ['Buzz Aldrin', 'Neil Armstrong', 'John Glenn', 'Yuri Gagarin'], correctIndex: 1 },
      { question: 'Which document limited the power of English kings in 1215?', options: ['Bill of Rights', 'Magna Carta', 'Treaty of Versailles', 'Domesday Book'], correctIndex: 1 },
    ],
  },
];

// ── Most Likely To (5 themes, ~15 prompts each) ─────────────────────────────────

export const mostLikelyToThemes: NewMostLikelyToTheme[] = [
  {
    name: 'Friend Group Classics',
    description: 'The staples every friend group argues about.',
    tags: ['friends', 'classic'],
    prompts: [
      'become famous',
      'forget their own birthday',
      'win the lottery and spend it all in a week',
      'become a millionaire before 30',
      'get lost using GPS',
      'cry during a movie and deny it',
      'start a business on a whim',
      'sleep through an alarm on an important day',
      'become a professional athlete',
      'talk their way out of a speeding ticket',
      'adopt way too many pets',
      'move to a different country',
      'become the group\'s wedding planner',
      'text the wrong person something embarrassing',
      'still be friends with everyone in 20 years',
    ],
  },
  {
    name: 'Party Edition',
    description: 'For the loudest room in the house.',
    tags: ['party'],
    prompts: [
      'start a dance-off',
      'lose their phone at the party',
      'be the last one standing',
      'make a new best friend tonight',
      'spill a drink on someone',
      'give an impromptu speech',
      'organize a game everyone plays',
      'fall asleep before midnight',
      'take the best photos of the night',
      'convince everyone to do one more round',
      'be the DJ for the night',
      'start a conga line',
      'get everyone\'s number by the end',
      'be the first to leave',
      'become the life of the party',
    ],
  },
  {
    name: 'Family Fun',
    description: 'Wholesome enough for the whole family.',
    tags: ['family', 'wholesome'],
    prompts: [
      'win a family trivia night',
      'plan the next family vacation',
      'tell the best stories at dinner',
      'be the family peacemaker',
      'always bring the best snacks',
      'remember everyone\'s birthday',
      'start a new family tradition',
      'win a board game night',
      'take the most photos on a trip',
      'be the designated family DJ',
      'get everyone laughing the hardest',
      'organize a surprise for someone',
      'be the one who says "one more game"',
      'cook the best holiday dish',
      'become the favorite aunt or uncle',
    ],
  },
  {
    name: 'Office Icebreaker',
    description: 'Team-friendly, work-appropriate fun.',
    tags: ['work', 'team'],
    prompts: [
      'be first to volunteer for a project',
      'stay calm during a crisis',
      'become the office trivia champion',
      'plan the office party',
      'give the best presentations',
      'be promoted first',
      'start a fun office tradition',
      'remember everyone\'s coffee order',
      'give the most helpful feedback',
      'become a great mentor',
      'organize the team outing',
      'stay latest to finish a project',
      'be the go-to person for tech help',
      'run their own business someday',
      'win "employee of the year"',
    ],
  },
  {
    name: 'Chaos Mode',
    description: 'A little wilder, still all in good fun.',
    tags: ['chaos', 'funny'],
    prompts: [
      'accidentally start a rumor',
      'get everyone into a spontaneous adventure',
      'talk their way into a VIP section',
      'lose track of time completely',
      'convince the group to try something risky',
      'end up on the news someday (for something good)',
      'become an accidental internet meme',
      'get the whole group kicked out somewhere (harmlessly)',
      'start an argument about something trivial',
      'plan a trip with zero itinerary',
      'befriend a stranger in five minutes',
      'turn a small task into a huge production',
      'be the reason for the group\'s best story',
      'never live down one embarrassing moment',
      'somehow always be right',
    ],
  },
];

// ── Story Builder (5 themes) ─────────────────────────────────────────────────────

export const storyBuilderThemes: NewStoryBuilderTheme[] = [
  {
    name: 'Haunted House',
    description: 'A spooky night in an old, creaking mansion.',
    tags: ['spooky'],
    starter: 'The old mansion creaked as the front door swung open on its own, revealing a hallway lit only by flickering candles.',
  },
  {
    name: 'Space Adventure',
    description: 'Somewhere far beyond the stars, things are about to get weird.',
    tags: ['scifi'],
    starter: 'The spaceship\'s alarms blared as a strange light pulsed from the control panel — nobody remembered installing that button.',
  },
  {
    name: 'Office Heist',
    description: 'A workplace comedy about to go sideways.',
    tags: ['comedy'],
    starter: 'It was supposed to be a normal Tuesday at the office, until someone noticed the entire snack cabinet had vanished overnight.',
  },
  {
    name: 'Fairy Tale Gone Wrong',
    description: 'Once upon a time, things did not go as planned.',
    tags: ['fantasy'],
    starter: 'Once upon a time, in a kingdom not too far away, the princess refused to wait for anyone to rescue her.',
  },
  {
    name: 'Detective Mystery',
    description: 'A case that just does not add up.',
    tags: ['mystery'],
    starter: 'Detective Reyes stared at the empty room — the door had been locked from the inside, and yet the safe was wide open.',
  },
];
