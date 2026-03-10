import { Controller, Get, Post, Body, Param, Delete, HttpStatus, HttpCode } from '@nestjs/common';
import { SubscribersService } from './subscribers.service';

@Controller('subscribers')
export class SubscribersController {
    constructor(private readonly subscribersService: SubscribersService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body('email') email: string) {
        return this.subscribersService.create(email);
    }

    @Get()
    findAll() {
        return this.subscribersService.findAll();
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.subscribersService.remove(+id);
    }

    @Post('send')
    sendNewsletter(@Body() data: { subject: string; content: string; email?: string }) {
        return this.subscribersService.sendNewsletter(data.subject, data.content, data.email);
    }
}
