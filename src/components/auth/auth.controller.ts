import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from 'src/libs/dto/user/register.dto';
import { User } from 'src/libs/entity/user.entity';
import { AuthResponse } from 'src/libs/dto/type/user/register.type';
import { LoginDto } from 'src/libs/dto/user/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthMember } from './decorators/authMember.decorator';
import { UserResponse } from 'src/libs/dto/type/user/user.type';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	// Register
	@Post('register')
	public async register(@Body() input: RegisterDto): Promise<AuthResponse> {
		console.log('auth controller: register');
		return this.authService.register(input);
	}

	// login
	@Post('login')
	public async login(@Body() input: LoginDto): Promise<AuthResponse> {
		console.log('auth controller: login');
		return this.authService.login(input);
	}

	@Get('getUser')
	@UseGuards(AuthGuard('jwt'))
	public async getUser(@AuthMember('id') userId: string): Promise<UserResponse> {
		console.log('auth controller: getUser');
		return this.authService.getUser(userId);
	}

	// Google login
	@Get('google')
	@UseGuards(AuthGuard('google'))
	async googleAuth() {}

	@Get('google/callback')
	@UseGuards(AuthGuard('google'))
	async googleCallback(@Req() req: any, @Res() res: any) {
		const result = await this.authService.googleLogin(req.user);
		const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
		res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
	}
}
