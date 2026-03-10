import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';

@Controller('activity-logs')
export class ActivityLogsController {
    constructor(private readonly activityLogsService: ActivityLogsService) { }

    @Post()
    create(@Body() createData: any) {
        return this.activityLogsService.create(createData);
    }

    @Get()
    findAll(@Query('page') page: string, @Query('limit') limit: string) {
        return this.activityLogsService.findAll(Number(page) || 1, Number(limit) || 20);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.activityLogsService.remove(+id);
    }

    @Delete()
    removeAll() {
        return this.activityLogsService.removeAll();
    }
}
