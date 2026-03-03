import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ShopifyProduct } from 'src/libs/entity/shopify-product.entity';
import { ShopifyOrder } from 'src/libs/entity/shopify-order.entity';
import { ShopifyOrderItem } from 'src/libs/entity/shopify-order-item.entity';
import { ShopifyCustomer } from 'src/libs/entity/shopify-customer.entity';
import { ShopifyRefund } from 'src/libs/entity/shopify-refund.entity';
import { ShopifyCheckout } from 'src/libs/entity/shopify-checkout.entity';
import { ProductCost } from 'src/libs/entity/product-cost.entity';
import { PlatformConnection } from 'src/libs/entity/platform-connection.entity';
import { Brand } from 'src/libs/entity/brand.entity';
import { ShopifyService } from './shopify.service';
import { ShopifySyncService } from './services/shopify-sync.service';
import { ShopifyController } from './shopify.controller';
import { BrandModule } from 'src/components/brand/brand.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			ShopifyProduct,
			ShopifyOrder,
			ShopifyOrderItem,
			ShopifyCustomer,
			ShopifyRefund,
			ShopifyCheckout,
			ProductCost,
			PlatformConnection,
			Brand,
		]),
		BrandModule,
		HttpModule,
	],
	controllers: [ShopifyController],
	providers: [ShopifyService, ShopifySyncService],
	exports: [ShopifyService, ShopifySyncService],
})
export class ShopifyModule {}
