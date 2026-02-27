import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../libs/entity/user.entity';
import { RegisterDto } from '../../libs/dto/user/register.dto';
import { Repository } from 'typeorm';
import { Message } from 'src/libs/dto/enum/common.enum';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
		private readonly jwtService: JwtService,
	) {}

	public async register(dto: RegisterDto) {
		const exists = await this.userRepo.findOne({
			where: { email: dto.email },
		});

		if (exists) {
			throw new ConflictException(Message.EMAIL_ALREADY_REGISTERED);
		}

		const passwordHash = await bcrypt.hash(dto.password, 12);

		const user = this.userRepo.create({
			email: dto.email,
			passwordHash,
			name: dto.name || dto.email.split('@')[0],
		});

		await this.userRepo.save(user);

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
