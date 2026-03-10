import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function bootstrap() {
    const sections = [
        {
            title: 'Kategoriler',
            type: 'dynamic_categories',
            order_index: 1,
            is_active: true
        },
        {
            title: 'Kurumsal',
            type: 'dynamic_pages',
            order_index: 2,
            is_active: true
        }
    ];

    console.log('Bootstrapping footer sections...');
    for (const section of sections) {
        // Upsert based on title
        const existing = await prisma.footerSection.findFirst({
            where: { title: section.title }
        });

        if (!existing) {
            await prisma.footerSection.create({
                data: section
            });
            console.log(`- Section "${section.title}" created.`);
        } else {
            console.log(`- Section "${section.title}" already exists.`);
        }
    }
}

bootstrap()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
