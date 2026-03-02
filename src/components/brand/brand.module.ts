import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from 'src/libs/entity/brand.entity';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
	imports: [TypeOrmModule.forFeature([Brand]), SubscriptionModule],
	controllers: [BrandController],
	providers: [BrandService],
	exports: [BrandService],
})
export class BrandModule {}
