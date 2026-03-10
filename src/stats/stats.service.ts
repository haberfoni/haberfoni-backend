import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats() {
        const [activeNews, subscribers, totalComments, viewsResult] = await Promise.all([
            this.prisma.news.count({ where: { published_at: { not: null } } }),
            this.prisma.subscriber.count(),
            this.prisma.comment.count(),
            this.prisma.news.aggregate({
                _sum: {
                    views: true,
                },
            }),
        ]);

        return {
            activeNews,
            subscribers,
            totalComments,
            totalViews: viewsResult._sum.views || 0,
        };
    }

    async getCategoryStats() {
        // Group by category and count
        const stats = await this.prisma.news.groupBy({
            by: ['category'],
            _count: {
                category: true,
            },
            where: {
                published_at: { not: null },
            },
        });

        // Convert to map for easy frontend consumption { "gundem": 10, "spor": 5 }
        const result = {};
        stats.forEach(item => {
            if (item.category) {
                // Assuming category is slug in DB or we use raw value
                result[item.category] = item._count.category;
            }
        });

        return result;
    }
}
