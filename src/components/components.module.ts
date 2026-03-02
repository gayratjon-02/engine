import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
	imports: [AuthModule, SubscriptionModule],
})
export class ComponentsModule {}
``