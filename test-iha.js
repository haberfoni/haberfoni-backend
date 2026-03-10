const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeDHA(url) {
    try {
        console.log(`Scraping HTML page: ${url}`);
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 30000
        });
        const $ = cheerio.load(response.data);
        console.log("Success fetching DHA");
    } catch (e) {
        console.error("DHA error:", e.message);
    }
}

scrapeDHA('https://www.dha.com.tr/video/');

