
import { BotService } from '../bot.service';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as Parser from 'rss-parser';
import * as https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const parser = new Parser.default();

const BLOCKED_IMAGE_PATTERNS = [
    'bip.png', 'bip.jpg',
    'next-header-aa', 'aa-logo',
    'default.jpg', 'placeholder',
    'logo.png', 'logo.jpg', 'logo.svg',
    'noimage', 'no-image', 'no_image',
];

function isBlockedImage(url: string | null | undefined): boolean {
    if (!url) return true;
    const lower = url.toLowerCase();
    return BLOCKED_IMAGE_PATTERNS.some(p => lower.includes(p));
}

export async function scrapeIHA(bot: BotService) {
    console.log('--- Starting IHA Scrape ---');
    try {
        const mappings = await bot.getBotMappings('IHA');

        if (!mappings || mappings.length === 0) {
            console.log('--- IHA Scrape Skipped (No mappings) ---');
            return;
        }

        let totalSaved = 0;

        for (const mapping of mappings) {
            if (mapping.is_active === false) {
                console.log(`Skipping IHA: ${mapping.source_url} (Mapping is inactive)`);
                continue;
            }
            console.log(`[IHA-START] Fetching: ${mapping.source_url} -> ${mapping.target_category}`);

            try {
                let count = 0;

                // Check if URL is RSS or HTML
                if (mapping.source_url.includes('/rss/')) {
                    // RSS scraping
                    const feed = await parser.parseURL(mapping.source_url);

                    for (const item of feed.items) {
                        let imageUrl: string | null = null;
                        if (item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image')) {
                            imageUrl = isBlockedImage(item.enclosure.url) ? null : item.enclosure.url;
                        }

                        const newsItem = {
                            title: item.title,
                            summary: item.contentSnippet ? item.contentSnippet.trim() : '',
                            content: item.content || item.contentSnippet,
                            original_url: item.link,
                            image_url: imageUrl,
                            source: 'IHA',
                            category: mapping.target_category,
                            keywords: ''
                        };

                        const success = await bot.saveNews(newsItem);
                        if (success) count++;
                    }
                } else {
                    // HTML scraping
                    count = await scrapeIHAHTML(mapping.source_url, mapping.target_category, bot);
                }

                console.log(`   Saved ${count} items for ${mapping.target_category}`);
                totalSaved += count;

                // Log Success
                await bot.updateMappingStatus(mapping.source_url, 'Success', count);

            } catch (err) {
                console.error(`Error scraping IHA mapping ${mapping.source_url}:`, err.message);
                // Log Failure
                await bot.updateMappingStatus(mapping.source_url, 'Failed', 0);
            }
        }
        console.log(`--- IHA Scrape Finished. Saved ${totalSaved} new items. ---`);

    } catch (error) {
        console.error('Error scraping IHA:', error);
    }
}

/**
 * Scrapes an IHA HTML category page
 */
async function scrapeIHAHTML(url: string, targetCategory: string, bot: BotService): Promise<number> {
    try {
        console.log(`  Scraping HTML page: ${url}`);
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
            timeout: 30000,
            httpsAgent // Bypass SSL cert errors
        });
        const $ = cheerio.load(response.data);
        const articleLinks = new Set<string>();

        // Target specific category widgets to avoid scraping sidebar/breaking news
        // If no specific widgets are found (like on the video page), fall back to a broader set of links
        let selector = '.widget_General_Category_Dashboard a, .widget_General_Category_TopFive a, .widget_General_Category_All a, .widget_VideoNews_Dashboard a, .widget_VideoNews_TopFive a, .widget_VideoNews_All a';
        if ($(selector).length === 0) {
            selector = '.video-category-list a, .gallery-category-list a, main a, article a, .news-card a, .news-detail a';
        }

        $(selector).each((i, elem) => {
            const href = $(elem).attr('href');
            if (href) {
                const isMatch = (href.includes('/video-') || href.includes('/foto-galeri-') || href.includes('/haber-') || href.match(/-[\d]+\/?$/));
                if (isMatch) {
                    const fullUrl = href.startsWith('http') ? href : `https://www.iha.com.tr${href}`;
                    articleLinks.add(fullUrl);
                }
            }
        });

        console.log(`  Found ${articleLinks.size} candidate links for IHA. Sample:`, Array.from(articleLinks).slice(0, 3));
        let count = 0;
        const linksArray = Array.from(articleLinks).slice(0, 30);
        const BATCH_SIZE = 5;

        for (const articleUrl of linksArray) {
            try {
                const isVideoLink = articleUrl.includes('/video-');
                const isGalleryLink = articleUrl.includes('/foto-galeri-');

                let success = false;
                if (targetCategory === 'videoGallery' || isVideoLink) {
                    const video = await scrapeIHAVideo(articleUrl, targetCategory);
                    if (video) {
                        success = await bot.saveVideo(video);
                    }
                } else if (targetCategory === 'photoGallery' || isGalleryLink) {
                    const gallery = await scrapeIHAGallery(articleUrl, targetCategory);
                    if (gallery) {
                        success = await bot.saveGallery(gallery);
                    }
                } else {
                    const article = await scrapeIHAArticle(articleUrl, targetCategory);
                    if (article) {
                        success = await bot.saveNews(article);
                    }
                }
                if (success) {
                    count++;
                    console.log(`    [IHA-SAVE-OK] (${count}/${linksArray.length}): ${articleUrl}`);
                } else {
                    console.log(`    [IHA-SAVE-SKIP/FAIL]: ${articleUrl}`);
                }
                // Small delay between each article to prevent slamming the AI/Server
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err: any) {
                console.error(`  Error scraping article ${articleUrl}:`, err.message);
            }
        }
        return count;
    } catch (error: any) {
        console.error(`  Error fetching HTML page ${url}:`, error.message);
        return 0;
    }
}

