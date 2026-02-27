import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
	handleRequest(err: any, user: any) {
		if (err || !user) {
			throw new UnauthorizedException('Authentication required');
		}

		return user;
	}
}
