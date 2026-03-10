import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RedirectMiddleware implements NestMiddleware {
    constructor(private prisma: PrismaService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        // Only handle GET requests for non-API routes
        if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }

        try {
            const path = req.path;
            const redirect = await this.prisma.redirect.findUnique({
                where: { source_url: path },
            });

            if (redirect) {
                return res.redirect(redirect.code || 301, redirect.target_url);
            }
        } catch (error) {
            console.error('Redirect middleware error:', error);
        }

        next();
    }
}
