import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function bootstrap() {
    const pages = [
        {
            title: 'Çerez Politikası',
            slug: 'cerez-politikasi',
            content: '<h1>Çerez Politikası</h1><p>Bu web sitesi, size en iyi deneyimi sunmak için çerezleri kullanır...</p>',
            meta_title: 'Çerez Politikası - Haberfoni',
            meta_description: 'Haberfoni çerez kullanımı ve politikaları hakkında bilgi edinin.'
        },
        {
            title: 'Kurumsal Kimlik',
            slug: 'kurumsal-kimlik',
            content: '<h1>Kurumsal Kimlik</h1><p>Haberfoni, tarafsız ve hızlı haber anlayışıyla yanınızda...</p>',
            meta_title: 'Kurumsal Kimlik - Haberfoni',
            meta_description: 'Haberfoni kurumsal vizyonu ve kimliği.'
        },
        {
            title: 'Gizlilik Politikası',
            slug: 'gizlilik-politikasi',
            content: '<h1>Gizlilik Politikası</h1><p>Verilerinizin gizliliği bizim için önemlidir...</p>',
            meta_title: 'Gizlilik Politikası - Haberfoni',
            meta_description: 'Haberfoni gizlilik ve veri güvenliği politikası.'
        },
        {
            title: 'Kullanım Şartları',
            slug: 'kullanim-sartlari',
            content: '<h1>Kullanım Şartları</h1><p>Web sitemizi kullanarak aşağıdaki şartları kabul etmiş sayılırsınız...</p>',
            meta_title: 'Kullanım Şartları - Haberfoni',
            meta_description: 'Haberfoni web sitesi kullanım koşulları ve şartları.'
        }
    ];

    console.log('Bootstrapping pages...');
    for (const page of pages) {
        await prisma.page.upsert({
            where: { slug: page.slug },
            update: {},
            create: page
        });
        console.log(`- ${page.title} handled.`);
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
