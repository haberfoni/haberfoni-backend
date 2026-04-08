import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function cleanup() {
    try {
        const result = await prisma.news.deleteMany({
            where: {
                OR: [
                    { image_url: null },
                    { image_url: '' },
                    { image_url: { contains: 'no-image' } },
                    { image_url: { contains: 'unsplash' } }
                ]
            }
        });
        
        console.log(`Successfully deleted ${result.count} image-less or placeholder news items.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