async function scrapeIHAVideo(url: string, targetCategory: string) {
    try {
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000, httpsAgent });
        const $ = cheerio.load(response.data);

        const title = $('h1').first().text().trim();
        let description = $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') || '';

        if (!description || description.length < 50) {
            const firstPara = $('.video-detail-text p').first().text().trim() ||
                $('article p').first().text().trim();
            if (firstPara) description = firstPara;
        }

        const thumbnail = $('meta[property="og:image"]').attr('content') || '';

        let videoUrl = $('video source').attr('src') || $('video').attr('src') ||
            $('meta[property="og:video:url"]').attr('content') ||
            $('meta[property="og:video:secure_url"]').attr('content') ||
            $('meta[property="og:video"]').attr('content') ||
            $('meta[name="twitter:player"]').attr('content') ||
            $('iframe[src*="iha.com.tr/video"]').attr('src') ||
            $('iframe[src*="youtube"]').attr('src') || '';

        if (!videoUrl) {
            const html = response.data;
            const mp4Match = html.match(/mp4HD:\s*"([^"]+)"/);
            if (mp4Match) {
                videoUrl = mp4Match[1];
            } else {
                const mp4sdMatch = html.match(/mp4SD:\s*"([^"]+)"/);
                if (mp4sdMatch) {
                    videoUrl = mp4sdMatch[1];
                }
            }
        }

        // Fallback title if h1 is empty
        const finalTitle = title || $('meta[property="og:title"]').attr('content') || $('title').text().trim();

        if (!videoUrl || !finalTitle) return null;

        return {
            title: finalTitle,
            video_url: videoUrl.startsWith('//') ? 'https:' + videoUrl : videoUrl,
            thumbnail_url: thumbnail,
            description,
            source: 'IHA',
            original_url: url
        };
    } catch (e) {
        return null;
    }
}

async function scrapeIHAGallery(url: string, targetCategory: string) {
    try {
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000, httpsAgent });
        const $ = cheerio.load(response.data);

        const title = $('h1').first().text().trim();
        let description = $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') || '';

        if (!description || description.length < 50) {
            const firstPara = $('.gallery-detail-text p').first().text().trim() ||
                $('.news-detail-text p').first().text().trim() ||
                $('article p').first().text().trim();
            if (firstPara) description = firstPara;
        }

        const thumbnail = $('meta[property="og:image"]').attr('content') || '';

        const images: any[] = [];
        $('.gallery-img img, .photo-gallery img, article img').each((i, el) => {
            const src = $(el).attr('data-src') || $(el).attr('src');
            if (src && !isBlockedImage(src)) {
                images.push({
                    url: src.startsWith('http') ? src : 'https://www.iha.com.tr' + src,
                    caption: $(el).attr('alt') || ''
                });
            }
        });

        if (images.length === 0 || !title) return null;

        return {
            title,
            thumbnail_url: thumbnail || images[0].url,
            description,
            source: 'IHA',
            original_url: url,
            images
        };
    } catch (e) {
        return null;
    }
}

/**
 * Scrapes a single IHA article page
 */
