
import { BotService } from '../bot.service';
import * as cheerio from 'cheerio';
import axios from 'axios';

const BLOCKED_IMAGE_PATTERNS = [
    'bip.png', 'bip.jpg',
    'next-header-aa', 'aa-logo',
    'dha-logo', 'default.jpg',
    'placeholder', 'logo.png', 'logo.jpg', 'logo.svg',
    'noimage', 'no-image', 'no_image',
];

function isBlockedImage(url: string | null | undefined): boolean {
    if (!url) return true;
    const lower = url.toLowerCase();
    return BLOCKED_IMAGE_PATTERNS.some(p => lower.includes(p));
}

export async function scrapeDHA(bot: BotService) {
    console.log('--- Starting DHA Scrape ---');
    try {
        const mappings = await bot.getBotMappings('DHA');

        if (!mappings || mappings.length === 0) {
            console.log('--- DHA Scrape Skipped (No mappings) ---');
            return;
        }

        let totalSaved = 0;
        for (const mapping of mappings) {
            if (mapping.is_active === false) {
                console.log(`Skipping DHA: ${mapping.source_url} (Mapping is inactive)`);
                continue;
            }
            console.log(`[DHA-START] Fetching: ${mapping.source_url} -> ${mapping.target_category}`);
            try {
                const response = await axios.get(mapping.source_url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
                    timeout: 30000
                });

                const $ = cheerio.load(response.data);
                const articles: any[] = [];

                // Targeted selectors for DHA main content areas
                let selector = '.nd-content-column a, .category-news-list a, .nd-news-list a, main a, article a, .news-card a';
                if ($(selector).length === 0) selector = 'a'; // Extremely loose fallback if nothing found

                $(selector).each((i, el) => {
                    const link = $(el).attr('href');
                    let title = $(el).attr('title') || $(el).text().trim();
                    const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
                    const imgAlt = $(el).find('img').attr('alt');

                    if (!title && imgAlt) title = imgAlt.trim();

                    if (link && title) {
                        const fullLink = link.startsWith('http') ? link : `https://www.dha.com.tr${link}`;

                        // Check if link is a valid news/video/gallery subpage
                        const isVideo = fullLink.includes('/video/') || fullLink.includes('-video-');
                        const isGallery = fullLink.includes('/foto-galeri/') || fullLink.includes('/fotograf-galeri/') || fullLink.includes('-galeri-') || fullLink.includes('-galerisi-');
                        const hasId = /\d+(\/)?$/.test(fullLink);

                        // Avoid scraping links that clearly belong to other segments in the footer/header
                        const isNav = fullLink.includes('/etiket/') || fullLink.includes('/yazarlar/') || fullLink.includes('/kunye/');

                        if (title.length > 10 && (isVideo || isGallery || hasId) && !isNav) {
                            articles.push({
                                title: title,
                                original_url: fullLink,
                                image_url: img && !isBlockedImage(img) ? (img.startsWith('http') ? img : `https://www.dha.com.tr${img}`) : null,
                                summary: '',
                                content: '',
                                source: 'DHA',
                                category: mapping.target_category,
                                detectedType: isVideo ? 'video' : (isGallery ? 'galeri' : 'news')
                            });
                        }
                    }
                });

                // Unique articles by URL
                console.log(`  Found ${articles.length} total candidate links for DHA.`);
                const uniqueArticles = [...new Map(articles.map(item => [item.original_url, item])).values()].slice(0, 30);
                let count = 0;

                for (const item of uniqueArticles) {
                    try {
                        const targetCat = mapping.target_category;
                        let success = false;
                        if (targetCat === 'videoGallery' || item.detectedType === 'video') {
                            const video = await scrapeDHAVideo(item.original_url, targetCat);
                            if (video) {
                                success = await bot.saveVideo(video);
                            }
                        } else if (targetCat === 'photoGallery' || item.detectedType === 'galeri') {
                            const gallery = await scrapeDHAGallery(item.original_url, targetCat);
                            if (gallery) {
                                success = await bot.saveGallery(gallery);
                            }
                        } else {
                            const article = await scrapeDHAArticle(item, targetCat);
                            if (article) {
                                success = await bot.saveNews(article);
                            }
                        }

                        if (success) {
                            count++;
                            console.log(`    [DHA-SAVE-OK] (${count}/${uniqueArticles.length}): ${item.original_url}`);
                        } else {
                            console.log(`    [DHA-SAVE-SKIP/FAIL]: ${item.original_url}`);
                        }
                        // Small delay between each article
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (detailErr: any) {
                        console.error(`Status check: Failed to scrape detail for ${item.original_url}: ${detailErr.message}`);
                    }
                }

                console.log(`   Saved ${count} items for ${mapping.target_category}`);
                totalSaved += count;
                await bot.updateMappingStatus(mapping.source_url, 'Success', count);

            } catch (err) {
                console.error(`Error scraping DHA mapping ${mapping.source_url}:`, err.message);
                await bot.updateMappingStatus(mapping.source_url, 'Failed', 0);
            }
        }
        console.log(`--- DHA Scrape Finished. Saved ${totalSaved} new items. ---`);
    } catch (error) {
        console.error('Error scraping DHA:', error);
    }
}

