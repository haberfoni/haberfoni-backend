import { Controller, Get, Patch, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('email-settings')
export class EmailSettingsController {
    constructor(private prisma: PrismaService) { }

    @Get()
    async getSettings() {
        const settings = await this.prisma.siteSetting.findMany({
            where: {
                key: { in: ['resend_api_key', 'from_email', 'email_service'] },
            },
        });

        const result = {
            api_key: settings.find((s) => s.key === 'resend_api_key')?.value || '',
            from_email: settings.find((s) => s.key === 'from_email')?.value || '',
            service: settings.find((s) => s.key === 'email_service')?.value || 'resend',
        };

        return result;
    }

    @Patch()
    async updateSettings(@Body() body: { api_key: string; from_email: string; service: string }) {
        const { api_key, from_email, service } = body;

        const updates = [
            { key: 'resend_api_key', value: api_key },
            { key: 'from_email', value: from_email },
            { key: 'email_service', value: service || 'resend' },
        ];

        for (const update of updates) {
            await this.prisma.siteSetting.upsert({
                where: { key: update.key },
                update: { value: update.value },
                create: { key: update.key, value: update.value },
            });
        }

        return { success: true };
    }
}
