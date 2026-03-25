import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private settingsService: SettingsService) { }

  private async getAiConfig() {
    const dbApiKey = await this.settingsService.findOne('ai_api_key');
    const dbApiUrl = await this.settingsService.findOne('ai_api_url');
    const dbGroqKey = await this.settingsService.findOne('groq_api_key');

    // ONLY use DB settings as per user request (no .env fallback)
    let apiKey = dbApiKey?.value;
    let apiUrl = dbApiUrl?.value || 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
    const groqKey = dbGroqKey?.value;

    if (apiUrl.includes('groq') && groqKey) {
        apiKey = groqKey;
    }

    return { apiKey, apiUrl, groqKey };
  }

  private async callAi(prompt: string): Promise<{ text: string; model: string } | null> {
    const { apiKey: initialKey, apiUrl: initialUrl, groqKey } = await this.getAiConfig();
    let apiKey = initialKey?.trim();
    let apiUrl = initialUrl?.trim();

    this.logger.log(`AI Config Loaded. Key: ${apiKey ? 'PRESENT' : 'MISSING'} | URL: ${apiUrl} | GroqKey: ${groqKey ? 'PRESENT' : 'MISSING'}`);

    if (!apiKey) {
      this.logger.error('No AI API Key found in DB');
      return null;
    }

    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    let attempts = 0;
    const maxAttempts = 3;
    let lastUsedModel = apiUrl.includes('gemini') ? 'Gemini' : (apiUrl.includes('groq') ? 'Groq' : 'AI');

    while (attempts < maxAttempts) {
        const isGemini = apiUrl.includes('generativelanguage.googleapis.com');
        try {
            let response;
            if (isGemini) {
                lastUsedModel = 'Gemini';
                this.logger.log(`Attempting AI call with Gemini (${apiUrl.split('/').pop()?.split(':')[0]})...`);
                response = await axios.post(`${apiUrl}?key=${apiKey}`, {
                    contents: [{ parts: [{ text: prompt }] }]
                }, { timeout: 35000 });
                
                const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!aiText) throw new Error('Empty response from AI');
                
                await this.settingsService.update('ai_quota_exceeded', 'false');
                await this.settingsService.update('ai_active_platform', lastUsedModel);
                return { text: aiText, model: lastUsedModel };
            } else {
                lastUsedModel = apiUrl.includes('groq') ? 'Groq' : 'AI';
                this.logger.log(`Attempting AI call with OpenAI/Groq format (${lastUsedModel})...`);
                response = await axios.post(apiUrl, {
                    model: apiUrl.includes('groq') ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                }, {
                    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                    timeout: 35000
                });
                
                const aiText = response.data?.choices?.[0]?.message?.content;
                if (!aiText) throw new Error('Empty response from AI');

                await this.settingsService.update('ai_quota_exceeded', 'false');
                await this.settingsService.update('ai_active_platform', lastUsedModel);
                return { text: aiText, model: lastUsedModel };
            }
        } catch (error) {
            attempts++;
            const status = error.response?.status;
            
            if (status === 403 || status === 404) {
                this.logger.error(`AI Error (${status}): ${status === 403 ? 'Forbidden' : 'Not Found'}.`);
                this.logger.error(`URL: ${apiUrl.substring(0, 50)}... | Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'MISSING'}`);
            }

            if (status === 429 || ((status === 403 || status === 404) && isGemini)) {
                const failedModel = apiUrl.includes('gemini') ? 'Gemini' : (apiUrl.includes('groq') ? 'Groq' : 'AI');
                this.logger.error(`AI Error (${status}) for ${failedModel}`);
                
                if (status === 429) {
                    await this.settingsService.update('ai_failed_platform', failedModel);
                    // Don't set quota_exceeded to true yet if we're falling back from Gemini to Groq
                    if (failedModel !== 'Gemini' || !groqKey) {
                        await this.settingsService.update('ai_quota_exceeded', 'true');
                    }
                }

                // AUTOMATIC FALLBACK TO GROQ
                if (apiUrl.includes('gemini') && groqKey) {
                    this.logger.warn(`Gemini Problem. Automatically falling back to Groq for this request.`);
                    apiKey = groqKey;
                    apiUrl = groqUrl;
                    attempts = 0; // Reset attempts for the new model
                    continue; // BACK TO TOP WITH GROQ
                }
            }

            // Standard Retries or Break
            if ((status === 429 || status === 503) && attempts < maxAttempts) {
                const waitTime = status === 429 ? attempts * 3000 : 2000;
                this.logger.warn(`AI API ${status} hit. Retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                this.logger.error(`AI Error (${status || 'unknown'}): ${error.message}`);
                if (error.response?.data) {
                    this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
                }
                break; // FINAL FAIL
            }
        }
    }
    
    // If all attempts failed, it will fallback to original content
    await this.settingsService.update('ai_active_platform', 'Orijinal Kaynak (Yapay Zeka Kapalı)');
    return null;
  }

  async rewriteNews(title: string, summary: string, content: string): Promise<any> {
    const prompt = `
      Aşağıdaki haberi profesyonel bir haber editörü gibi, SEO dostu, özgün ve ilgi çekici bir şekilde yeniden yaz.
      Ayrıca haberi aynı formatta İNGİLİZCEYE çevir.
      Lütfen yanıtında SADECE şu formatı kullan (başka açıklama ekleme):
      **Başlık:** [Yeni Türkçe Başlık]
      **Özet:** [Yeni Türkçe Özet]
      **Haber Metni:** [Yeni Türkçe İçerik (HTML p ve h3 tagları ile)]
      
      **Title (EN):** [Yeni İngilizce Başlık]
      **Summary (EN):** [Yeni İngilizce Özet]
      **Content (EN):** [Yeni İngilizce İçerik (HTML p ve h3 tagları ile)]
      
      **SEO Title:** [Türkçe SEO Başlığı]
      **SEO Description:** [Türkçe SEO Açıklaması]
      **SEO Keywords:** [Türkçe Etiketler]
      
      **SEO Title (EN):** [İngilizce SEO Başlığı]
      **SEO Description (EN):** [İngilizce SEO Açıklaması]
      **SEO Keywords (EN):** [İngilizce Etiketler]

      ORİJİNAL HABER:
      BAŞLIK: ${title}
      ÖZET: ${summary}
      İÇERİK: ${content}
    `;

    const result = await this.callAi(prompt);
    if (!result || !result.text) return null;
    
    const parsed = this.parseAiResponse(result.text, result.model);
    if (!parsed) return null;

    this.logger.log(`AI Successfully rewrote news: ${parsed.title.substring(0, 50)}... (${result.model})`);
    
    return {
        ...parsed,
        title: parsed.title || title,
        summary: parsed.summary || summary,
        content: parsed.content || content,
        model: result.model
    };
  }

  async rewriteVisualContent(title: string, description: string): Promise<any> {
    const prompt = `
      Aşağıdaki video veya galeri içeriğini profesyonel bir editör gibi, SEO dostu ve ilgi çekici bir şekilde yeniden yaz.
      Ayrıca içeriği aynı formatta İNGİLİZCEYE çevir.
      Lütfen yanıtında SADECE şu formatı kullan (başka açıklama ekleme):
      **Başlık:** [Yeni Türkçe Başlık]
      **Açıklama:** [Yeni Türkçe Açıklama]
      **SEO Title:** [Türkçe SEO Başlığı]
      **SEO Description:** [Türkçe SEO Açıklaması]
      **SEO Keywords:** [Türkçe Etiketler]
      
      **Title (EN):** [Yeni İngilizce Başlık]
      **Description (EN):** [Yeni İngilizce Açıklama]
      **SEO Title (EN):** [İngilizce SEO Başlığı]
      **SEO Description (EN):** [İngilizce SEO Açıklaması]
      **SEO Keywords (EN):** [İngilizce Etiketler]

      ORİJİNAL İÇERİK:
      BAŞLIK: ${title}
      AÇIKLAMA: ${description || 'Açıklama yok'}
    `;

    const result = await this.callAi(prompt);
    if (!result || !result.text) return null;

    const parsed = this.parseAiResponse(result.text, result.model);
    if (!parsed) return null;

    this.logger.log(`AI Successfully rewrote visual content: ${parsed.title.substring(0, 50)}... (${result.model})`);
    
    return {
        ...parsed,
        title: parsed.title || title,
        description: parsed.description || description,
        model: result.model
    };
  }

  private parseAiResponse(aiText: string, modelName: string): any {
    if (!aiText) return null;

    const cleanHtml = (html: string | undefined): string | undefined => {
      if (!html) return undefined;
      return html.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();
    };

    const titleMatch = aiText.match(/\*\*Başlık:\*\*\s*(.*)/i);
    const summaryMatch = aiText.match(/\*\*Özet:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
    const contentMatch = aiText.match(/\*\*Haber Metni:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
    const descriptionMatch = aiText.match(/\*\*Açıklama:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
    
    const titleEnMatch = aiText.match(/\*\*Title \(EN\):\*\*\s*(.*)/i);
    const summaryEnMatch = aiText.match(/\*\*Summary \(EN\):\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
    const contentEnMatch = aiText.match(/\*\*Content \(EN\):\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
    const descriptionEnMatch = aiText.match(/\*\*Description \(EN\):\*\*\s*([\s\S]*?)(?=\*\*|$)/i);

    const stMatch = aiText.match(/\*\*SEO Title:\*\*\s*(.*)/i);
    const sdMatch = aiText.match(/\*\*SEO Description:\*\*\s*(.*)/i);
    const skMatch = aiText.match(/\*\*SEO Keywords:\*\*\s*(.*)/i);
    
    const stEnMatch = aiText.match(/\*\*SEO Title \(EN\):\*\*\s*(.*)/i);
    const sdEnMatch = aiText.match(/\*\*SEO Description \(EN\):\*\*\s*(.*)/i);
    const skEnMatch = aiText.match(/\*\*SEO Keywords \(EN\):\*\*\s*(.*)/i);

    if (!titleMatch && !titleEnMatch) return null;

    return {
      title: titleMatch?.[1]?.trim() || titleEnMatch?.[1]?.trim() || '',
      summary: summaryMatch?.[1]?.trim(),
      content: cleanHtml(contentMatch?.[1]),
      description: descriptionMatch?.[1]?.trim(),
      title_en: titleEnMatch?.[1]?.trim(),
      summary_en: summaryEnMatch?.[1]?.trim(),
      content_en: cleanHtml(contentEnMatch?.[1]),
      description_en: descriptionEnMatch?.[1]?.trim(),
      seo_title: stMatch?.[1]?.trim(),
      seo_description: sdMatch?.[1]?.trim(),
      seo_keywords: skMatch?.[1]?.trim(),
      seo_title_en: stEnMatch?.[1]?.trim(),
      seo_description_en: sdEnMatch?.[1]?.trim(),
      seo_keywords_en: skEnMatch?.[1]?.trim(),
      model: modelName
    };
  }

  async generateSocialPosts(title: string, summary: string): Promise<{ x: string; instagram: string; facebook: string } | null> {
    const prompt = `
    Aşağıdaki haber için X (Twitter), Instagram ve Facebook platformlarına uygun, etkileşim artırıcı sosyal medya paylaşımları hazırla.
    Lütfen yanıtında SADECE şu formatı kullan (başka açıklama ekleme):
    X: [Tweet metni]
    INSTAGRAM: [Instagram metni]
    FACEBOOK: [Facebook metni]

    HABER BAŞLIĞI: ${title}
    HABER ÖZETİ: ${summary}
    `;

    const result = await this.callAi(prompt);
    if (!result || !result.text) return null;

    const xMatch = result.text.match(/X:\s*([\s\S]*?)(?=INSTAGRAM:|$)/i);
    const igMatch = result.text.match(/INSTAGRAM:\s*([\s\S]*?)(?=FACEBOOK:|$)/i);
    const fbMatch = result.text.match(/FACEBOOK:\s*([\s\S]*)/i);

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
        return response.data[0].map((part: any) => part[0]).join('');
      }
      return text;
    } catch (error) {
      return text;
    }
  }

  async translateHtmlFree(html: string, targetLanguage: string = 'en'): Promise<string> {
    if (!html) return '';
    try {
      const paragraphs = html.split(/<\/p>/i);
      const translatedParagraphs = await Promise.all(paragraphs.map(async p => {
          if (!p.trim()) return '';
          const cleanText = p.replace(/<[^>]*>/g, '').trim();
          if (!cleanText) return p + '</p>';
          const translatedText = await this.translateFree(cleanText, targetLanguage);
          return `<p>${translatedText}</p>`;
      }));
      return translatedParagraphs.join('');
    } catch (error) {
      return html;
    }
  }
}
