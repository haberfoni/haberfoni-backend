import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    signIn(@Body() signInDto: any, @Req() req: Request) {
        const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip;
        return this.authService.login(signInDto.email, signInDto.password, ip as string);
    }
}
