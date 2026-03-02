import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from 'src/libs/entity/subscription.entity';
import { SUBSCRIPTION_PLAN, PLAN_STATUS } from 'src/libs/dto/enum/sub.plan';
import { Message } from 'src/libs/dto/enum/common.enum';

@Injectable()
export class SubscriptionService {
	private readonly logger = new Logger(SubscriptionService.name);

	constructor(
		@InjectRepository(Subscription)
		private readonly subRepo: Repository<Subscription>,
	) {}

	async createFreeSubscription(userId: string): Promise<Subscription> {
		const sub = this.subRepo.create({
			userId,
			plan: SUBSCRIPTION_PLAN.FREE,
			status: PLAN_STATUS.ACTIVE,
		});

		const saved = await this.subRepo.save(sub);
		this.logger.log(`Free subscription created for user: ${userId}`);

		return saved;
	}

	async getCurrentPlan(userId: string): Promise<Subscription> {
		const sub = await this.subRepo.findOne({ where: { userId } });

		if (!sub) {
			throw new NotFoundException(Message.SUBSCRIPTION_NOT_FOUND);
		}

		return sub;
	}

	async upgradePlan(userId: string, plan: SUBSCRIPTION_PLAN): Promise<Subscription> {
		const sub = await this.getCurrentPlan(userId);

		if (sub.plan === plan) {
			throw new BadRequestException(Message.ALREADY_ON_PLAN);
		}

		// Downgrade tekshiruv: agency → pro/free yoki pro → free
		const planRank = { [SUBSCRIPTION_PLAN.FREE]: 0, [SUBSCRIPTION_PLAN.PRO]: 1, [SUBSCRIPTION_PLAN.AGENCY]: 2 };
		if (planRank[plan] < planRank[sub.plan]) {
			throw new BadRequestException(Message.DOWNGRADE_NOT_ALLOWED);
		}

		sub.plan = plan;
		sub.status = PLAN_STATUS.ACTIVE;

		const saved = await this.subRepo.save(sub);
		this.logger.log(`User ${userId} upgraded to ${plan}`);

		return saved;
	}

	async cancelSubscription(userId: string): Promise<Subscription> {
		const sub = await this.getCurrentPlan(userId);

		if (sub.plan === SUBSCRIPTION_PLAN.FREE) {
			throw new BadRequestException('Free plan cannot be cancelled');
		}

		sub.status = PLAN_STATUS.CANCELLED;

		const saved = await this.subRepo.save(sub);
		this.logger.log(`User ${userId} cancelled subscription`);

		return saved;
	}

	async handleStripeWebhook(userId: string, plan: SUBSCRIPTION_PLAN, status: PLAN_STATUS, stripeData: { customerId: string; subscriptionId: string; periodStart: Date; periodEnd: Date }): Promise<Subscription> {
		let sub = await this.subRepo.findOne({ where: { userId } });

		if (!sub) {
			sub = this.subRepo.create({ userId });
		}

		sub.plan = plan;
		sub.status = status;
		sub.stripeCustomerId = stripeData.customerId;
		sub.stripeSubscriptionId = stripeData.subscriptionId;
		sub.currentPeriodStart = stripeData.periodStart;
		sub.currentPeriodEnd = stripeData.periodEnd;

		const saved = await this.subRepo.save(sub);
		this.logger.log(`Stripe webhook processed for user ${userId}: ${plan} / ${status}`);

		return saved;
	}
}
