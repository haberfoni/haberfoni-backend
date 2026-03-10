import { Controller, Post, Get, Param, Body, Delete } from '@nestjs/common';
import { BotService } from './bot.service';

@Controller('bot')
export class BotController {
    constructor(private readonly botService: BotService) { }

    @Post('run')
    async runBot() {
        // 1. Create PENDING command immediately to return ID
        const command = await this.botService.createCommand('FORCE_RUN');

        // 2. Trigger async processing without awaiting
        this.botService.scrapeAll(command.id).catch(err => console.error(err));

        return { message: 'Bot scraping started.', commandId: command.id };
    }

    @Get('status')
    async getStatus() {
        const latest = await this.botService.getLatestCommand();
        return latest || null;
    }

    @Post('reset')
    async resetBot() {
        const result = await this.botService.resetBotCommands();
        return { message: 'Bot status reset.', count: result.count };
    }

    @Get('settings')
    async getSettings() {
        return this.botService.getSettings();
    }

    @Post('settings/:id')
    async updateSetting(@Param('id') id: string, @Body() data: any) {
        return this.botService.updateSetting(+id, data);
    }

    @Get('mappings')
    async getAllMappings() {
        return this.botService.getAllMappings();
    }

    @Get('mappings/:source')
    async getMappings(@Param('source') source: string) {
        return this.botService.getBotMappings(source);
    }

    @Post('mappings')
    async addMapping(@Body() data: any) {
        return this.botService.addMapping(data);
    }

    @Delete('mappings/:id')
    async deleteMapping(@Param('id') id: string) {
        return this.botService.deleteMapping(+id);
    }

    @Post('mappings/:id/toggle')
    async toggleMapping(@Param('id') id: string, @Body('is_active') isActive: boolean) {
        return this.botService.toggleMapping(+id, isActive);
    }
}
