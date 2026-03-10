
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const newsCount = await prisma.news.count({ where: { category: 'yasam' } });
    const mappingCount = await prisma.botCategoryMapping.count({ where: { target_category: 'yasam' } });
    const catCount = await prisma.category.count({ where: { slug: 'yasam' } });

    console.log(`News count (yasam): ${newsCount}`);
    console.log(`Mapping count (yasam): ${mappingCount}`);
    console.log(`Category count (yasam): ${catCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
