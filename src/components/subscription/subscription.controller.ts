import { BadRequestException, Controller, Get, HttpCode, HttpStatus, Post, Body, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { SUBSCRIPTION_PLAN } from 'src/libs/dto/enum/sub.plan';
import { Message } from 'src/libs/dto/enum/common.enum';

const VALID_PLANS = Object.values(SUBSCRIPTION_PLAN);

@Controller('subscription')
export class SubscriptionController {
	constructor(private readonly subscriptionService: SubscriptionService) {}

	@Get('currentPlan')
	@UseGuards(AuthGuard)
	async getCurrentPlan(@AuthMember('id') userId: string) {
		return this.subscriptionService.getCurrentPlan(userId);
	}

	@Post('upgradePlan')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	async upgradePlan(@AuthMember('id') userId: string, @Body('plan') plan: string) {
		const normalized = plan?.toLowerCase() as SUBSCRIPTION_PLAN;
		if (!VALID_PLANS.includes(normalized)) {
			throw new BadRequestException(Message.INVALID_PLAN);
		}
		return this.subscriptionService.upgradePlan(userId, normalized);
	}

	@Post('cancelPlan')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	async cancelSubscription(@AuthMember('id') userId: string) {
		return this.subscriptionService.cancelSubscription(userId);
	}
}
