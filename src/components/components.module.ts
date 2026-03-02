import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { BrandModule } from './brand/brand.module';

@Module({
	imports: [AuthModule, SubscriptionModule, BrandModule],
})
export class ComponentsModule {}
``