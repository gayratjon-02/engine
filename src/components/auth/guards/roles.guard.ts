import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLAN_KEY } from '../decorators/roles.decorator';

@Injectable()
export class PlanGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredPlan = this.reflector.get<string>(PLAN_KEY, context.getHandler());
		if (!requiredPlan) return true;

		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (!user?.subscription?.plan) {
			throw new ForbiddenException('Pro subscription required');
		}

		const userPlan = user.subscription.plan;

		if (requiredPlan === 'pro') {
			if (userPlan === 'pro' || userPlan === 'agency') return true;
		}

		if (requiredPlan === 'agency') {
			if (userPlan === 'agency') return true;
		}

		throw new ForbiddenException(`${requiredPlan} plan required`);
	}
}
