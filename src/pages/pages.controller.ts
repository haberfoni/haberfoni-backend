import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PagesService } from './pages.service';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) { }

  @Post()
  create(@Body() createPageDto: any) {
    return this.pagesService.create(createPageDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.pagesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePageDto: any) {
    return this.pagesService.update(+id, updatePageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pagesService.remove(+id);
  }
}
