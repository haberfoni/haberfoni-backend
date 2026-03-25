import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('footer-sections')
export class FooterSectionsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() {
    const data = await this.prisma.footerSection.findMany({
      orderBy: { order_index: 'asc' },
      include: { Links: { orderBy: { order_index: 'asc' } } },
    });
    return { status: 'success', data };
  }

  @Post()
  async create(@Body() data: any) {
    const section = await this.prisma.footerSection.create({
      data: {
        title: data.title,
        title_en: data.title_en,
        type: data.type || 'custom_links',
        is_active: data.is_active ?? true,
        order_index: data.order_index || 0,
      },
    });
    return { status: 'success', data: section };
  }

  @Patch('reorder')
  async reorder(@Body() items: { id: number; order_index: number }[]) {
    for (const item of items) {
      await this.prisma.footerSection.update({
        where: { id: item.id },
        data: { order_index: item.order_index },
      });
    }
    return { status: 'success' };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    const section = await this.prisma.footerSection.update({
      where: { id: +id },
      data: {
        title: data.title,
        is_active: data.is_active,
        title_en: data.title_en,
      },
    });
    return { status: 'success', data: section };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.footerSection.delete({ where: { id: +id } });
    return { status: 'success' };
  }
}
