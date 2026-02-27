import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from 'src/libs/dto/user/register.dto';
import { User } from 'src/libs/entity/user.entity';
import { AuthResponse } from 'src/libs/dto/type/user/register.type';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	public async register(@Body() input: RegisterDto): Promise<AuthResponse> {
		console.log('auth controller: register');
		return this.authService.register(input);
	}
}