/**
 * Scrapes a DHA Video page
 */
async function scrapeDHAVideo(url: string, targetCategory: string) {
    try {
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 });
        const $ = cheerio.load(response.data);

        const title = $('h1').first().text().trim();
        let description = '';

        // 1. Try to get full content from JSON-LD first (often very complete)
        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const json = JSON.parse($(el).html() || '');
                if (json.articleBody && json.articleBody.trim().length > (description?.length || 0)) {
                    description = json.articleBody.trim();
                }
            } catch (e) { }
        });

        if (!description || description.length < 50) {
            description = $('meta[name="description"]').attr('content') ||
                $('meta[property="og:description"]').attr('content') || '';
        }

        if (!description || description.length < 50) {
            const contentEl = $('.news-detail-text').length > 0 ? $('.news-detail-text') :
                ($('.nd-article-content').length > 0 ? $('.nd-article-content') : $('.nd-content-column'));

            if (contentEl.length > 0) {
                const paras = contentEl.find('p').map((i, el) => `<p>${$(el).text().trim()}</p>`).get().join('');
                if (paras) description = paras;
            } else {
                const videoDesc = $('.video-description').first().text().trim() ||
                    $('.description').first().text().trim() ||
                    $('.nd-article-spot').first().text().trim() ||
                    $('article p').first().text().trim();
                if (videoDesc) description = videoDesc;
            }
        }

        let author = $('meta[name="author"]').attr('content') ||
            $('.news-detail-editor-name').text().trim() ||
            $('.news-source-info').text().trim() ||
            $('.video-info > div > span').first().text().trim() ||
            $('.video-info').text().split('GÜNCELLENME')[0].trim();

        if (!author || author.length < 3) {
            const searchAreas = [$('.news-detail-text').text(), $('.video-info').text(), $('article').text(), $('.video-description').text()];
            for (const text of searchAreas) {
                if (!text) continue;
                const signatureMatch = text.match(/([A-ZÇĞİÖŞÜa-zçğıöşü\s-]{3,})\/([A-ZÇĞİÖŞÜa-zçğıöşü\s-]{3,}),\s*\(DHA\)/);
                if (signatureMatch) {
                    author = signatureMatch[1].trim();
                    break;
                }
                const dhaMatch = text.match(/([A-ZÇĞİÖŞÜa-zçğıöşü\s-]{5,})(?=\/.*\(DHA\))/);
                if (dhaMatch) {
                    author = dhaMatch[1].trim();
                    break;
                }
            }
        }

        const thumbnail = $('meta[property="og:image"]').attr('content') || '';

        let videoUrl = $('video source').attr('src') || $('video').attr('src') || '';

        if (!videoUrl) {
            const html = response.data;
            const m3u8Match = html.match(/(?:source:|src:|file:|url:|thumbnailUrl\s*:\s*)['"](.*?(?:playlist\.m3u8|\.mp4))['"]/i);
            if (m3u8Match && m3u8Match[1]) {
                videoUrl = m3u8Match[1];
                if (videoUrl.startsWith('//')) videoUrl = 'https:' + videoUrl;
            }
        }

        if (!videoUrl) {
            videoUrl = $('iframe[src*="dha.com.tr/video"]').attr('src') ||
                $('iframe[src*="youtube"]').attr('src') ||
                $('meta[property="og:video:secure_url"]').attr('content') ||
                $('meta[name="twitter:player"]').attr('content') || '';

            const ogVideo = $('meta[property="og:video"]').attr('content') || $('meta[property="og:video:url"]').attr('content');
            if (!videoUrl && ogVideo && (ogVideo.includes('.mp4') || ogVideo.includes('embed') || ogVideo.includes('/video'))) {
                videoUrl = ogVideo;
            }
        }

        const finalTitle = title || $('meta[property="og:title"]').attr('content') || $('title').text().trim();
        
        if (!videoUrl || videoUrl === url || finalTitle.length < 5) return null;

        // Ensure it looks somewhat like a media or embed URL
        if (!videoUrl.includes('.mp4') && !videoUrl.includes('.m3u8') && !videoUrl.includes('youtube') && !videoUrl.includes('embed') && !videoUrl.includes('/video')) {
            return null;
        }
        if (author) {
            author = author.replace(/[\/-]$/, '').replace(/,\s*\(DHA\)-?\s*$/, '').trim();
        }

        return {
            title,
            video_url: videoUrl.startsWith('//') ? 'https:' + videoUrl : videoUrl,
            thumbnail_url: thumbnail,
            description,
            author,
            source: 'DHA',
            original_url: url
        };
    } catch (e) {
        return null;
    }
}

