import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { SUBSCRIPTION_PLAN } from 'src/libs/dto/enum/sub.plan';

@Controller('subscription')
export class SubscriptionController {
	constructor(private readonly subscriptionService: SubscriptionService) {}

	@Get('current')
	@UseGuards(AuthGuard)
	async getCurrentPlan(@AuthMember('id') userId: string) {
		return this.subscriptionService.getCurrentPlan(userId);
	}

	@Post('upgrade')
	@UseGuards(AuthGuard)
	async upgradePlan(@AuthMember('id') userId: string, @Body('plan') plan: SUBSCRIPTION_PLAN) {
		return this.subscriptionService.upgradePlan(userId, plan);
	}

	@Post('cancel')
	@UseGuards(AuthGuard)
	async cancelSubscription(@AuthMember('id') userId: string) {
		return this.subscriptionService.cancelSubscription(userId);
	}
}
