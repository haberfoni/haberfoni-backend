import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function cleanup() {
    try {
        const result = await prisma.news.deleteMany({
            where: {
                OR: [
                    { image_url: { contains: 'unsplash.com' } },
                    { image_url: { contains: 'placeholder' } }
                ]
            }
        });
        
        console.log(`Successfully deleted ${result.count} unsplash/placeholder news items.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
