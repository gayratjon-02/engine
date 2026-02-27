import { SetMetadata } from '@nestjs/common';

export const PLAN_KEY = 'requiredPlan';
export const PlanRequired = (plan: 'pro' | 'agency') => SetMetadata(PLAN_KEY, plan);
