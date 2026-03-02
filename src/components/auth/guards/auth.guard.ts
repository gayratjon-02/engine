import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Message } from 'src/libs/dto/enum/common.enum';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
	handleRequest(err: any, user: any) {
		if (err || !user) {
			throw new UnauthorizedException(Message.AUTHENTICATION_REQUIRED);
		}

		return user;
	}
}
