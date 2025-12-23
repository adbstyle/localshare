import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test users
  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Schmidt',
      homeAddress: 'Bahnhofstrasse 1, 8001 Zürich',
      phoneNumber: '+41791234567',
      preferredLanguage: 'de',
      consentGivenAt: new Date(),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      firstName: 'Bob',
      lastName: 'Müller',
      homeAddress: 'Hauptstrasse 10, 8001 Zürich',
      preferredLanguage: 'de',
      consentGivenAt: new Date(),
    },
  });

  // Create community
  const community = await prisma.community.create({
    data: {
      name: 'Zürich Altstadt Nachbarn',
      description: 'Nachbarschafts-Community für die Zürcher Altstadt',
      ownerId: user1.id,
    },
  });

  // Add members
  await prisma.communityMember.createMany({
    data: [
      { communityId: community.id, userId: user1.id },
      { communityId: community.id, userId: user2.id },
    ],
  });

  // Create group
  const group = await prisma.group.create({
    data: {
      communityId: community.id,
      name: 'Garten-Enthusiasten',
      description: 'Für alle die gerne gärtnern',
      ownerId: user1.id,
    },
  });

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: user1.id,
    },
  });

  // Create listings
  const listing1 = await prisma.listing.create({
    data: {
      creatorId: user1.id,
      title: 'Bosch Bohrmaschine zu verkaufen',
      description: 'Gut erhaltene Bohrmaschine, 2 Jahre alt, kaum benutzt.',
      type: 'SELL',
      price: 5000, // 50.00 CHF in cents
      category: 'TOOLS_HARDWARE',
    },
  });

  await prisma.listingVisibility.create({
    data: {
      listingId: listing1.id,
      visibilityType: 'COMMUNITY',
      communityId: community.id,
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      creatorId: user2.id,
      title: 'Suche Rasenmäher zum Ausleihen',
      description: 'Brauche einen Rasenmäher für dieses Wochenende.',
      type: 'SEARCH',
      category: 'GARDEN_PLANTS',
    },
  });

  await prisma.listingVisibility.create({
    data: {
      listingId: listing2.id,
      visibilityType: 'GROUP',
      groupId: group.id,
    },
  });

  console.log('Seeding complete!');
  console.log({ user1, user2, community, group, listing1, listing2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