async function scrapeIHAArticle(url: string, targetCategory: string) {
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 30000,
            httpsAgent
        });
        const $ = cheerio.load(response.data);

        const title = $('h1').first().text().trim() || $('title').text().trim();
        if (!title) return null;

        const summaryRaw = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
        let summary = summaryRaw.replace(/\s+/g, ' ').trim();

        // If meta description is too short/truncated, use the first paragraph from article body instead
        if (summary.length < 100 || !summary.endsWith('.')) {
            const contentContainersFallback = ['.widget_General_News_Detail', '.news-detail__content', '.habericerik', 'article'];
            for (const sel of contentContainersFallback) {
                const firstP = $(sel).find('p').first().text().trim();
                if (firstP && firstP.length > summary.length) {
                    summary = firstP;
                    break;
                }
            }
        }
        // Image Extraction - skip blocked/placeholder images
        let imageUrl: string | null = null;
        const candidates = [
            $('meta[property="og:image"]').attr('content'),
            $('div.gallery-img img').first().attr('src'),
            $('figure img').first().attr('src'),
            $('.article-img img').first().attr('src'),
            $('article img').first().attr('src'),
        ];
        for (const c of candidates) {
            if (c && !isBlockedImage(c)) {
                imageUrl = c.startsWith('http') ? c : 'https://www.iha.com.tr' + c;
                break;
            }
        }

        // Content Extraction
        $('script, style, .share-buttons, .tags, .related-news, .ad-banner, .breadcrumb, meta, iframe, noscript').remove();

        // Target content containers more broadly
        const contentContainers = ['.news-detail__content', '.widget_General_News_Detail .content', '.habericerik', '#habericerik', '.content-text', '[itemprop="articleBody"]', 'article .news-content', 'article'];
        let contentEl: any = null;

        for (const sel of contentContainers) {
            const el = $(sel);
            if (el && el.length > 0 && el.text().trim().length > 50) {
                contentEl = el.first();
                break;
            }
        }

        let content = '';
        if (contentEl) {
            const parts: string[] = [];
            // Improved extraction strategy: recursively find text-bearing tags in document order
            contentEl.find('p, h2, h3, h4, img, iframe').each((i, el) => {
                const tag = el.tagName.toLowerCase();
                const $el = $(el);

                if (tag === 'p' || tag.startsWith('h')) {
                    const text = $el.text().trim();
                    if (text.length > 10) {
                        parts.push(`<${tag}>${text}</${tag}>`);
                    }
                } else if (tag === 'img') {
                    let src = $el.attr('data-src') || $el.attr('src') || '';
                    if (src && !isBlockedImage(src)) {
                        if (!src.startsWith('http')) src = 'https://www.iha.com.tr' + src;
                        const alt = $el.attr('alt') || '';
                        parts.push(`<figure class="my-6"><img src="${src}" alt="${alt}" class="w-full h-auto rounded-lg" /></figure>`);
                    }
                } else if (tag === 'iframe') {
                    const src = $el.attr('src');
                    if (src && (src.includes('youtube') || src.includes('vimeo'))) {
                        parts.push(`<div class="video-wrapper my-6 relative w-full aspect-video"><iframe src="${src}" class="absolute top-0 left-0 w-full h-full rounded-lg" frameborder="0" allowfullscreen></iframe></div>`);
                    }
                }
            });

            // If finding structured tags yielded nothing, fallback to extracting raw text block
            if (parts.length === 0) {
                const pureText = contentEl.text().trim();
                const lines = pureText.split('\n').map(l => l.trim()).filter(l => l.length > 30);
                content = lines.map(l => `<p>${l}</p>`).join('');
            } else {
                content = parts.join('');
            }
        }

        // Extremely fallback
        if (!content || content.length < 50) {
            content = `<p>${summary}</p>`;
        }


        // Author Extraction
        let author = $('meta[name="author"]').attr('content') || '';
        if (!author) {
            // Try common IHA patterns or generic Regex
            const authorDateRegex = /([A-Za-zÇĞİÖŞÜçğıöşü\s]{2,50})\s+\|\s+\d{2}\.\d{2}\.\d{4}/;
            const match = content.match(authorDateRegex);
            if (match) author = match[1].trim();
        }

        return {
            title,
            summary: summary,
            content,
            original_url: url,
            image_url: imageUrl,
            source: 'IHA',
            author: author,
            category: targetCategory,
            keywords: ''
        };
    } catch (error) {
        throw new Error(`Failed to scrape article: ${error.message}`);
    }
}
