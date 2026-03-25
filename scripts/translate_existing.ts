import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function translateFree(text: string, targetLanguage: string = 'en'): Promise<string> {
    if (!text) return '';
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await axios.get(url);
        if (response.data && response.data[0]) {
            return response.data[0].map((part: any) => part[0]).join('');
        }
        return text;
    } catch (error) {
        console.error('Translation error:', error.message);
        return text;
    }
}

async function main() {
    console.log('Starting content refresh (Translation)...');

    // 1. Photo Galleries
    const galleries = await prisma.photoGallery.findMany({
        where: { OR: [{ title_en: null }, { title_en: '' }] },
        take: 30
    });
    console.log(`Found ${galleries.length} galleries to translate.`);
    for (const g of galleries) {
        console.log(`Translating gallery: ${g.title}`);
        const titleEn = await translateFree(g.title);
        const descEn = g.description ? await translateFree(g.description.substring(0, 1000)) : '';
        await prisma.photoGallery.update({
            where: { id: g.id },
            data: { title_en: titleEn, description_en: descEn, seo_title_en: titleEn }
        });
    }

    // 2. Videos
    const videos = await prisma.video.findMany({
        where: { OR: [{ title_en: null }, { title_en: '' }] },
        take: 30
    });
    console.log(`Found ${videos.length} videos to translate.`);
    for (const v of videos) {
        console.log(`Translating video: ${v.title}`);
        const titleEn = await translateFree(v.title);
        const descEn = v.description ? await translateFree(v.description.substring(0, 1000)) : '';
        await prisma.video.update({
            where: { id: v.id },
            data: { title_en: titleEn, description_en: descEn, seo_title_en: titleEn }
        });
    }

    // 3. News (Hero/Breaking items first)
    const news = await prisma.news.findMany({
        where: { OR: [{ title_en: null }, { title_en: '' }] },
        orderBy: { published_at: 'desc' },
        take: 50
    });
    console.log(`Found ${news.length} news items to translate.`);
    for (const n of news) {
        console.log(`Translating news: ${n.title}`);
        const titleEn = await translateFree(n.title);
        const summaryEn = n.summary ? await translateFree(n.summary) : '';
        await prisma.news.update({
            where: { id: n.id },
            data: { title_en: titleEn, summary_en: summaryEn, seo_title_en: titleEn }
        });
    }

    console.log('Content refresh complete.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
