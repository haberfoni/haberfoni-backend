import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { GalleriesService } from './galleries.service';

@Controller('galleries')
export class GalleriesController {
    constructor(private readonly galleriesService: GalleriesService) { }

    @Post()
    create(@Body() createGalleryDto: any) {
        return this.galleriesService.create(createGalleryDto);
    }

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('status') status?: 'published' | 'draft',
    ) {
        return this.galleriesService.findAll({
            page: page ? +page : 1,
            limit: limit ? +limit : 20,
            search,
            status,
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.galleriesService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateGalleryDto: any) {
        return this.galleriesService.update(+id, updateGalleryDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.galleriesService.remove(+id);
    }

    @Post('bulk-delete')
    bulkDelete(@Body('ids') ids: number[]) {
        return this.galleriesService.bulkDelete(ids);
    }

    @Post(':id/increment-views')
    incrementViews(@Param('id') id: string) {
        return this.galleriesService.incrementViews(+id);
    }

    // Gallery Images
    @Get(':id/images')
    getImages(@Param('id') id: string) {
        return this.galleriesService.findOne(+id).then(g => g?.gallery_images || []);
    }

    @Post(':id/images')
    syncImages(@Param('id') id: string, @Body('images') images: any[]) {
        return this.galleriesService.syncImages(+id, images);
    }

    @Delete(':id/images')
    deleteImages(@Param('id') id: string) {
        return this.galleriesService.deleteImages(+id);
    }
}
