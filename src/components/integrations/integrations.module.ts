import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformConnection } from 'src/libs/entity/platform-connection.entity';
import { Brand } from 'src/libs/entity/brand.entity';
import { ShopifyOrder } from 'src/libs/entity/shopify-order.entity';
import { ShopifyOrderItem } from 'src/libs/entity/shopify-order-item.entity';
import { ShopifyCustomer } from 'src/libs/entity/shopify-customer.entity';
import { ShopifyProduct } from 'src/libs/entity/shopify-product.entity';
import { ShopifyRefund } from 'src/libs/entity/shopify-refund.entity';
import { ShopifyCheckout } from 'src/libs/entity/shopify-checkout.entity';
import { ProductCost } from 'src/libs/entity/product-cost.entity';
import { DailyBrandMetric } from 'src/libs/entity/daily-brand-metric.entity';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { BrandModule } from 'src/components/brand/brand.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			PlatformConnection,
			Brand,
			ShopifyOrder,
			ShopifyOrderItem,
			ShopifyCustomer,
			ShopifyProduct,
			ShopifyRefund,
			ShopifyCheckout,
			ProductCost,
			DailyBrandMetric,
		]),
		BrandModule,
	],
	controllers: [IntegrationsController],
	providers: [IntegrationsService],
	exports: [IntegrationsService],
})
export class IntegrationsModule {}
