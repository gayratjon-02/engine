import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopifyProduct } from 'src/libs/entity/shopify-product.entity';
import { ProductCost } from 'src/libs/entity/product-cost.entity';
import { ShopifyService } from './shopify.service';
import { ShopifyController } from './shopify.controller';
import { BrandModule } from 'src/components/brand/brand.module';

@Module({
	imports: [TypeOrmModule.forFeature([ShopifyProduct, ProductCost]), BrandModule],
	controllers: [ShopifyController],
	providers: [ShopifyService],
	exports: [ShopifyService],
})
export class ShopifyModule {}
