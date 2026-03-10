import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GalleriesService {
    constructor(private prisma: PrismaService) { }

    async findAll(params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: 'published' | 'draft';
    }) {
        const { page = 1, limit = 20, search, status } = params;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (status) {
            if (status === 'published') {
                where.published_at = { not: null };
            } else if (status === 'draft') {
                where.published_at = null;
            }
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } }
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.photoGallery.findMany({
                skip,
                take: +limit,
                where,
                orderBy: { created_at: 'desc' },
                include: { gallery_images: true }
            }),
            this.prisma.photoGallery.count({ where })
        ]);

        return {
            data,
            meta: {
                total,
                page: +page,
                limit: +limit,
                totalPages: Math.ceil(total / +limit),
            }
        };
    }

    findOne(id: number) {
        return this.prisma.photoGallery.findUnique({
            where: { id },
            include: { gallery_images: { orderBy: { order_index: 'asc' } } }
        });
    }

    async create(data: any) {
        const { title, slug, ...rest } = data;
        return this.prisma.photoGallery.create({
            data: {
                ...rest,
                title,
                slug: slug || this.slugify(title),
            }
        });
    }

    async update(id: number, data: any) {
        return this.prisma.photoGallery.update({
            where: { id },
            data
        });
    }

    async remove(id: number) {
        return this.prisma.photoGallery.delete({
            where: { id }
        });
    }

    async bulkDelete(ids: number[]) {
        return this.prisma.photoGallery.deleteMany({
            where: { id: { in: ids } }
        });
    }

    async incrementViews(id: number) {
        return this.prisma.photoGallery.update({
            where: { id },
            data: { views: { increment: 1 } }
        });
    }

    // Gallery Images
    async syncImages(galleryId: number, images: any[]) {
        // Delete existing
        await this.prisma.photoGalleryImage.deleteMany({
            where: { gallery_id: galleryId }
        });

        if (images && images.length > 0) {
            await this.prisma.photoGalleryImage.createMany({
                data: images.map((img, index) => ({
                    gallery_id: galleryId,
                    image_url: img.image_url,
                    caption: img.caption || '',
                    order_index: img.order_index ?? index
                }))
            });
        }
        return true;
    }

    async deleteImages(galleryId: number) {
        return this.prisma.photoGalleryImage.deleteMany({
            where: { gallery_id: galleryId }
        });
    }

    private slugify(text: string) {
        return text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }
}
