
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Current Bot Category Mappings ---');
    const mappings = await prisma.botCategoryMapping.findMany({
        orderBy: { source_name: 'asc' }
    });
    
    console.log('\n--- Recent News (Last 10) ---');
    const recentNews = await prisma.news.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        select: {
            title: true,
            source: true,
            category: true,
            created_at: true,
            original_url: true
        }
    });
    console.table(recentNews.map(n => ({
        Title: n.title.substring(0, 50) + '...',
        Source: n.source,
        Cat: n.category,
        Date: n.created_at.toLocaleString()
    })));

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
