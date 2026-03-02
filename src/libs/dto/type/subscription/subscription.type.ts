import type { SUBSCRIPTION_PLAN, PLAN_STATUS } from 'src/libs/dto/enum/sub.plan';

export interface SubscriptionResponse {
	id: string;
	plan: SUBSCRIPTION_PLAN;
	status: PLAN_STATUS;
	currentPeriodStart: Date | null;
	currentPeriodEnd: Date | null;
	createdAt: Date;
}

export interface PlanInfo {
	plan: SUBSCRIPTION_PLAN;
	name: string;
	price: number;
	features: string[];
}
