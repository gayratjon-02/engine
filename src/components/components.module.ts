import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { BrandModule } from './brand/brand.module';
import { PreferenceModule } from './preference/preference.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ShopifyModule } from './shopify/shopify.module';
import { PnlModule } from './pnl/pnl.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
	imports: [
		AuthModule,
		SubscriptionModule,
		BrandModule,
		PreferenceModule,
		IntegrationsModule,
		ShopifyModule,
		PnlModule,
		DashboardModule,
	],
})
export class ComponentsModule {}
