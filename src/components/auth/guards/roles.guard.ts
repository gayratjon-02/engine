import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/components/auth/decorators/roles.decorator';
import { USER_ROLE } from 'src/libs/dto/enum/user.enum';
import { Message } from 'src/libs/dto/enum/common.enum';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<USER_ROLE[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredRoles || requiredRoles.length === 0) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (!user || !requiredRoles.includes(user.role)) {
			throw new ForbiddenException(Message.FORBIDDEN_RESOURCE);
		}

		return true;
	}
}
