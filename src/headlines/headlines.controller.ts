import { Controller, Get, Post, Body, Delete, Query } from '@nestjs/common';
import { HeadlinesService } from './headlines.service';

@Controller('headlines')
export class HeadlinesController {
    constructor(private readonly headlinesService: HeadlinesService) { }

    @Post()
    create(@Body() createData: any) {
        return this.headlinesService.create(createData);
    }

    @Get()
    findAll(@Query('type') type?: string, @Query('news_id') news_id?: string) {
        return this.headlinesService.findAll(type ? +type : undefined, news_id);
    }

    @Delete()
    remove(@Query('order_index') order_index: string, @Query('type') type: string) {
        return this.headlinesService.removeBySlot(+order_index, +type);
    }
}
