import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private activityLogsService: ActivityLogsService
    ) { }

    async login(email: string, pass: string, ip?: string) {
        const user = await this.usersService.findByEmail(email);

        if (!user || user.password !== pass) {
            await this.logFailedAttempt(email, ip);
            throw new UnauthorizedException('E-posta veya şifre hatalı.');
        }

        if (!user.is_active) {
            await this.logFailedAttempt(email, ip, 'Pasif hesap');
            throw new UnauthorizedException('Hesabınız pasif durumdadır.');
        }

        const { password, ...result } = user;
        
        // Log successful login
        await this.activityLogsService.create({
            action_type: 'LOGIN',
            entity_type: 'USER',
            entity_id: user.id,
            user_id: user.id,
            description: 'Sisteme giriş yapıldı.',
            ip_address: ip
        }).catch(() => {});

        return {
            user: result,
            access_token: 'dummy-jwt-token-for-now', // In a real app, use @nestjs/jwt
        };
    }

    private async logFailedAttempt(email: string, ip?: string, reason: string = 'Hatalı şifre') {
        try {
            await this.activityLogsService.create({
                action_type: 'FAILED_LOGIN',
                entity_type: 'AUTH',
                description: `Başarısız giriş denemesi (${reason}) - Email: ${email}`,
                ip_address: ip
            });
        } catch (error) {
            // Fail silently
        }
    }
}
