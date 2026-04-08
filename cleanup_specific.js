import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function cleanup() {
    try {
        const items = await prisma.news.findMany({
            where: {
                OR: [
                    { title: { contains: 'Meclis' } },
                    { title: { contains: 'Merkez Bankası' } },
                    { image_url: { contains: 'unsplash' } }
                ]
            }
        });
        
        console.log(`Found ${items.length} items to delete.`);
        const ids = items.map(i => i.id);
        
        if (ids.length > 0) {
            const result = await prisma.news.deleteMany({
                where: {
                    id: { in: ids }
                }
            });
            console.log(`Successfully deleted ${result.count} items.`);
        } else {
            console.log('No matching items found to delete.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