/**
 * Scrapes a DHA Photo Gallery page
 */
async function scrapeDHAGallery(url: string, targetCategory: string) {
    try {
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 });
        const $ = cheerio.load(response.data);

        const title = $('h1').first().text().trim();
        let description = '';

        // 1. Try to get full content from JSON-LD first
        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const json = JSON.parse($(el).html() || '');
                if (json.articleBody && json.articleBody.trim().length > (description?.length || 0)) {
                    description = json.articleBody.trim();
                }
            } catch (e) { }
        });

        if (!description || description.length < 50) {
            description = $('meta[name="description"]').attr('content') ||
                $('meta[property="og:description"]').attr('content') || '';
        }

        if (!description || description.length < 50) {
            const contentEl = $('.news-detail-text').length > 0 ? $('.news-detail-text') :
                ($('.nd-article-content').length > 0 ? $('.nd-article-content') : $('.nd-content-column'));
            if (contentEl.length > 0) {
                const paraText = contentEl.find('p, div.description').map((i, el) => `<p>${$(el).text().trim()}</p>`).get().join('');
                if (paraText) description = paraText;
            } else {
                const firstPara = $('.description').first().text().trim() ||
                    $('.nd-article-spot').first().text().trim() ||
                    $('article p').first().text().trim() ||
                    $('.video-description').first().text().trim();
                if (firstPara) description = firstPara;
            }
        }

        let author = $('meta[name="author"]').attr('content') ||
            $('.news-detail-editor-name').text().trim() ||
            $('.news-source-info').text().trim() ||
            $('.video-info > div > span').first().text().trim() ||
            $('.video-info').text().split('GÜNCELLENME')[0].trim();

        if (!author || author.length < 3) {
            const searchAreas = [$('.news-detail-text').text(), $('.video-info').text(), $('article').text(), $('.video-description').text()];
            for (const text of searchAreas) {
                if (!text) continue;
                const signatureMatch = text.match(/([A-ZÇĞİÖŞÜa-zçğıöşü\s-]{3,})\/([A-ZÇĞİÖŞÜa-zçğıöşü\s-]{3,}),\s*\(DHA\)/);
                if (signatureMatch) {
                    author = signatureMatch[1].trim();
                    break;
                }
                const dhaMatch = text.match(/([A-ZÇĞİÖŞÜa-zçğıöşü\s-]{5,})(?=\/.*\(DHA\))/);
                if (dhaMatch) {
                    author = dhaMatch[1].trim();
                    break;
                }
            }
        }

        const thumbnail = $('meta[property="og:image"]').attr('content') || '';

        // DHA gallery: captions are in h3.description elements, one per photo by index
        const captions: string[] = [];
        $('h3.description').each((i, el) => {
            captions.push($(el).text().trim());
        });

        const images: any[] = [];
        let imgIndex = 0;

        // 2. Map slides and check for videos
        $('img').each((i, el) => {
            const src = $(el).attr('data-src') || $(el).attr('src');
            if (src && src.includes('image.dha.com.tr') && !isBlockedImage(src)) {
                const caption = captions[imgIndex] || $(el).attr('alt') || '';

                // Check if this slide has a video (often DHA has a video button or specific class)
                // We'll also look at the script data for this specific index if possible
                let mediaType = 'image';
                let videoUrl = null;

                images.push({
                    url: src.startsWith('http') ? src : 'https://www.dha.com.tr' + src,
                    caption,
                    media_type: mediaType,
                    video_url: videoUrl
                });
                imgIndex++;
            }
        });

        // 3. Improve video detection in galleries via JSON-LD or script tags
        const html = response.data;
        const videoMatches = html.match(/videoUrl['"]\s*:\s*['"]([^'"]+\.(?:mp4|m3u8))['"]/g);
        if (videoMatches && videoMatches.length > 0) {
            // If we found videos, DHA often puts them in the first slide or specific slides.
            // For now, let's look for a primary video if it exists in JSON-LD
            $('script[type="application/ld+json"]').each((i, el) => {
                try {
                    const json = JSON.parse($(el).html() || '');
                    if (json['@type'] === 'VideoObject' && json.contentUrl && images.length > 0) {
                        // Mark the first image as a video slide if it matches the thumbnail or is the primary video
                        images[0].media_type = 'video';
                        images[0].video_url = json.contentUrl;
                    }
                } catch (e) { }
            });
        }

        // Search for videos within the gallery to prioritize thumbnail
        let prioritizedThumb = '';
        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const json = JSON.parse($(el).html() || '');
                if (json['@type'] === 'VideoObject' && json.thumbnailUrl) {
                    prioritizedThumb = json.thumbnailUrl;
                }
            } catch (e) { }
        });

        if (!prioritizedThumb) {
            prioritizedThumb = $('meta[property="og:image"]').attr('content') || (images.length > 0 ? images[0].url : '');
        }

        if (images.length === 0 || !title) return null;

        return {
            title,
            thumbnail_url: prioritizedThumb,
            description,
            author,
            source: 'DHA',
            original_url: url,
            images
        };
    } catch (e) {
        return null;
    }
}

