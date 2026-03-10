import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Get()
    findAll(
        @Query('is_approved') is_approved?: string,
        @Query('news_id') news_id?: string
    ) {
        const isApprovedBool = is_approved === 'true' ? true : (is_approved === 'false' ? false : undefined);
        const newsIdNum = news_id ? +news_id : undefined;
        return this.commentsService.findAll(isApprovedBool, newsIdNum);
    }

    @Post()
    create(@Body() createData: any) {
        return this.commentsService.create(createData);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateData: any) {
        return this.commentsService.update(+id, updateData);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.commentsService.remove(+id);
    }
}
