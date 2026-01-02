import { PrismaClient, ListingType, ListingCategory, PriceTimeUnit } from '@prisma/client';

const prisma = new PrismaClient();

const listingTitles = {
  ELECTRONICS: [
    'Smartphone Samsung Galaxy zu verkaufen',
    'Laptop Dell XPS 13',
    'Alte PlayStation 4 abzugeben',
    'Bluetooth Kopfhörer',
    'iPad Pro 2020',
    'Smartwatch Apple Watch',
    'Gaming Maus Logitech',
    'Kindle E-Reader',
    'Webcam für Homeoffice',
    'USB-C Hub',
  ],
  FURNITURE: [
    'IKEA Schreibtisch',
    'Sofa 3-Sitzer beige',
    'Esstisch mit 4 Stühlen',
    'Bücherregal Holz',
    'Bett 160x200cm',
    'Kommode weiss',
    'Couchtisch Glas',
    'Kleiderschrank 2-türig',
    'Bürostuhl ergonomisch',
    'Regal Metall schwarz',
  ],
  SPORTS: [
    'Mountainbike 26 Zoll',
    'Yoga Matte neu',
    'Tennisschläger Wilson',
    'Laufschuhe Größe 42',
    'Fußball Größe 5',
    'Hantelset 20kg',
    'Skiausrüstung komplett',
    'Surfboard gebraucht',
    'Tischtennisplatte',
    'Boxhandschuhe',
  ],
  CLOTHING: [
    'Winterjacke North Face',
    'Jeans Levis Größe 32',
    'Kleid elegant schwarz',
    'Sneakers Nike Air Max',
    'Pullover Wolle',
    'Anzug grau Größe 50',
    'Sommerkleidung Paket',
    'Schuhe Größe 38',
    'Gürtel Leder',
    'Mütze und Schal Set',
  ],
  HOUSEHOLD: [
    'Kaffeemaschine Nespresso',
    'Staubsauger Dyson',
    'Mikrowelle Samsung',
    'Töpfe Set Edelstahl',
    'Bettwäsche 4-teilig',
    'Bügeleisen Philips',
    'Geschirr-Set 12 Personen',
    'Wasserkocher',
    'Toaster 2-Schlitz',
    'Mixer Braun',
  ],
  GARDEN: [
    'Rasenmäher elektrisch',
    'Gartenmöbel Set',
    'Pflanzentöpfe verschiedene',
    'Grill Weber',
    'Heckenschere',
    'Gartenschlauch 20m',
    'Sonnenschirm 3m',
    'Blumenerde Säcke',
    'Gartenwerkzeug Set',
    'Liegestuhl klappbar',
  ],
  BOOKS: [
    'Harry Potter Sammlung',
    'Kochbuch Jamie Oliver',
    'Reiseführer Italien',
    'Romane verschiedene',
    'Lehrbuch Mathematik',
    'Kinderbücher Paket',
    'Thriller Bestseller',
    'Comics Marvel',
    'Sachbuch Psychologie',
    'Lexikon Brockhaus',
  ],
  TOYS: [
    'Lego Set Star Wars',
    'Puppe Barbie',
    'Playmobil Ritterburg',
    'Spielzeugautos Hot Wheels',
    'Puzzle 1000 Teile',
    'Gesellschaftsspiel Monopoly',
    'Kinderwagen gebraucht',
    'Kuscheltiere',
    'Spielküche Holz',
    'Drohne mit Kamera',
  ],
  TOOLS: [
    'Bohrmaschine Bosch',
    'Werkzeugkoffer komplett',
    'Akkuschrauber Makita',
    'Säge Kreissäge',
    'Leiter 3m',
    'Schraubenzieher Set',
    'Schleifmaschine',
    'Wasserwaage digital',
    'Zange Set',
    'Hammer und Meißel',
  ],
  FOOD: [
    'Selbstgemachte Marmelade',
    'Honig vom Imker',
    'Gemüse aus eigenem Garten',
    'Apfelsaft frisch gepresst',
    'Brot selbstgebacken',
    'Kräuter Topf Basilikum',
    'Eier vom Bauernhof',
    'Kuchen hausgemacht',
    'Konfitüre verschiedene Sorten',
    'Nüsse gemischt',
  ],
  SERVICES: [
    'Nachhilfe Mathematik',
    'Gartenarbeiten',
    'Umzugshilfe',
    'PC Reparatur',
    'Babysitting',
    'Haustierpflege',
    'Reinigung Wohnung',
    'Malerarbeiten',
    'Sprachunterricht Englisch',
    'Klavierunterricht',
  ],
  VEHICLES: [
    'Fahrrad Damenrad 28 Zoll',
    'E-Bike gebraucht',
    'Roller Vespa',
    'Auto VW Golf',
    'Motorrad Honda',
    'Anhänger für PKW',
    'Kinderfahrrad 20 Zoll',
    'Skateboard',
    'Elektroroller',
    'Mountainbike Carbon',
  ],
  OTHER: [
    'Umzugskartons',
    'Alte Vinyls Sammlung',
    'Aquarium 100L',
    'Musikinstrument Gitarre',
    'Werkbank Garage',
    'Lampe Stehlampe',
    'Spiegel groß',
    'Teppich Persisch',
    'Vorhänge beige',
    'Diverse Haushaltsgegenstände',
  ],
};

