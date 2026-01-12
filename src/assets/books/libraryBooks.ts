export type Book = {
  id: number;
  title: string;
  author: string;
  category: string;
  year: number;
  cover?: string;
  pdf?: string;
  description?: string;
};

const books: Book[] = [
  {
    id: 1,
    title: 'De Verborgen Bibliotheek',
    author: 'A. Jansen',
    category: 'Fictie',
    year: 1998,
    cover: '/static/covers/verborgen-bibliotheek.svg',
    description: 'Een mysterie dat zich afspeelt tussen de boekenplanken.'
  },
  {
    id: 2,
    title: 'Geschiedenis van Avontuur',
    author: 'B. van Dijk',
    category: 'Geschiedenis',
    year: 2005,
    cover: '/static/covers/geschiedenis-avontuur.svg',
    description: 'Een overzicht van ontdekkingsreizigers en locaties.'
  },
  {
    id: 3,
    title: 'Korte Verhalen Voor Avond',
    author: 'C. de Vries',
    category: 'Fictie',
    year: 2018,
    cover: '/static/covers/korte-verhalen.svg',
    description: 'Een bundel korte, intieme vertellingen.'
  },
  {
    id: 4,
    title: 'De Bibliothecaris',
    author: 'M. Vellemann',
    category: 'Fictie',
    year: 2020,
    cover: '/static/covers/bibliothecaris.svg',
    description: 'Een fascinerende roman over geheimen verborgen tussen antieke boeken.'
  },
  {
    id: 5,
    title: 'Oude Legendes',
    author: 'E. Visser',
    category: 'Cultuur',
    year: 1975,
    cover: '/static/covers/oude-legendes.svg',
    description: 'Een collectie mythen en sagen van vroeger.'
  },
  {
    id: 6,
    title: 'The Rebel and the Rose',
    author: 'Catherine Doyle',
    category: 'Fictie',
    year: 2019,
    cover: '/static/covers/rebel-rose.svg',
    pdf: '/static/covers/the-rebel-and-the-rose.pdf',
    description: 'Een historische roman vol romance, rebellie en avontuur.'
  },
  {
    id: 7,
    title: 'De Nachtwaak',
    author: 'R. Hogestein',
    category: 'Mysterie',
    year: 2021,
    cover: '/static/covers/nachtwaak.svg',
    description: 'Een spannend mysterie dat in het donker speelt.'
  },
  {
    id: 8,
    title: 'Reis naar Atlantis',
    author: 'S. Magellan',
    category: 'Avontuur',
    year: 2008,
    cover: '/static/covers/atlantis.svg',
    description: 'Een episch avontuur op zoek naar de verloren stad.'
  },
  {
    id: 9,
    title: 'Gedichten van het Hart',
    author: 'T. Schelling',
    category: 'Poëzie',
    year: 2015,
    cover: '/static/covers/gedichten-hart.svg',
    description: 'Verzameling van hartverwarmende en diepzinnige gedichten.'
  },
  {
    id: 10,
    title: 'De Verloren Erfenis',
    author: 'U. Pietersen',
    category: 'Fictie',
    year: 2019,
    cover: '/static/covers/erfenis.svg',
    description: 'Een familiegeheim dat over generaties wordt verborgen.'
  },
  {
    id: 11,
    title: 'Kosmische Wonderen',
    author: 'V. Sterren',
    category: 'Wetenschap',
    year: 2022,
    cover: '/static/covers/kosmisch.svg',
    description: 'Ontdekkingen over het universum en verre sterrenstelsels.'
  },
  {
    id: 12,
    title: 'Het Groene Woud',
    author: 'W. Natuur',
    category: 'Cultuur',
    year: 2017,
    cover: '/static/covers/groen-woud.svg',
    description: 'Een verhaal over de geheimen van het oerwoud.'
  },
  {
    id: 13,
    title: 'Stadsleven in Gotiek',
    author: 'X. Architect',
    category: 'Geschiedenis',
    year: 2010,
    cover: '/static/covers/gotiek.svg',
    description: 'Architectuur en leven in middeleeuwse steden.'
  },
  {
    id: 14,
    title: 'De Dansende Slaaf',
    author: 'Y. Ritme',
    category: 'Fictie',
    year: 2020,
    cover: '/static/covers/dans.svg',
    description: 'Een verhaal van vrijheid en uitdrukking door dans.'
  },
  {
    id: 15,
    title: 'Zenwijsheid voor Vandaag',
    author: 'Z. Meditatie',
    category: 'Cultuur',
    year: 2021,
    cover: '/static/covers/zen.svg',
    description: 'Oude wijsheid toegepast op modern leven.'
  },
  {
    id: 16,
    title: 'De Race Tegen de Tijd',
    author: 'ChatGPT',
    category: 'Fictie',
    year: 2025,
    cover: '/static/placeholder-book.png',
    pdf: '/read?book=1',
    description: 'Een tijdreiziger wordt in de middeleeuwen gekatapulteerd met slechts één uur om een geheim document te vinden dat de toekomst kan redden. Elke keuze telt, want wanneer de timer afloopt, verdwijn je terug naar het heden.',
  }
];

export default books;
