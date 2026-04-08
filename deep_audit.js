import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function check() {
    try {
        const all = await prisma.news.findMany({
            where: {
                OR: [
                    { title: { contains: 'Meclis' } },
                    { title: { contains: 'Merkez' } },
                    { title: { contains: 'Kar Yağışı' } }
                ]
            }
        });
        
        console.log(`Found ${all.length} items in DB.`);
        all.forEach(n => {
            console.log(`ID: ${n.id} | Title: ${n.title} | Image: [${n.image_url}]`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
