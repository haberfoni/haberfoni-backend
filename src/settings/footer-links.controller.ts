import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('footer-links')
export class FooterLinksController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(@Query('section_id') sectionId?: string) {
    const where = sectionId ? { section_id: +sectionId } : {};
    const data = await this.prisma.footerLink.findMany({
      where,
      orderBy: { order_index: 'asc' },
    });
    return { status: 'success', data };
  }

  @Post()
  async create(@Body() data: any) {
    const link = await this.prisma.footerLink.create({
      data: {
        section_id: +data.section_id,
        title: data.title,
        url: data.url,
        order_index: data.order_index || 0,
        target: data.open_in_new_tab ? '_blank' : '_self',
        is_active: data.is_active ?? true,
      },
    });
    return { status: 'success', data: link };
  }

  @Patch('reorder')
  async reorder(@Body() items: { id: number; order_index: number }[]) {
    for (const item of items) {
      await this.prisma.footerLink.update({
        where: { id: item.id },
        data: { order_index: item.order_index },
      });
    }
    return { status: 'success' };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    const link = await this.prisma.footerLink.update({
      where: { id: +id },
      data: {
        title: data.title,
        url: data.url,
        target: data.open_in_new_tab ? '_blank' : '_self',
        is_active: data.is_active,
        title_en: data.title_en,
      },
    });
    return { status: 'success', data: link };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.footerLink.delete({ where: { id: +id } });
    return { status: 'success' };
  }
}