/**
 * Scrapes a single DHA article page
 */
async function scrapeDHAArticle(item: any, targetCategory: string) {
    try {
        const url = item.original_url;
        const detailResponse = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 30000
        });
        const $detail = cheerio.load(detailResponse.data);

        // Extract Title if missing
        if (!item.title) {
            item.title = $detail('h1').first().text().trim() || $detail('title').text().trim();
        }

        // Extract Image if missing or was placeholder
        if (!item.image_url || isBlockedImage(item.image_url)) {
             const candidates = [
                $detail('meta[property="og:image"]').attr('content'),
                $detail('meta[name="twitter:image"]').attr('content'),
                $detail('.news-detail__image img').attr('data-src'),
                $detail('.news-detail__image img').attr('src'),
                $detail('.news-detail-image img').attr('data-src'),
                $detail('.news-detail-image img').attr('src'),
                $detail('.nd-article-content img').first().attr('data-src'),
                $detail('.nd-article-content img').first().attr('src'),
                $detail('article img').first().attr('data-src'),
                $detail('article img').first().attr('src'),
                $detail('.content-text img').first().attr('src'),
            ];
            for (const c of candidates) {
                if (c && !isBlockedImage(c) && !c.includes('base64')) {
                    item.image_url = c.startsWith('http') ? c : `https://www.dha.com.tr${c}`;
                    break;
                }
            }
        }

        // Extract summary (Spot) first
        let summary = $detail('h2').first().text().trim() ||
            $detail('.spot').text().trim() ||
            $detail('.news-detail-spot').text().trim() ||
            $detail('.description').text().trim();

        // Clean up DOM before extracting content
        $detail('script').remove();
        $detail('style').remove();
        $detail('.share-buttons').remove();
        $detail('.breadcrumb').remove();
        $detail('.tags').remove();
        $detail('.related-news').remove();
        $detail('.news-list').remove();
        $detail('.slider').remove();
        $detail('.swiper').remove();
        $detail('.similar-news').remove();
        $detail('.other-news').remove();
        $detail('.most-read').remove();
        $detail('.side-news').remove();
        $detail('.video-gallery').remove();
        $detail('.photo-gallery').remove();
        $detail('.ad-banner').remove();
        $detail('.etiketler').remove();
        $detail('.news-tags').remove();
        $detail('.article-tags').remove();
        $detail('.item-tags').remove();
        $detail('.news-detail-tags').remove();
        $detail('h1').remove(); // Remove title from content area

        // Remove summary/spot from content area to avoid duplication
        if (summary) {
            $detail('h2').filter((i, el) => $detail(el).text().trim() === summary).remove();
            $detail('.spot').remove();
            $detail('.news-detail-spot').remove();
        }

        // Try to find the specific content container
        let contentEl = $detail('.news-detail-text');
        if (contentEl.length === 0) contentEl = $detail('.nd-article-content');
        if (contentEl.length === 0) contentEl = $detail('.content-text');

        // If specific container found, get text from paragraphs and HEADERS to preserve structure
        let content = '';
        if (contentEl.length > 0) {
            // Select paragraphs, headers, lists, and IMAGES
            let stopExtraction = false;

            let rawContent = contentEl.find('p, h2, h3, h4, ul, ol, figure, img, iframe, video').map((i, el) => {
                if (stopExtraction) return '';

                const tag = el.tagName.toLowerCase();
                const $el = $detail(el);

                // Handle Images
                if (tag === 'img' || tag === 'figure') {
                    if (tag === 'img' && $el.closest('figure').length > 0) return '';

                    let imgEl = tag === 'img' ? $el : $el.find('img');
                    let src = imgEl.attr('data-src') || imgEl.attr('src');

                    if (src && !src.includes('base64') && !isBlockedImage(src)) {
                        if (!src.startsWith('http')) src = `https://www.dha.com.tr${src}`;
                        let caption = tag === 'figure' ? $el.find('figcaption').text().trim() : imgEl.attr('alt');
                        return `<figure class="my-6"><img src="${src}" alt="${caption || ''}" class="w-full h-auto rounded-lg shadow-md" /><figcaption class="text-sm text-gray-500 mt-2 text-center">${caption || ''}</figcaption></figure>`;
                    }
                    return '';
                }

                // Handle iframes (YouTube, Dailymotion, Vimeo, etc.)
                if (tag === 'iframe') {
                    const src = $el.attr('src') || '';
                    if (src && (src.includes('youtube') || src.includes('youtu.be') || src.includes('dailymotion') || src.includes('vimeo'))) {
                        return `<div class="my-6 aspect-video"><iframe src="${src}" class="w-full h-full rounded-lg" allowfullscreen></iframe></div>`;
                    }
                    return '';
                }

                // Handle native video tags
                if (tag === 'video') {
                    const src = $el.attr('src') || $el.find('source').attr('src') || '';
                    if (src && src.startsWith('http')) {
                        return `<div class="my-6"><video src="${src}" controls class="w-full rounded-lg"></video></div>`;
                    }
                    return '';
                }

                const text = $detail(el).text().trim();
                const upperText = text.toUpperCase();

                if (['GÜNCEL HABERLER', 'İLGİLİ HABERLER', 'DİĞER HABERLER', 'EN ÇOK OKUNANLAR', 'GÜNÜN ÖZETİ'].some(kw => text === kw)) {
                    stopExtraction = true;
                    return '';
                }

                if (['PAYLAŞ', 'X', 'ABONE OL', 'YAZDIR', 'KAYDET', 'KIŞ'].includes(upperText)) return '';
                if (text.length < 3 && !/^[.,!?-]$/.test(text) && !/^\d+$/.test(text)) return '';

                const links = $detail(el).find('a');
                if (links.length > 0) {
                    const linkText = links.text().replace(/\s+/g, '').length;
                    const totalTextLen = text.replace(/\s+/g, '').length;
                    if (totalTextLen > 0 && (linkText / totalTextLen) > 0.6) return '';
                    if (totalTextLen < 50) return '';
                }

                if (!text) return '';

                if (tag === 'p') return `<p>${$detail(el).html()?.trim()}</p>`;
                if (tag === 'h2' || tag === 'h3' || tag === 'h4') return `<h3>${text}</h3>`;
                if (tag === 'ul') return `<ul>${$detail(el).html()?.trim()}</ul>`;
                if (tag === 'ol') return `<ol>${$detail(el).html()?.trim()}</ol>`;
                return `<p>${text}</p>`;
            }).get();

            let contentArr = rawContent;

            // Before popping from the end, check if the last paragraph contains the author signature
            // This is common in DHA articles: "Gizem CENGİL-Emirhan YÜZÜGÜLDÜ/ANKARA, (DHA)-"
            const lastPara = contentArr.length > 0 ? contentArr[contentArr.length - 1].replace(/<[^>]*>/g, '').trim() : '';
            const signatureMatch = lastPara.match(/([^/]+)\/([^,]+),\s*\(DHA\)/i);
            if (signatureMatch) {
                // If it's a signature, we can extract the author from it and maybe keep it or handle it separately
                // For now, let's just make sure we don't pop it if it's the ONLY thing left or if it's clearly a signature
            }

            while (contentArr.length > 0) {
                const lastItem = contentArr[contentArr.length - 1];
                const cleanLast = lastItem.replace(/<[^>]*>/g, '').trim();

                // Don't pop if it looks like a DHA signature (Author/City, DHA)
                if (cleanLast.includes('(DHA)') || cleanLast.includes('DHA-')) {
                    break;
                }

                if (cleanLast.length < 5 || ['kış', 'yaz', 'etiketler', 'paylaş', 'x'].includes(cleanLast.toLowerCase())) {
                    contentArr.pop();
                } else {
                    break;
                }
            }
            content = contentArr.join('');
            if (!content) content = contentEl.html()?.trim() || '';
        } else {
            content = $detail('article p').map((i, el) => `<p>${$detail(el).text().trim()}</p>`).get().join('');
        }

        content = content.replace(/\s+/g, ' ').trim();

        if (!summary && content.length > 50) {
            summary = content.substring(0, 200) + '...';
        }
        if (!summary) summary = item.title;

        let author = $detail('meta[name="author"]').attr('content') ||
            $detail('.news-detail-editor-name').text().trim() ||
            $detail('.news-source-info').text().trim();

        if (!author) {
            // Updated regex to handle hyphens and multiple names common in DHA
            const contentText = $detail('.news-detail-text').text();

            // 1. Try to find "Name SURNAME/CITY, (DHA)" format
            const signatureMatch = contentText.match(/([A-ZÇĞİÖŞÜa-zçğıöşü\s-]{3,})\/([A-ZÇĞİÖŞÜa-zçğıöşü\s-]{3,}),\s*\(DHA\)/);
            if (signatureMatch) {
                author = signatureMatch[1].trim();
            }

            // 2. Fallback to the original regex or a slightly improved one if still no author
            if (!author) {
                const match = contentText.match(/([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)*\s+[A-ZÇĞİÖŞÜ]{2,}(?:-[A-ZÇĞİÖŞÜ][a-zçğıöşü]+\s+[A-ZÇĞİÖŞÜ]{2,})?)(?=\s*\/|\s*,)/);
                if (match) author = match[1];
            }

            // 3. One more check for just "(DHA)" at the end
            if (!author && contentText.includes('(DHA)')) {
                const dhaMatch = contentText.match(/([A-ZÇĞİÖŞÜa-zçğıöşü\s-]{5,})(?=\/.*\(DHA\))/);
                if (dhaMatch) author = dhaMatch[1].trim();
            }
        }

        summary = `${summary} - Demirören Haber Ajansı`;

        return {
            ...item,
            content: content,
            summary: summary,
            author: author,
        };
    } catch (detailErr) {
        return null;
    }
}
