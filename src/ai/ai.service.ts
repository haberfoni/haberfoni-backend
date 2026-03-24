import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private settingsService: SettingsService) { }

  private async getAiConfig() {
    const dbApiKey = await this.settingsService.findOne('AI_API_KEY');
    const dbApiUrl = await this.settingsService.findOne('AI_API_URL');
    const groqKey = await this.settingsService.findOne('GROQ_API_KEY');

    let apiKey = dbApiKey?.value || process.env.AI_API_KEY;
    let apiUrl = dbApiUrl?.value || process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent';

    if (apiUrl.includes('groq') && groqKey?.value) {
        apiKey = groqKey.value;
    }

    return { apiKey, apiUrl };
  }

  private async callAi(prompt: string): Promise<string | null> {
    let { apiKey, apiUrl } = await this.getAiConfig();
    if (!apiKey) return null;

    const groqKey = await this.settingsService.findOne('GROQ_API_KEY');
    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        const isGemini = apiUrl.includes('generativelanguage.googleapis.com');
        try {
            let response;
            if (isGemini) {
                this.logger.log(`Attempting AI call with Gemini...`);
                response = await axios.post(`${apiUrl}?key=${apiKey}`, {
                    contents: [{ parts: [{ text: prompt }] }]
                }, { timeout: 35000 });
                
                const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                await this.settingsService.update('AI_QUOTA_EXCEEDED', 'false');
                return aiText;
            } else {
                this.logger.log(`Attempting AI call with OpenAI/Groq format...`);
                response = await axios.post(apiUrl, {
                    model: apiUrl.includes('groq') ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                }, {
                    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                    timeout: 35000
                });
                
                const aiText = response.data?.choices?.[0]?.message?.content;
                await this.settingsService.update('AI_QUOTA_EXCEEDED', 'false');
                return aiText;
            }
        } catch (error) {
            attempts++;
            const status = error.response?.status;
            
            if (status === 429) {
                this.logger.error(`AI Quota Exceeded (429) for ${apiUrl.includes('gemini') ? 'Gemini' : 'Current API'}`);
                await this.settingsService.update('AI_QUOTA_EXCEEDED', 'true');

                // AUTOMATIC FALLBACK TO GROQ
                if (apiUrl.includes('gemini') && groqKey?.value) {
                    this.logger.warn(`Gemini Failed. Automatically falling back to Groq for this request.`);
                    apiKey = groqKey.value;
                    apiUrl = groqUrl;
                    attempts = 0; // Reset attempts for the new model
                    continue;
                }
            }

            if ((status === 429 || status === 503) && attempts < maxAttempts) {
                const waitTime = status === 429 ? attempts * 3000 : 2000;
                this.logger.warn(`AI API ${status} hit. Retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                this.logger.error(`AI Error (${status || 'unknown'}): ${error.message}`);
                break;
            }
        }
    }
    return null;
  }

  async rewriteNews(title: string, summary: string, content: string): Promise<{ 
    title: string; 
    summary: string; 
    content: string; 
    title_en?: string;
    summary_en?: string;
    content_en?: string;
    seo_title_en?: string;
    seo_description_en?: string;
    seo_keywords_en?: string;
    model: string; 
  } | null> {
    const { apiUrl } = await this.getAiConfig();
    const prompt = `
      Aşağıdaki haberi profesyonel bir haber editörü gibi, SEO dostu, özgün ve ilgi çekici bir şekilde yeniden yaz.
      Ayrıca haberi aynı formatta İNGİLİZCEYE çevir.
      Lütfen yanıtında SADECE şu formatı kullan (başka açıklama ekleme):
      BAŞLIK: [Yeni Türkçe Başlık]
      ÖZET: [Yeni Türkçe Özet]
      İÇERİK: [Yeni Türkçe İçerik (HTML p ve h3 tagları ile)]
      
      BAŞLIK_EN: [Yeni İngilizce Başlık]
      ÖZET_EN: [Yeni İngilizce Özet]
      İÇERİK_EN: [Yeni İngilizce İçerik (HTML p ve h3 tagları ile)]
      SEO_TITLE_EN: [İngilizce SEO Başlığı]
      SEO_DESC_EN: [İngilizce SEO Açıklaması]
      SEO_KEYS_EN: [İngilizce Anahtar Kelimeler]

      ORİJİNAL HABER:
      BAŞLIK: ${title}
      ÖZET: ${summary}
      İÇERİK: ${content}
    `;

    const aiText = await this.callAi(prompt);
    if (!aiText) return null;

    const titleMatch = aiText.match(/BAŞLIK:\s*(.*)/i);
    const summaryMatch = aiText.match(/ÖZET:\s*([\s\S]*?)(?=İÇERİK:|$)/i);
    const contentMatch = aiText.match(/İÇERİK:\s*([\s\S]*?)(?=BAŞLIK_EN:|$)/i);
    const titleEnMatch = aiText.match(/BAŞLIK_EN:\s*(.*)/i);
    const summaryEnMatch = aiText.match(/ÖZET_EN:\s*([\s\S]*?)(?=İÇERİK_EN:|$)/i);
    const contentEnMatch = aiText.match(/İÇERİK_EN:\s*([\s\S]*?)(?=SEO_TITLE_EN:|$)/i);
    const stEnMatch = aiText.match(/SEO_TITLE_EN:\s*(.*)/i);
    const sdEnMatch = aiText.match(/SEO_DESC_EN:\s*(.*)/i);
    const skEnMatch = aiText.match(/SEO_KEYS_EN:\s*(.*)/i);

    const cleanHtml = (html: string | undefined): string => {
        if (!html) return '';
        return html.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();
    }

    const result = {
      title: titleMatch?.[1]?.trim() || title,
      summary: summaryMatch?.[1]?.trim() || summary,
      content: cleanHtml(contentMatch?.[1]),
      title_en: titleEnMatch?.[1]?.trim(),
      summary_en: summaryEnMatch?.[1]?.trim(),
      content_en: cleanHtml(contentEnMatch?.[1]),
      seo_title_en: stEnMatch?.[1]?.trim(),
      seo_description_en: sdEnMatch?.[1]?.trim(),
      seo_keywords_en: skEnMatch?.[1]?.trim(),
      model: apiUrl.includes('openai') ? 'GPT' : (apiUrl.includes('groq') ? 'Groq' : 'Gemini')
    };

    this.logger.log(`AI Successfully rewrote news: ${result.title.substring(0, 50)}...`);
    return result;
  }

  async rewriteVisualContent(title: string, description: string): Promise<{ 
    title: string; 
    description: string; 
    seo_title: string; 
    seo_description: string; 
    seo_keywords: string;
    title_en?: string;
    description_en?: string;
    seo_title_en?: string;
    seo_description_en?: string;
    seo_keywords_en?: string;
    model: string;
  } | null> {
    const { apiUrl } = await this.getAiConfig();
    const prompt = `
      Aşağıdaki video veya galeri içeriğini profesyonel bir editör gibi, SEO dostu ve ilgi çekici bir şekilde yeniden yaz.
      Ayrıca içeriği aynı formatta İNGİLİZCEYE çevir.
      Lütfen yanıtında SADECE şu formatı kullan (başka açıklama ekleme):
      BAŞLIK: [Yeni Türkçe Başlık]
      AÇIKLAMA: [Yeni Türkçe Açıklama]
      SEO_BASLIK: [Türkçe SEO Başlığı]
      SEO_ACIKLAMA: [Türkçe SEO Açıklaması]
      ANAHTAR_KELIMELER: [Türkçe Etiketler]
      
      BAŞLIK_EN: [Yeni İngilizce Başlık]
      AÇIKLAMA_EN: [Yeni İngilizce Açıklama]
      SEO_BASLIK_EN: [İngilizce SEO Başlığı]
      SEO_ACIKLAMA_EN: [İngilizce SEO Açıklaması]
      ANAHTAR_KELIMELER_EN: [İngilizce Etiketler]

      ORİJİNAL İÇERİK:
      BAŞLIK: ${title}
      AÇIKLAMA: ${description || 'Açıklama yok'}
    `;

    const aiText = await this.callAi(prompt);
    if (!aiText) return null;

    const titleMatch = aiText.match(/BAŞLIK:\s*(.*)/i);
    const descMatch = aiText.match(/AÇIKLAMA:\s*([\s\S]*?)(?=SEO_BASLIK:|$)/i);
    const seoTitleMatch = aiText.match(/SEO_BASLIK:\s*(.*)/i);
    const seoDescMatch = aiText.match(/SEO_ACIKLAMA:\s*(.*)/i);
    const keywordsMatch = aiText.match(/ANAHTAR_KELIMELER:\s*([\s\S]*?)(?=BAŞLIK_EN:|$)/i);
    const titleEnMatch = aiText.match(/BAŞLIK_EN:\s*(.*)/i);
    const descEnMatch = aiText.match(/AÇIKLAMA_EN:\s*([\s\S]*?)(?=SEO_BASLIK_EN:|$)/i);
    const seoTitleEnMatch = aiText.match(/SEO_BASLIK_EN:\s*(.*)/i);
    const seoDescEnMatch = aiText.match(/SEO_ACIKLAMA_EN:\s*(.*)/i);
    const keywordsEnMatch = aiText.match(/ANAHTAR_KELIMELER_EN:\s*([\s\S]*)/i);

    const result = {
      title: titleMatch?.[1]?.trim() || title,
      description: descMatch?.[1]?.trim() || (description || ''),
      seo_title: seoTitleMatch?.[1]?.trim() || title,
      seo_description: seoDescMatch?.[1]?.trim() || '',
      seo_keywords: keywordsMatch?.[1]?.trim() || '',
      title_en: titleEnMatch?.[1]?.trim(),
      description_en: descEnMatch?.[1]?.trim(),
      seo_title_en: seoTitleEnMatch?.[1]?.trim(),
      seo_description_en: seoDescEnMatch?.[1]?.trim(),
      seo_keywords_en: keywordsEnMatch?.[1]?.trim(),
      model: apiUrl.includes('openai') ? 'GPT' : (apiUrl.includes('groq') ? 'Groq' : 'Gemini')
    };

    this.logger.log(`AI Successfully rewrote visual content: ${result.title.substring(0, 50)}...`);
    return result;
  }

  async generateSocialPosts(title: string, summary: string): Promise<{ x: string; instagram: string; facebook: string } | null> {
    this.logger.log(`AI Social Media post generation for: ${title.substring(0, 50)}...`);

    const prompt = `
    Aşağıdaki haber için X (Twitter), Instagram ve Facebook platformlarına uygun, etkileşim artırıcı sosyal medya paylaşımları hazırla.
    Lütfen yanıtında SADECE şu formatı kullan (başka açıklama ekleme):
    X: [Tweet metni, gerekirse 2-3 tweetlik flood yap, en sonuna hashtag ekle]
    INSTAGRAM: [Emojili, ilgi çekici açıklama metni ve hashtagler]
    FACEBOOK: [Haberin özeti ve okumaya teşvik eden profesyonel bir metin]

    HABER BAŞLIĞI: ${title}
    HABER ÖZETİ: ${summary}
    `;

    const aiText = await this.callAi(prompt);
    if (!aiText) return null;

    const xMatch = aiText.match(/X:\s*([\s\S]*?)(?=INSTAGRAM:|$)/i);
    const igMatch = aiText.match(/INSTAGRAM:\s*([\s\S]*?)(?=FACEBOOK:|$)/i);
    const fbMatch = aiText.match(/FACEBOOK:\s*([\s\S]*)/i);

    return {
      x: xMatch?.[1]?.trim() || '',
      instagram: igMatch?.[1]?.trim() || '',
      facebook: fbMatch?.[1]?.trim() || ''
    };
  }
  
  async translateFree(text: string, targetLanguage: string = 'en'): Promise<string> {
    if (!text) return '';
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await axios.get(url);
      
      if (response.data && response.data[0]) {
        const result = response.data[0].map((part: any) => part[0]).join('');
        this.logger.debug(`Free translation (${targetLanguage}) success: ${text.substring(0, 30)}... -> ${result.substring(0, 30)}...`);
        return result;
      }
      return text;
    } catch (error) {
      this.logger.error(`Error in free translation: ${error.message}`);
      return text;
    }
  }

  async translateHtmlFree(html: string, targetLanguage: string = 'en'): Promise<string> {
    if (!html) return '';
    try {
      // Basic approach: translate each sentence while trying to keep tags. 
      // For a more robust version, we would parse with cheerio, but for now, simple translation might suffice or we translate paragraphs.
      const paragraphs = html.split(/<\/p>/i);
      const translatedParagraphs = await Promise.all(paragraphs.map(async p => {
          if (!p.trim()) return '';
          const cleanText = p.replace(/<[^>]*>/g, '').trim();
          if (!cleanText) return p + '</p>';
          const translatedText = await this.translateFree(cleanText, targetLanguage);
          
          // If cleanText matches exactly, we can try to preserve outer tags,
          // but if it has inner tags, replace will fail.
          // Safest to just return the translated text wrapped in <p>
          return `<p>${translatedText}</p>`;
      }));
      return translatedParagraphs.join('');
    } catch (error) {
      return html;
    }
  }
}
