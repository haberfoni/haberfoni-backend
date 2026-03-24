const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking FooterSections...');
    const sections = await prisma.footerSection.findMany({
        include: { Links: true }
    });
    console.log('Sections in DB:', JSON.stringify(sections, null, 2));
    
    if (sections.length === 0) {
        console.log('No sections found. Creating a test section...');
        const newSection = await prisma.footerSection.create({
            data: {
                title: 'Test Bölümü',
                type: 'custom_links',
                is_active: true,
                order_index: 0
            }
        });
        console.log('Created section:', newSection);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
