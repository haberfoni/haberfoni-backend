
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ihaMappings = [
    { source_url: 'https://www.iha.com.tr/gundem', target_category: 'gundem' },
    { source_url: 'https://www.iha.com.tr/ekonomi', target_category: 'ekonomi' },
    { source_url: 'https://www.iha.com.tr/spor', target_category: 'spor' },
    { source_url: 'https://www.iha.com.tr/politika', target_category: 'politika' }, // siyaset -> politika
    { source_url: 'https://www.iha.com.tr/dunya', target_category: 'dunya' },
    { source_url: 'https://www.iha.com.tr/magazin', target_category: 'magazin' },
    { source_url: 'https://www.iha.com.tr/teknoloji', target_category: 'teknoloji' },
    { source_url: 'https://www.iha.com.tr/saglik', target_category: 'saglik' }
];

const dhaMappings = [
    { source_url: 'https://www.dha.com.tr/gundem', target_category: 'gundem' },
    { source_url: 'https://www.dha.com.tr/ekonomi', target_category: 'ekonomi' },
    { source_url: 'https://www.dha.com.tr/spor', target_category: 'spor' },
    { source_url: 'https://www.dha.com.tr/dunya', target_category: 'dunya' },
    { source_url: 'https://www.dha.com.tr/teknoloji', target_category: 'teknoloji' },
    { source_url: 'https://www.dha.com.tr/saglik-yasam', target_category: 'saglik' }, // DHA uses saglik-yasam sometimes? Checking generic
    { source_url: 'https://www.dha.com.tr/kultur-sanat', target_category: 'kultur-sanat' }
];

// Note: DHA might redirect saglik -> saglik-yasam or similar. Using what seems standard.

async function main() {
    console.log('--- Enabling Bots ---');

    // 1. Enable IHA
    await prisma.botSetting.upsert({
        where: { source_name: 'IHA' },
        update: { is_active: true, auto_publish: true },
        create: { source_name: 'IHA', is_active: true, auto_publish: true, daily_limit: 100 }
    });
    console.log('IHA enabled.');

    // 2. Enable DHA
    await prisma.botSetting.upsert({
        where: { source_name: 'DHA' },
        update: { is_active: true, auto_publish: true },
        create: { source_name: 'DHA', is_active: true, auto_publish: true, daily_limit: 100 }
    });
    console.log('DHA enabled.');

    // 3. Seed IHA Mappings
    for (const m of ihaMappings) {
        await prisma.botCategoryMapping.upsert({
            where: { source_url: m.source_url },
            update: { is_active: true, target_category: m.target_category },
            create: {
                source_name: 'IHA',
                source_url: m.source_url,
                target_category: m.target_category,
                is_active: true
            }
        });
    }
    console.log(`Seeded ${ihaMappings.length} IHA mappings.`);

    // 4. Seed DHA Mappings
    for (const m of dhaMappings) {
        await prisma.botCategoryMapping.upsert({
            where: { source_url: m.source_url },
            update: { is_active: true, target_category: m.target_category },
            create: {
                source_name: 'DHA',
                source_url: m.source_url,
                target_category: m.target_category,
                is_active: true
            }
        });
    }
    console.log(`Seeded ${dhaMappings.length} DHA mappings.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
