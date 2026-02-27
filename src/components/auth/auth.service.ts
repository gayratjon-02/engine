import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../libs/entity/user.entity';
import { RegisterDto } from '../../libs/dto/user/register.dto';
import { Message } from 'src/libs/dto/enum/common.enum';
import { Repository } from 'typeorm';
import { AuthResponse } from 'src/libs/dto/type/user/register.type';
import { LoginDto } from 'src/libs/dto/user/login.dto';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
		private readonly jwtService: JwtService,
	) {}

	// Register
	public async register(input: RegisterDto): Promise<AuthResponse> {
		console.log('auth service: register');
		const exists = await this.userRepo.findOne({
			where: { email: input.email },
		});

		if (exists) {
			throw new ConflictException(Message.EMAIL_ALREADY_REGISTERED);
		}

		const passwordHash = await bcrypt.hash(input.password, 12);

		const user = this.userRepo.create({
			email: input.email,
			passwordHash,
			name: input.name || input.email.split('@')[0],
		});

		await this.userRepo.save(user);

		return this.buildAuthResponse(user);
	}

	// login
	public async login(input: LoginDto): Promise<AuthResponse> {
		console.log('auth service: login');
		const user = await this.userRepo.findOne({
			where: { email: input.email },
		});

		if (!user || !user.passwordHash) throw new UnauthorizedException(Message.INVALID_EMAIL_OR_PASSWORD);

		const valid = await bcrypt.compare(input.password, user.passwordHash);
		if (!valid) throw new UnauthorizedException(Message.INVALID_EMAIL_OR_PASSWORD);

		return this.buildAuthResponse(user);
	}

	private buildAuthResponse(user: User) {
		const token = this.jwtService.sign({ sub: user.id, email: user.email });

		return {
			accessToken: token,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				avatarUrl: user.avatarUrl,
			},
		};
	}
}
