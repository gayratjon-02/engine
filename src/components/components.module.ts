import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { BrandModule } from './brand/brand.module';
import { PreferenceModule } from './preference/preference.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ShopifyModule } from './shopify/shopify.module';
import { PnlModule } from './pnl/pnl.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MetaModule } from './meta/meta.module';
import { GoogleAdsModule } from './google-ads/google-ads.module';

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
		MetaModule,
		GoogleAdsModule,
	],
})
export class ComponentsModule {}
