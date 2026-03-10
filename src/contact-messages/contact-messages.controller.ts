import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ContactMessagesService } from './contact-messages.service';

@Controller('contact-messages')
export class ContactMessagesController {
    constructor(private readonly contactMessagesService: ContactMessagesService) { }

    @Post()
    create(@Body() createData: any) {
        return this.contactMessagesService.create(createData);
    }

    @Get()
    findAll(@Query('is_read') is_read?: string) {
        const isReadBool = is_read === 'true' ? true : (is_read === 'false' ? false : undefined);
        return this.contactMessagesService.findAll(isReadBool);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateData: any) {
        return this.contactMessagesService.update(+id, updateData);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.contactMessagesService.remove(+id);
    }
}
