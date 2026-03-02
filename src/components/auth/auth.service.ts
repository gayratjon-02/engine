import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../libs/entity/user.entity';
import { RegisterDto } from '../../libs/dto/user/register.dto';
import { Message } from 'src/libs/dto/enum/common.enum';
import { Repository } from 'typeorm';
import { LoginDto } from 'src/libs/dto/user/login.dto';
import { SubscriptionService } from '../subscription/subscription.service';
import type { AuthResponse } from 'src/libs/dto/type/user/register.type';
import type { GoogleProfile } from 'src/libs/dto/type/user/user.type';

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
		private readonly jwtService: JwtService,
		private readonly subscriptionService: SubscriptionService,
	) {}

	async register(input: RegisterDto): Promise<AuthResponse> {
		const email = input.email.toLowerCase().trim();

		const exists = await this.userRepo.findOne({ where: { email } });
		if (exists) {
			throw new ConflictException(Message.EMAIL_ALREADY_REGISTERED);
		}

		const passwordHash = await bcrypt.hash(input.password, 12);

		const user = this.userRepo.create({
			email,
			passwordHash,
			name: input.name?.trim() || email.split('@')[0],
		});

		await this.userRepo.save(user);
		await this.subscriptionService.createFreeSubscription(user.id);
		this.logger.log(`User registered: ${user.id}`);

		return this.buildAuthResponse(user);
	}

	async login(input: LoginDto): Promise<AuthResponse> {
		const email = input.email.toLowerCase().trim();

		const user = await this.userRepo.findOne({ where: { email } });
		if (!user || !user.passwordHash) {
			throw new UnauthorizedException(Message.INVALID_EMAIL_OR_PASSWORD);
		}

		const valid = await bcrypt.compare(input.password, user.passwordHash);
		if (!valid) {
			throw new UnauthorizedException(Message.INVALID_EMAIL_OR_PASSWORD);
		}

		return this.buildAuthResponse(user);
	}

	async getUser(userId: string) {
		const user = await this.userRepo.findOne({ where: { id: userId } });
		if (!user) {
			throw new UnauthorizedException(Message.USER_NOT_FOUND);
		}

		return user;
	}

	async googleLogin(profile: GoogleProfile): Promise<AuthResponse> {
		const email = profile.email.toLowerCase().trim();

		let user = await this.userRepo.findOne({ where: { googleId: profile.googleId } });

		if (user) {
			if (profile.avatarUrl && profile.avatarUrl !== user.avatarUrl) {
				user.avatarUrl = profile.avatarUrl;
				await this.userRepo.save(user);
			}
			return this.buildAuthResponse(user);
		}

		user = await this.userRepo.findOne({ where: { email } });

		if (user) {
			user.googleId = profile.googleId;
			if (profile.avatarUrl) user.avatarUrl = profile.avatarUrl;
			await this.userRepo.save(user);
			this.logger.log(`Google linked to existing user: ${user.id}`);
		} else {
			user = this.userRepo.create({
				email,
				name: profile.name,
				googleId: profile.googleId,
				avatarUrl: profile.avatarUrl,
			});
			await this.userRepo.save(user);
			await this.subscriptionService.createFreeSubscription(user.id);
			this.logger.log(`New Google user created: ${user.id}`);
		}

		return this.buildAuthResponse(user);
	}

	private buildAuthResponse(user: User): AuthResponse {
		const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });

		return {
			accessToken,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				avatarUrl: user.avatarUrl,
			},
		};
	}
}
