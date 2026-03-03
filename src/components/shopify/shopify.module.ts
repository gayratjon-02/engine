import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopifyProduct } from 'src/libs/entity/shopify-product.entity';
import { ShopifyOrder } from 'src/libs/entity/shopify-order.entity';
import { ShopifyCustomer } from 'src/libs/entity/shopify-customer.entity';
import { ShopifyRefund } from 'src/libs/entity/shopify-refund.entity';
import { ShopifyCheckout } from 'src/libs/entity/shopify-checkout.entity';
import { ProductCost } from 'src/libs/entity/product-cost.entity';
import { ShopifyService } from './shopify.service';
import { ShopifyController } from './shopify.controller';
import { BrandModule } from 'src/components/brand/brand.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			ShopifyProduct,
			ShopifyOrder,
			ShopifyCustomer,
			ShopifyRefund,
			ShopifyCheckout,
			ProductCost,
		]),
		BrandModule,
	],
	controllers: [ShopifyController],
	providers: [ShopifyService],
	exports: [ShopifyService],
})
export class ShopifyModule {}
