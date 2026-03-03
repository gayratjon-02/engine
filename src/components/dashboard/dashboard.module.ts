import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopifyOrder } from 'src/libs/entity/shopify-order.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { BrandModule } from 'src/components/brand/brand.module';

@Module({
	imports: [TypeOrmModule.forFeature([ShopifyOrder]), BrandModule],
	controllers: [DashboardController],
	providers: [DashboardService],
	exports: [DashboardService],
})
export class DashboardModule {}