const descriptions = [
  'Gut erhalten, kaum benutzt.',
  'Neuwertig, original verpackt.',
  'Gebraucht aber voll funktionsfähig.',
  'Muss schnell weg wegen Umzug.',
  'Super Zustand, wie neu!',
  'Leichte Gebrauchsspuren vorhanden.',
  'Funktioniert einwandfrei.',
  'Privater Verkauf, keine Garantie.',
  'Sehr gepflegt, nichts zu bemängeln.',
  'Nur Abholung möglich.',
  'Versand möglich gegen Aufpreis.',
  'Bei Interesse gerne melden!',
  'Preis ist verhandelbar.',
  'Nur an Selbstabholer.',
  'Noch original verpackt.',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomPrice(type: ListingType): { price?: number; priceTimeUnit?: PriceTimeUnit } {
  if (type === 'SEARCH') {
    return {};
  }

  if (type === 'SELL') {
    const prices = [500, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 50000];
    return { price: getRandomElement(prices) };
  }

  // RENT or LEND
  const prices = [500, 1000, 1500, 2000, 2500, 3000, 5000];
  const timeUnits: PriceTimeUnit[] = ['HOUR', 'DAY', 'WEEK', 'MONTH'];
  return {
    price: getRandomElement(prices),
    priceTimeUnit: getRandomElement(timeUnits),
  };
}

async function main() {
  console.log('Seeding 100 random listings...');

  // Get existing users
  const users = await prisma.user.findMany({
    take: 10,
  });

  if (users.length === 0) {
    console.error('No users found. Please run the main seed script first.');
    return;
  }

  // Get existing communities
  const communities = await prisma.community.findMany({
    take: 5,
  });

  const categories = Object.keys(listingTitles) as ListingCategory[];
  const types: ListingType[] = ['SELL', 'RENT', 'LEND', 'SEARCH'];

  const listings = [];

  for (let i = 0; i < 100; i++) {
    const category = getRandomElement(categories);
    const type = getRandomElement(types);
    const title = getRandomElement(listingTitles[category]);
    const description = [
      getRandomElement(descriptions),
      getRandomElement(descriptions),
    ].join(' ');

    const pricing = getRandomPrice(type);
    const creator = getRandomElement(users);

    // Ensure title doesn't exceed 60 characters
    const fullTitle = `${title} #${i + 1}`;
    const truncatedTitle = fullTitle.length > 60
      ? fullTitle.substring(0, 60).trim()
      : fullTitle;

    const listing = await prisma.listing.create({
      data: {
        creatorId: creator.id,
        title: truncatedTitle,
        description,
        type,
        category,
        ...pricing,
      },
    });

    // Randomly assign visibility
    if (communities.length > 0 && Math.random() > 0.3) {
      const community = getRandomElement(communities);
      await prisma.listingVisibility.create({
        data: {
          listingId: listing.id,
          visibilityType: 'COMMUNITY',
          communityId: community.id,
        },
      });
    }

    listings.push(listing);

    if ((i + 1) % 10 === 0) {
      console.log(`Created ${i + 1} listings...`);
    }
  }

  console.log('Seeding complete!');
  console.log(`Created ${listings.length} listings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
