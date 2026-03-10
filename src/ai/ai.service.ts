import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private settingsService: SettingsService) { }

  async rewriteNews(title: string, summary: string, content: string): Promise<{ title: string; summary: string; content: string } | null> {
    const dbApiKey = await this.settingsService.findOne('AI_API_KEY');
    const dbApiUrl = await this.settingsService.findOne('AI_API_URL');

    const apiKey = dbApiKey?.value || process.env.AI_API_KEY;
    const apiUrl = dbApiUrl?.value || process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent';

    if (!apiKey) {
      this.logger.warn('AI_API_KEY is not set (neither in DB nor in ENV). Skipping AI rewrite.');
      return null;
    }

    try {
      this.logger.log(`AI Rewriting attempt for: ${title.substring(0, 50)}...`);
      
      const prompt = `
      Aşağıdaki haberi profesyonel bir haber editörü gibi, SEO dostu, özgün ve ilgi çekici bir şekilde yeniden yaz.
      Haberin özünü ve doğruluğunu bozma. 
      Lütfen yanıtında SADECE şu formatı kullan (başka açıklama ekleme):
      BAŞLIK: [Yeni Başlık]
      ÖZET: [Yeni Özet]
      İÇERİK: [Yeni İçerik (HTML formatında p ve h3 tagları ile)]

      ORİJİNAL HABER:
      BAŞLIK: ${title}
      ÖZET: ${summary}
      İÇERİK: ${content}
      `;

      let attempts = 0;
      const maxAttempts = 3;
      let response;

      while (attempts < maxAttempts) {
        try {
          response = await axios.post(`${apiUrl}?key=${apiKey}`, {
            contents: [{
              parts: [{ text: prompt }]
            }]
          }, {
            timeout: 30000 // 30 seconds timeout
          });
          break; // Success
        } catch (error) {
          attempts++;
          if (error.response?.status === 429 && attempts < maxAttempts) {
            const waitTime = attempts * 2000; // 2s, 4s backoff
            this.logger.warn(`AI Rate Limit (429) hit. Retrying in ${waitTime}ms... (Attempt ${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            throw error; // Rethrow if not 429 or last attempt
          }
        }
      }

      const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiText) {
        this.logger.error('AI Response is empty or invalid structure');
        return null;
      }

      this.logger.debug(`AI Raw Response: ${aiText.substring(0, 100)}...`);

      // More robust regex (case insensitive and supports various whitespace)
      const titleMatch = aiText.match(/BAŞLIK:\s*(.*)/i);
      const summaryMatch = aiText.match(/ÖZET:\s*([\s\S]*?)(?=İÇERİK:|$)/i);
      const contentMatch = aiText.match(/İÇERİK:\s*([\s\S]*)/i);

      const newTitle = titleMatch?.[1]?.trim() || title;
      const newSummary = summaryMatch?.[1]?.trim() || summary;
      let newContent = contentMatch?.[1]?.trim() || content;

      // Clean markdown code blocks if AI wrapped the HTML
      newContent = newContent.replace(/^```html\n?/, '').replace(/\n?```$/, '');

      this.logger.log(`AI Successfully rewrote: ${newTitle.substring(0, 50)}...`);

      // Small delay after success to breathe (15 RPM limit = 4s per request)
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        title: newTitle,
        summary: newSummary,
        content: newContent
      };
    } catch (error) {
      if (error.response) {
        this.logger.error(`AI API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else {
        this.logger.error(`Error in AI rewrite: ${error.message}`);
      }
      return null;
    }
  }
}
