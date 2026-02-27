import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from 'src/libs/dto/user/register.dto';
import { User } from 'src/libs/entity/user.entity';
import { AuthResponse } from 'src/libs/dto/type/user/register.type';
import { LoginDto } from 'src/libs/dto/user/login.dto';

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
}
