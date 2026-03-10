import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Resend } from 'resend';

@Injectable()
export class SubscribersService {
    private readonly logger = new Logger(SubscribersService.name);

    constructor(private prisma: PrismaService) { }

    async create(email: string) {
        // Check if already exists
        const existing = await this.prisma.subscriber.findUnique({
            where: { email },
        });

        if (existing) {
            throw new ConflictException('Bu e-posta adresi zaten kayıtlı.');
        }

        return this.prisma.subscriber.create({
            data: { email },
        });
    }

    async findAll() {
        return this.prisma.subscriber.findMany({
            orderBy: { created_at: 'desc' },
        });
    }

    async remove(id: number) {
        return this.prisma.subscriber.delete({
            where: { id },
        });
    }

    private async getEmailConfig() {
        const settings = await this.prisma.siteSetting.findMany({
            where: {
                key: { in: ['resend_api_key', 'from_email'] },
            },
        });

        const apiKey = settings.find((s) => s.key === 'resend_api_key')?.value;
        const fromEmail = settings.find((s) => s.key === 'from_email')?.value;

        return { apiKey, fromEmail };
    }

    async sendNewsletter(subject: string, content: string, email?: string) {
        const { apiKey, fromEmail } = await this.getEmailConfig();

        if (!apiKey || !fromEmail) {
            this.logger.error('Email API key or Sender Email not configured in settings.');
            throw new Error('Email servisi yapılandırılmamış (API Key veya Gönderen Email eksik).');
        }

        const resend = new Resend(apiKey);
        let targetEmails: string[] = [];

        if (email) {
            targetEmails = [email];
        } else {
            const subscribers = await this.findAll();
            if (subscribers.length === 0) {
                return { success: true, count: 0, message: 'Bülten gönderilecek abone bulunamadı.' };
            }
            targetEmails = subscribers.map(s => s.email);
        }

        this.logger.log(`Sending newsletter: "${subject}" to ${targetEmails.length} recipients. Sender: ${fromEmail}`);

        const results = {
            successCount: 0,
            failCount: 0,
            errors: [] as { email: string; error: string }[]
        };

        // Resend batch API has a limit (usually 100), but we'll try sending in loop for individual error tracking
        // In a large production scale, you'd want a queue system (like BullMQ) and batching.
        for (const target of targetEmails) {
            try {
                const { data, error } = await resend.emails.send({
                    from: `Haberfoni Bülten <${fromEmail}>`,
                    to: target,
                    subject: subject,
                    html: content,
                });

                if (error) {
                    this.logger.error(`Failed to send to ${target}: ${error.message}`);
                    results.failCount++;
                    results.errors.push({ email: target, error: error.message });
                } else {
                    results.successCount++;
                }
            } catch (err) {
                this.logger.error(`Exception sending to ${target}: ${err.message}`);
                results.failCount++;
                results.errors.push({ email: target, error: err.message });
            }
        }

        return {
            success: results.successCount > 0,
            count: results.successCount,
            fails: results.failCount,
            errors: results.errors
        };
    }
}
