import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) { }

    @Post()
    create(@Body() createData: any) {
        return this.tagsService.create(createData);
    }

    @Get()
    findAll() {
        return this.tagsService.findAll();
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.tagsService.remove(+id);
    }
}
