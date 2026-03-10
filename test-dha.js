const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeDHACandidates(url, targetCategory) {
    try {
        console.log(`Scraping DHA HTML page: ${url}`);
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 });
        const $ = cheerio.load(response.data);
        const articles = [];

        $('a').each((i, el) => {
            const link = $(el).attr('href');
            let title = $(el).attr('title') || $(el).text().trim();
            const imgAlt = $(el).find('img').attr('alt');
            if (!title && imgAlt) title = imgAlt.trim();

            if (link && title) {
                if (title.length > 10) {
                    const fullLink = link.startsWith('http') ? link : `https://www.dha.com.tr${link}`;
                    articles.push({ original_url: fullLink, title: title });
                }
            }
        });
        console.log(`Found ${articles.length} total candidate links for DHA.`);
        const uniqueArticles = [...new Map(articles.map(item => [item.original_url, item])).values()].slice(0, 50);
        console.log(`Processing ${uniqueArticles.length} unique DHA links.`);
        
        for (const item of uniqueArticles) {
            const isVideoLink = item.original_url.includes('/video-') || item.original_url.includes('-video-');
            if(isVideoLink) console.log("Is Video Link:", item.original_url);
        }
    } catch(e) {
        console.error("Error", e);
    }
}
scrapeDHACandidates('https://www.dha.com.tr/video/', 'video');
