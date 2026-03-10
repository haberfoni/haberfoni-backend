import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

@Controller('footer-sections')
export class FooterSectionsController {
  
  // Footer API is completely stubbed (returning empty)
  // Currently, frontend only reads it but doesn't manage it directly yet.
  // Returning empty array will stop the React frontend from throwing 404 Not Found error.
  
  @Get()
  findAll() {
    return {
      status: 'success',
      data: []
    };
  }

  @Post()
  create(@Body() createFooterSectionDto: any) {
    return { status: 'success', data: createFooterSectionDto };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFooterSectionDto: any) {
    return { status: 'success', data: updateFooterSectionDto };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return { status: 'success' };
  }
}
