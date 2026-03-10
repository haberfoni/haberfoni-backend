import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                is_active: true,
                created_at: true,
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async findOne(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                is_active: true,
                created_at: true,
            },
        });
        if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
        return user;
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async create(data: any) {
        const existing = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existing) {
            throw new ConflictException('Bu e-posta adresi zaten kullanımda.');
        }

        // Note: Password should be hashed in production
        return this.prisma.user.create({
            data: {
                email: data.email,
                password: data.password, // TODO: Use hashing
                full_name: data.full_name,
                role: data.role || 'author',
                is_active: true,
            },
        });
    }

    async update(id: number, data: any) {
        return this.prisma.user.update({
            where: { id },
            data: {
                full_name: data.full_name,
                role: data.role,
                is_active: data.is_active,
                // Only update password if provided
                ...(data.password ? { password: data.password } : {}),
            },
        });
    }

    async remove(id: number) {
        return this.prisma.user.delete({
            where: { id },
        });
    }
}
