
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const deleted = await prisma.headline.deleteMany({});
    console.log(`Successfully cleared ${deleted.count} pinned news entries (all types) to restore dynamic news flow.`);
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
