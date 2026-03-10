
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const deleted = await prisma.headline.deleteMany({
        where: { type: 1 }
    });
    console.log(`Successfully cleared ${deleted.count} pinned news entries from the slider (type 1).`);
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
