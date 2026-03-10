import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) { }

  @Post()
  create(@Body() createNewsDto: CreateNewsDto) {
    return this.newsService.create(createNewsDto);
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('slug') slug?: string,
    @Query('status') status?: 'published' | 'draft',
    @Query('authorId') authorId?: number,
    @Query('isSlider') isSlider?: string,
    @Query('since') since?: string,
  ) {
    const parsedIsSlider = isSlider !== undefined ? isSlider === 'true' : undefined;
    return this.newsService.findAll({ page, limit, category, search, slug, status, authorId, isSlider: parsedIsSlider, since });
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.newsService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.newsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNewsDto: UpdateNewsDto) {
    return this.newsService.update(+id, updateNewsDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.newsService.remove(+id);
  }

  @Post('bulk-delete')
  bulkDelete(@Body() body: { ids: number[] }) {
    return this.newsService.bulkDelete(body.ids);
  }

  @Post(':id/increment-views')
  incrementViews(@Param('id') id: string) {
    return this.newsService.incrementViews(+id);
  }

  @Get(':id/tags')
  getTags(@Param('id') id: string) {
    return this.newsService.getTags(+id);
  }

  @Patch(':id/tags')
  updateTags(@Param('id') id: string, @Body() body: { tag_ids: any[] }) {
    return this.newsService.updateTags(+id, body.tag_ids);
  }
}
