import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLAN_KEY } from 'src/components/auth/decorators/plan.decorator';
import { SubscriptionService } from 'src/components/subscription/subscription.service';
import { SUBSCRIPTION_PLAN } from 'src/libs/dto/enum/sub.plan';
import { Message } from 'src/libs/dto/enum/common.enum';

const PLAN_RANK: Record<SUBSCRIPTION_PLAN, number> = {
	[SUBSCRIPTION_PLAN.FREE]: 0,
	[SUBSCRIPTION_PLAN.PRO]: 1,
	[SUBSCRIPTION_PLAN.AGENCY]: 2,
};

@Injectable()
export class PlanGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly subscriptionService: SubscriptionService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredPlan = this.reflector.get<SUBSCRIPTION_PLAN>(PLAN_KEY, context.getHandler());
		if (!requiredPlan) return true;

		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (!user?.id) {
			throw new ForbiddenException(Message.AUTHENTICATION_REQUIRED);
		}

		const subscription = await this.subscriptionService.getCurrentPlan(user.id);

		if (PLAN_RANK[subscription.plan] >= PLAN_RANK[requiredPlan]) {
			return true;
		}

		throw new ForbiddenException(Message.INSUFFICIENT_PLAN);
	}
}
