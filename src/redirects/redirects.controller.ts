import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RedirectsService } from './redirects.service';

@Controller('redirects')
export class RedirectsController {
    constructor(private readonly redirectsService: RedirectsService) { }

    @Post()
    create(@Body() createData: any) {
        return this.redirectsService.create(createData);
    }

    @Get('check')
    async check(@Query('path') path: string) {
        return this.redirectsService.findByPath(path);
    }

    @Get()
    findAll() {
        return this.redirectsService.findAll();
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateData: any) {
        return this.redirectsService.update(+id, updateData);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.redirectsService.remove(+id);
    }
}
