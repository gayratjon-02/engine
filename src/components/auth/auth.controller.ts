import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { AuthMember } from './decorators/authMember.decorator';
import { RegisterDto } from 'src/libs/dto/user/register.dto';
import { LoginDto } from 'src/libs/dto/user/login.dto';
import type { Request, Response } from 'express';
import type { GoogleProfile } from 'src/libs/dto/type/user/user.type';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly configService: ConfigService,
	) {}

	@Post('register')
	async register(@Body() input: RegisterDto) {
		return this.authService.register(input);
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	async login(@Body() input: LoginDto) {
		return this.authService.login(input);
	}

	@Get('getUser')
	@UseGuards(AuthGuard)
	async getUser(@AuthMember('id') userId: string) {
		return this.authService.getUser(userId);
	}

	@Get('google')
	@UseGuards(PassportAuthGuard('google'))
	async googleAuth() {}

	@Get('google/callback')
	@UseGuards(PassportAuthGuard('google'))
	async googleCallback(@Req() req: Request, @Res() res: Response) {
		const user: GoogleProfile = req.user as GoogleProfile;
		const result = await this.authService.googleLogin(user);
		const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
		res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
	}
}
