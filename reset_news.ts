
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    await prisma.comment.deleteMany({});
    await prisma.ad.deleteMany({ where: { target_news_id: { not: null } } }); // Clear ad relations first
    await prisma.news.deleteMany({});
    console.log('All news deleted.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
