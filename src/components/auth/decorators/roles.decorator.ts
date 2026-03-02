import { SetMetadata } from '@nestjs/common';
import { SUBSCRIPTION_PLAN } from 'src/libs/dto/enum/sub.plan';

export const PLAN_KEY = 'requiredPlan';
export const PlanRequired = (plan: SUBSCRIPTION_PLAN) => SetMetadata(PLAN_KEY, plan);
