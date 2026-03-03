import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCost } from 'src/libs/entity/product-cost.entity';
import { ShopifyProduct } from 'src/libs/entity/shopify-product.entity';
import { ShopifyOrder } from 'src/libs/entity/shopify-order.entity';
import { ShopifyOrderItem } from 'src/libs/entity/shopify-order-item.entity';
import { PnlService } from './pnl.service';
import { PnlController } from './pnl.controller';
import { BrandModule } from 'src/components/brand/brand.module';

@Module({
	imports: [TypeOrmModule.forFeature([ProductCost, ShopifyProduct, ShopifyOrder, ShopifyOrderItem]), BrandModule],
	controllers: [PnlController],
	providers: [PnlService],
	exports: [PnlService],
})
export class PnlModule {}
