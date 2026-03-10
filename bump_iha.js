
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ihaNews = await prisma.news.findMany({
        where: { source: 'IHA' },
        orderBy: { created_at: 'desc' },
        take: 5
    });

    const now = new Date();
    for (const news of ihaNews) {
        await prisma.news.update({
            where: { id: news.id },
            data: { created_at: now, published_at: now }
        });
        console.log(`Bumped IHA News: ${news.title.substring(0, 30)}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
