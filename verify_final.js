import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function check() {
    try {
        const count = await prisma.news.count({
            where: {
                OR: [
                    { image_url: null },
                    { image_url: '' },
                    { image_url: { contains: 'no-image' } },
                    { image_url: { contains: 'unsplash' } }
                ]
            }
        });
        console.log(`FINAL_VERIFICATION_COUNT: ${count}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
